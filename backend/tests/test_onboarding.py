"""
Onboarding Endpoint Tests

Tests for user onboarding and organization setup.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


# ============================================================================
# Organization Setup Tests
# ============================================================================

@pytest.mark.api
@pytest.mark.auth
def test_setup_organization_success(client: TestClient, mock_get_current_user, mock_supabase):
    """Test successful organization setup"""
    # Mock Supabase responses
    mock_supabase.execute.return_value.data = []  # No existing org

    with patch('app.routers.onboarding.supabase', mock_supabase):
        response = client.post("/api/v1/onboarding/organization", json={
            "company_name": "Test Manufacturing Inc.",
            "company_size": "201-500",
            "industry": "manufacturing",
            "annual_revenue_range": "50M-100M",
            "phone": "+1-555-1234",
            "contact_name": "John Doe",
            "contact_email": "john@test.com"
        })

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["organization"]["name"] == "Test Manufacturing Inc."
    assert data["organization"]["plan"] == "trial"


@pytest.mark.api
@pytest.mark.auth
def test_setup_organization_minimal(client: TestClient, mock_get_current_user, mock_supabase):
    """Test organization setup with minimal required fields"""
    mock_supabase.execute.return_value.data = []

    with patch('app.routers.onboarding.supabase', mock_supabase):
        response = client.post("/api/v1/onboarding/organization", json={
            "company_name": "Minimal Corp",
            "company_size": "1-50"
        })

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True


@pytest.mark.api
@pytest.mark.auth
def test_setup_organization_unauthorized(client: TestClient):
    """Test organization setup without authentication"""
    response = client.post("/api/v1/onboarding/organization", json={
        "company_name": "Test Corp",
        "company_size": "1-50"
    })

    # Should fail without authentication
    assert response.status_code in [401, 403, 422]


# ============================================================================
# Onboarding Status Tests
# ============================================================================

@pytest.mark.api
@pytest.mark.auth
def test_get_onboarding_status_incomplete(client: TestClient, mock_get_current_user, mock_supabase):
    """Test onboarding status when setup is incomplete"""
    # Mock no customer record
    mock_supabase.execute.return_value.data = []

    with patch('app.routers.onboarding.supabase', mock_supabase):
        response = client.get("/api/v1/onboarding/status")

    assert response.status_code == 200
    data = response.json()
    assert data["completed"] is False
    assert data["steps"]["organization_setup"] is False
    assert data["next_step"] == "setup_organization"


@pytest.mark.api
@pytest.mark.auth
def test_get_onboarding_status_complete(client: TestClient, mock_get_current_user, mock_supabase, sample_organization):
    """Test onboarding status when all steps are complete"""
    # Mock existing customer and analysis
    mock_supabase.execute.return_value.data = [sample_organization]

    with patch('app.routers.onboarding.supabase', mock_supabase):
        response = client.get("/api/v1/onboarding/status")

    assert response.status_code == 200
    data = response.json()
    assert "completed" in data
    assert "steps" in data
    assert "next_step" in data


# ============================================================================
# Profile Tests
# ============================================================================

@pytest.mark.api
@pytest.mark.auth
def test_get_user_profile(client: TestClient, mock_get_current_user, mock_user):
    """Test getting user profile"""
    response = client.get("/api/v1/onboarding/profile")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["profile"]["user_id"] == mock_user["user_id"]
    assert data["profile"]["org_id"] == mock_user["org_id"]


# ============================================================================
# Skip Onboarding Tests
# ============================================================================

@pytest.mark.api
@pytest.mark.auth
def test_skip_onboarding(client: TestClient, mock_get_current_user, mock_supabase):
    """Test skipping onboarding process"""
    mock_supabase.execute.return_value.data = []

    with patch('app.routers.onboarding.supabase', mock_supabase):
        response = client.post("/api/v1/onboarding/skip")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Onboarding skipped"


# ============================================================================
# Validation Tests
# ============================================================================

@pytest.mark.unit
def test_organization_setup_validation_missing_company_name(client: TestClient, mock_get_current_user):
    """Test validation fails without company name"""
    response = client.post("/api/v1/onboarding/organization", json={
        "company_size": "1-50"
    })

    assert response.status_code == 422  # Validation error


@pytest.mark.unit
def test_organization_setup_validation_missing_company_size(client: TestClient, mock_get_current_user):
    """Test validation fails without company size"""
    response = client.post("/api/v1/onboarding/organization", json={
        "company_name": "Test Corp"
    })

    assert response.status_code == 422  # Validation error
