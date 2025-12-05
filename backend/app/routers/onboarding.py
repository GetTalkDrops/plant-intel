"""
User Onboarding Endpoints

Handles organization setup and user profile creation after Clerk authentication.
Multi-tenant with org_id isolation.
"""

import logging
import os
from typing import Optional
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from supabase import create_client, Client

from app.middleware import get_current_user, audit_logger
from app.utils.error_tracking import track_error, track_business_error, ErrorCategory, ErrorSeverity

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_KEY", "")
)


# ============================================================================
# Request/Response Models
# ============================================================================

class OrganizationSetup(BaseModel):
    """Organization setup request"""
    company_name: str = Field(..., min_length=1, max_length=200, description="Company name")
    company_size: str = Field(..., description="Company size category")
    industry: str = Field(default="manufacturing", description="Industry")
    annual_revenue_range: Optional[str] = Field(None, description="Annual revenue range (e.g., '50M-100M')")
    phone: Optional[str] = Field(None, description="Company phone number")
    address: Optional[str] = Field(None, description="Company address")
    contact_name: Optional[str] = Field(None, description="Primary contact name")
    contact_email: Optional[EmailStr] = Field(None, description="Primary contact email")


class UserProfile(BaseModel):
    """User profile update request"""
    full_name: Optional[str] = Field(None, max_length=200)
    job_title: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = Field(None, max_length=100)
    preferences: Optional[dict] = Field(None, description="User preferences (theme, notifications, etc.)")


class OnboardingStatus(BaseModel):
    """Onboarding status response"""
    completed: bool
    steps: dict
    organization: Optional[dict] = None
    next_step: Optional[str] = None


# ============================================================================
# Organization Setup
# ============================================================================

@router.post("/onboarding/organization")
async def setup_organization(
    request: Request,
    org_setup: OrganizationSetup,
    user: dict = Depends(get_current_user)
):
    """
    Complete organization setup during onboarding

    This creates or updates the customer record for the organization.
    Called after Clerk authentication when user first signs up.

    Multi-tenant: Uses org_id from JWT token
    """
    try:
        org_id = user["org_id"]
        user_id = user["user_id"]

        logger.info(f"Setting up organization for org_id: {org_id}")

        # ========================================================================
        # Step 1: Check if organization already exists
        # ========================================================================
        existing = supabase.table("customers") \
            .select("*") \
            .eq("org_id", org_id) \
            .execute()

        # ========================================================================
        # Step 2: Create or update customer record
        # ========================================================================
        customer_data = {
            "org_id": org_id,
            "name": org_setup.company_name,
            "email": org_setup.contact_email or user.get("email"),
            "contact_name": org_setup.contact_name,
            "phone": org_setup.phone,
            "address": org_setup.address,
            "plan": "trial",  # Start with trial
            "status": "trial",
            "notes": f"Company Size: {org_setup.company_size}, Industry: {org_setup.industry}, Revenue: {org_setup.annual_revenue_range or 'Not specified'}",
            "updated_at": datetime.utcnow().isoformat()
        }

        if existing.data and len(existing.data) > 0:
            # Update existing organization
            result = supabase.table("customers") \
                .update(customer_data) \
                .eq("org_id", org_id) \
                .execute()

            logger.info(f"Updated existing organization: {org_id}")
            action = "organization_updated"
        else:
            # Create new organization
            customer_data["created_at"] = datetime.utcnow().isoformat()
            result = supabase.table("customers") \
                .insert(customer_data) \
                .execute()

            logger.info(f"Created new organization: {org_id}")
            action = "organization_created"

        # ========================================================================
        # Step 3: Create default analyzer config
        # ========================================================================
        try:
            # Check if config already exists
            existing_config = supabase.table("analyzer_configs") \
                .select("id") \
                .eq("org_id", org_id) \
                .execute()

            if not existing_config.data or len(existing_config.data) == 0:
                # Create default balanced configuration
                default_config = {
                    "org_id": org_id,
                    "preset": "balanced",
                    "config": {
                        "cost_analysis": {
                            "outlier_threshold": 2.0,
                            "min_samples": 10
                        },
                        "quality_analysis": {
                            "defect_threshold": 0.05,
                            "severity_weights": {"critical": 1.0, "major": 0.7, "minor": 0.3}
                        },
                        "efficiency_analysis": {
                            "oee_targets": {"availability": 0.85, "performance": 0.90, "quality": 0.95}
                        },
                        "equipment_analysis": {
                            "failure_lookback_days": 90,
                            "mtbf_threshold_hours": 168
                        }
                    },
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }

                supabase.table("analyzer_configs").insert(default_config).execute()
                logger.info(f"Created default analyzer config for org: {org_id}")

        except Exception as config_error:
            # Don't fail the whole setup if config creation fails
            logger.warning(f"Failed to create analyzer config: {str(config_error)}")

        # ========================================================================
        # Step 4: Audit log
        # ========================================================================
        await audit_logger.log(
            action=action,
            user_id=user_id,
            org_id=org_id,
            resource_type="organization",
            resource_id=org_id,
            details={
                "company_name": org_setup.company_name,
                "company_size": org_setup.company_size,
                "industry": org_setup.industry
            }
        )

        # ========================================================================
        # Step 5: Return success
        # ========================================================================
        return {
            "success": True,
            "organization": {
                "org_id": org_id,
                "name": org_setup.company_name,
                "plan": "trial",
                "status": "trial"
            },
            "message": "Organization setup complete"
        }

    except Exception as e:
        error_id = track_error(
            e,
            category=ErrorCategory.BUSINESS_LOGIC,
            severity=ErrorSeverity.HIGH,
            context={"endpoint": "onboarding/organization"},
            user_id=user.get("user_id"),
            org_id=user.get("org_id")
        )
        logger.error(f"Organization setup failed (error_id: {error_id}): {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Organization setup failed. Error ID: {error_id}"
        )


# ============================================================================
# User Profile
# ============================================================================

@router.get("/onboarding/profile")
async def get_user_profile(
    request: Request,
    user: dict = Depends(get_current_user)
):
    """
    Get current user's profile

    Returns user profile data from Clerk and any additional metadata.
    """
    try:
        user_id = user["user_id"]
        org_id = user["org_id"]

        logger.info(f"Fetching profile for user: {user_id}")

        # Return user data from JWT + Clerk
        profile = {
            "user_id": user_id,
            "org_id": org_id,
            "email": user.get("email"),
            "full_name": user.get("full_name"),
            # Additional metadata can be stored in a user_profiles table if needed
        }

        return {
            "success": True,
            "profile": profile
        }

    except Exception as e:
        error_id = track_error(
            e,
            category=ErrorCategory.BUSINESS_LOGIC,
            severity=ErrorSeverity.MEDIUM,
            context={"endpoint": "onboarding/profile"},
            user_id=user.get("user_id"),
            org_id=user.get("org_id")
        )
        logger.error(f"Failed to fetch user profile (error_id: {error_id}): {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch profile. Error ID: {error_id}"
        )


# ============================================================================
# Onboarding Status
# ============================================================================

@router.get("/onboarding/status")
async def get_onboarding_status(
    request: Request,
    user: dict = Depends(get_current_user)
):
    """
    Get user's onboarding status

    Checks which onboarding steps have been completed:
    1. Organization setup
    2. CSV upload (optional)
    3. First analysis (optional)

    Multi-tenant: Filtered by org_id
    """
    try:
        org_id = user["org_id"]
        user_id = user["user_id"]

        logger.info(f"Checking onboarding status for org: {org_id}")

        # ========================================================================
        # Step 1: Check organization setup
        # ========================================================================
        org_response = supabase.table("customers") \
            .select("*") \
            .eq("org_id", org_id) \
            .execute()

        org_setup_complete = bool(org_response.data and len(org_response.data) > 0)
        organization_data = org_response.data[0] if org_response.data else None

        # ========================================================================
        # Step 2: Check if user has uploaded any data
        # ========================================================================
        # Note: We don't have a csv_uploads table yet, so skip this for now
        has_uploaded_data = False

        # ========================================================================
        # Step 3: Check if user has run any analyses
        # ========================================================================
        analyses_response = supabase.table("analyses") \
            .select("id") \
            .eq("org_id", org_id) \
            .limit(1) \
            .execute()

        has_run_analysis = bool(analyses_response.data and len(analyses_response.data) > 0)

        # ========================================================================
        # Step 4: Determine next step
        # ========================================================================
        if not org_setup_complete:
            next_step = "setup_organization"
        elif not has_uploaded_data:
            next_step = "upload_data"
        elif not has_run_analysis:
            next_step = "run_analysis"
        else:
            next_step = "complete"

        # ========================================================================
        # Step 5: Build status response
        # ========================================================================
        steps = {
            "organization_setup": org_setup_complete,
            "data_uploaded": has_uploaded_data,
            "analysis_run": has_run_analysis
        }

        completed = all(steps.values())

        return {
            "success": True,
            "completed": completed,
            "steps": steps,
            "organization": organization_data,
            "next_step": next_step
        }

    except Exception as e:
        error_id = track_error(
            e,
            category=ErrorCategory.BUSINESS_LOGIC,
            severity=ErrorSeverity.MEDIUM,
            context={"endpoint": "onboarding/status"},
            user_id=user.get("user_id"),
            org_id=user.get("org_id")
        )
        logger.error(f"Failed to fetch onboarding status (error_id: {error_id}): {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch onboarding status. Error ID: {error_id}"
        )


# ============================================================================
# Skip Onboarding (for testing/demos)
# ============================================================================

@router.post("/onboarding/skip")
async def skip_onboarding(
    request: Request,
    user: dict = Depends(get_current_user)
):
    """
    Skip onboarding process

    Creates minimal organization record to allow user to proceed.
    Useful for testing and demos.
    """
    try:
        org_id = user["org_id"]
        user_id = user["user_id"]

        logger.info(f"Skipping onboarding for org: {org_id}")

        # Check if org already exists
        existing = supabase.table("customers") \
            .select("*") \
            .eq("org_id", org_id) \
            .execute()

        if not existing.data or len(existing.data) == 0:
            # Create minimal organization record
            minimal_org = {
                "org_id": org_id,
                "name": f"Organization {org_id[:8]}",
                "email": user.get("email", ""),
                "plan": "trial",
                "status": "trial",
                "notes": "Onboarding skipped",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }

            supabase.table("customers").insert(minimal_org).execute()
            logger.info(f"Created minimal organization record for: {org_id}")

        # Audit log
        await audit_logger.log(
            action="onboarding_skipped",
            user_id=user_id,
            org_id=org_id,
            resource_type="organization",
            resource_id=org_id,
            details={"skipped": True}
        )

        return {
            "success": True,
            "message": "Onboarding skipped"
        }

    except Exception as e:
        error_id = track_error(
            e,
            category=ErrorCategory.BUSINESS_LOGIC,
            severity=ErrorSeverity.MEDIUM,
            context={"endpoint": "onboarding/skip"},
            user_id=user.get("user_id"),
            org_id=user.get("org_id")
        )
        logger.error(f"Failed to skip onboarding (error_id: {error_id}): {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to skip onboarding. Error ID: {error_id}"
        )
