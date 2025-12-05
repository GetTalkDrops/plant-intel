"""
Analysis Service - Database operations for analysis results
"""

import logging
import os
from typing import Optional, Dict, Any, List
from uuid import UUID
import uuid
from supabase import create_client, Client

logger = logging.getLogger(__name__)


class AnalysisService:
    """Service for persisting and retrieving analysis results"""

    def __init__(self):
        """Initialize Supabase client"""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

        if not supabase_url or not supabase_key:
            logger.warning("Supabase credentials not set - analysis persistence disabled")
            self.supabase = None
        else:
            try:
                self.supabase: Client = create_client(supabase_url, supabase_key)
            except Exception as e:
                logger.warning(f"Failed to create Supabase client: {e}")
                self.supabase = None

    def save_analysis(
        self,
        org_id: str,
        user_id: str,
        batch_id: str,
        data_tier: str,
        analyzers_run: List[str],
        insights: Dict[str, Any],
        execution_time_ms: Optional[int] = None
    ) -> Optional[str]:
        """
        Save analysis results to database

        Args:
            org_id: Organization ID
            user_id: User ID
            batch_id: Batch identifier
            data_tier: Data tier (e.g., "Tier 1", "Tier 2")
            analyzers_run: List of analyzers that were executed
            insights: Analysis insights (urgent, notable, summary)
            execution_time_ms: Execution time in milliseconds

        Returns:
            analysis_id if successful, None otherwise
        """
        if not self.supabase:
            logger.warning("Supabase not configured - analysis not persisted")
            return None

        try:
            # Generate UUID for analysis
            analysis_id = str(uuid.uuid4())

            # Prepare data for insertion
            data = {
                "id": analysis_id,
                "org_id": org_id,
                "user_id": user_id,
                "batch_id": batch_id,
                "data_tier": data_tier,
                "analyzers_run": analyzers_run,
                "insights": insights,
                "execution_time_ms": execution_time_ms
            }

            # Insert into analyses table
            result = self.supabase.table("analyses").insert(data).execute()

            if result.data:
                logger.info(f"Analysis saved successfully: {analysis_id}")
                return analysis_id
            else:
                logger.error(f"Failed to save analysis: {result}")
                return None

        except Exception as e:
            logger.error(f"Error saving analysis: {str(e)}", exc_info=True)
            return None

    def get_analysis(
        self,
        analysis_id: str,
        org_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve analysis results by ID

        Args:
            analysis_id: Analysis UUID
            org_id: Organization ID (for security filtering)

        Returns:
            Analysis data or None if not found
        """
        if not self.supabase:
            logger.warning("Supabase not configured")
            return None

        try:
            # Query with org_id filter for security
            result = self.supabase.table("analyses")\
                .select("*")\
                .eq("id", analysis_id)\
                .eq("org_id", org_id)\
                .execute()

            if result.data and len(result.data) > 0:
                return result.data[0]
            else:
                logger.info(f"Analysis not found: {analysis_id}")
                return None

        except Exception as e:
            logger.error(f"Error retrieving analysis: {str(e)}", exc_info=True)
            return None

    def list_analyses(
        self,
        org_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        List analyses for an organization

        Args:
            org_id: Organization ID
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Dictionary with analyses list and metadata
        """
        if not self.supabase:
            logger.warning("Supabase not configured")
            return {
                "analyses": [],
                "total": 0,
                "limit": limit,
                "offset": offset
            }

        try:
            # Query analyses with pagination
            result = self.supabase.table("analyses")\
                .select("*", count="exact")\
                .eq("org_id", org_id)\
                .order("created_at", desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()

            total = result.count if hasattr(result, 'count') else len(result.data)

            return {
                "analyses": result.data,
                "total": total,
                "limit": limit,
                "offset": offset
            }

        except Exception as e:
            logger.error(f"Error listing analyses: {str(e)}", exc_info=True)
            return {
                "analyses": [],
                "total": 0,
                "limit": limit,
                "offset": offset,
                "error": str(e)
            }

    def get_analyses_by_batch(
        self,
        batch_id: str,
        org_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get all analyses for a specific batch

        Args:
            batch_id: Batch identifier
            org_id: Organization ID

        Returns:
            List of analysis records
        """
        if not self.supabase:
            logger.warning("Supabase not configured")
            return []

        try:
            result = self.supabase.table("analyses")\
                .select("*")\
                .eq("batch_id", batch_id)\
                .eq("org_id", org_id)\
                .order("created_at", desc=True)\
                .execute()

            return result.data if result.data else []

        except Exception as e:
            logger.error(f"Error retrieving analyses by batch: {str(e)}", exc_info=True)
            return []
