"""
Health Check Endpoint Tests

Tests for the health check and monitoring endpoints.
"""

import pytest
from fastapi.testclient import TestClient


# ============================================================================
# Basic Health Check Tests
# ============================================================================

@pytest.mark.unit
def test_health_check_basic(client: TestClient):
    """Test basic health check endpoint returns 200"""
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "plant-intel-api"
    assert "timestamp" in data


@pytest.mark.unit
def test_health_check_liveness(client: TestClient):
    """Test Kubernetes liveness probe"""
    response = client.get("/api/v1/health/live")

    assert response.status_code == 200
    data = response.json()
    assert data["alive"] is True
    assert data["service"] == "plant-intel-api"


# ============================================================================
# Detailed Health Check Tests
# ============================================================================

@pytest.mark.integration
@pytest.mark.external
def test_health_check_detailed(client: TestClient):
    """Test detailed health check with dependency checks"""
    response = client.get("/api/v1/health/detailed")

    # May return 503 if dependencies unhealthy (expected in test env)
    assert response.status_code in [200, 503]
    data = response.json()

    assert "status" in data
    assert "service" in data
    assert "checks" in data

    # Verify check structure
    checks = data["checks"]
    assert "supabase" in checks
    assert "anthropic" in checks
    assert "environment" in checks


@pytest.mark.integration
def test_health_check_readiness(client: TestClient):
    """Test Kubernetes readiness probe"""
    response = client.get("/api/v1/health/ready")

    # May be not ready in test environment
    assert response.status_code in [200, 503]
    data = response.json()

    assert "ready" in data
    assert "service" in data


# ============================================================================
# Root Endpoint Tests
# ============================================================================

@pytest.mark.unit
def test_root_endpoint(client: TestClient):
    """Test root endpoint returns API info"""
    response = client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Plant Intel API"
    assert data["version"] == "1.0.0"
    assert data["docs"] == "/docs"
    assert data["health"] == "/health"
