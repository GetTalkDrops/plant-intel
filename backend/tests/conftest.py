"""
Pytest Configuration and Fixtures

Shared fixtures and configuration for all tests.
"""

import os
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from unittest.mock import Mock, MagicMock

# Set test environment variables before importing app
os.environ["ENVIRONMENT"] = "test"
os.environ["SUPABASE_URL"] = "https://xyzcompany.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.test"
os.environ["SUPABASE_SERVICE_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5MDAwMDAwMDB9.test"
os.environ["ANTHROPIC_API_KEY"] = "sk-ant-test-key-12345"
os.environ["CLERK_JWT_PUBLIC_KEY"] = "pk_test_key_12345"

from app.main import app


# ============================================================================
# Test Client Fixtures
# ============================================================================

@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """
    FastAPI test client

    Usage:
        def test_endpoint(client):
            response = client.get("/api/v1/health")
            assert response.status_code == 200
    """
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def authenticated_client(client: TestClient, mock_jwt_token: str) -> TestClient:
    """
    Authenticated test client with mocked JWT

    Usage:
        def test_protected_endpoint(authenticated_client):
            response = authenticated_client.get("/api/v1/mappings")
            assert response.status_code == 200
    """
    client.headers = {
        **client.headers,
        "Authorization": f"Bearer {mock_jwt_token}"
    }
    return client


# ============================================================================
# Authentication Mocks
# ============================================================================

@pytest.fixture
def mock_jwt_token() -> str:
    """Mock JWT token for testing"""
    return "mock.jwt.token"


@pytest.fixture
def mock_user() -> dict:
    """Mock user data from Clerk JWT"""
    return {
        "user_id": "user_test123",
        "org_id": "org_test456",
        "email": "test@example.com",
        "full_name": "Test User"
    }


@pytest.fixture
def mock_get_current_user(mock_user: dict):
    """
    Mock the get_current_user dependency

    Usage:
        def test_with_auth(client, mock_get_current_user):
            # get_current_user will return mock_user
            response = client.get("/api/v1/mappings")
    """
    from app.middleware import get_current_user

    async def override_get_current_user():
        return mock_user

    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.clear()


# ============================================================================
# Database Mocks
# ============================================================================

@pytest.fixture
def mock_supabase():
    """
    Mock Supabase client

    Usage:
        def test_database_operation(mock_supabase):
            mock_supabase.table.return_value.select.return_value.execute.return_value.data = [...]
    """
    mock = MagicMock()

    # Set up chainable methods
    mock.table.return_value = mock
    mock.select.return_value = mock
    mock.insert.return_value = mock
    mock.update.return_value = mock
    mock.delete.return_value = mock
    mock.eq.return_value = mock
    mock.gte.return_value = mock
    mock.lte.return_value = mock
    mock.order.return_value = mock
    mock.limit.return_value = mock
    mock.single.return_value = mock

    # Default execute response
    mock.execute.return_value.data = []

    return mock


# ============================================================================
# External Service Mocks
# ============================================================================

@pytest.fixture
def mock_anthropic_client():
    """
    Mock Anthropic Claude client

    Usage:
        def test_chat(mock_anthropic_client):
            mock_anthropic_client.messages.create.return_value = ...
    """
    mock = MagicMock()

    # Mock successful response
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="This is a test AI response")]
    mock_response.usage.input_tokens = 100
    mock_response.usage.output_tokens = 50

    mock.messages.create.return_value = mock_response

    return mock


# ============================================================================
# Test Data Fixtures
# ============================================================================

@pytest.fixture
def sample_mapping_profile() -> dict:
    """Sample mapping profile data"""
    return {
        "id": "profile_test123",
        "org_id": "org_test456",
        "user_id": "user_test123",
        "name": "Test Profile",
        "description": "Test mapping profile",
        "erp_system": "SAP",
        "mappings": {
            "work_order": "WO_NUM",
            "product_name": "PART_NAME",
            "quantity": "QTY"
        }
    }


@pytest.fixture
def sample_analysis() -> dict:
    """Sample analysis data"""
    return {
        "id": "analysis_test123",
        "org_id": "org_test456",
        "user_id": "user_test123",
        "batch_id": "batch_test789",
        "data_tier": "tier_2",
        "analyzers_run": ["cost", "quality"],
        "insights": {
            "cost_savings": 50000,
            "quality_improvement": 0.15
        },
        "execution_time_ms": 1500
    }


@pytest.fixture
def sample_organization() -> dict:
    """Sample organization/customer data"""
    return {
        "id": "customer_test123",
        "org_id": "org_test456",
        "name": "Test Manufacturing Co.",
        "email": "test@testmfg.com",
        "plan": "trial",
        "status": "trial"
    }


# ============================================================================
# Utility Fixtures
# ============================================================================

@pytest.fixture
def temp_csv_file(tmp_path):
    """
    Create a temporary CSV file for testing uploads

    Usage:
        def test_upload(temp_csv_file):
            with open(temp_csv_file, 'rb') as f:
                response = client.post("/upload", files={"file": f})
    """
    csv_path = tmp_path / "test_data.csv"
    csv_content = """work_order,product_name,quantity,defects
WO001,Widget A,100,2
WO002,Widget B,150,1
WO003,Widget C,200,3"""
    csv_path.write_text(csv_content)
    return csv_path


@pytest.fixture(autouse=True)
def reset_app_state():
    """
    Reset application state between tests

    This fixture runs automatically before each test.
    """
    # Clear dependency overrides
    app.dependency_overrides.clear()

    yield

    # Cleanup after test
    app.dependency_overrides.clear()


# ============================================================================
# Async Test Helpers
# ============================================================================

@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for the test session"""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
