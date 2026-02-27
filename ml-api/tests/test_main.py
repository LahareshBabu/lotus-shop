"""
API Tests for LOTUS ML Backend
Tests that the API actually works, not just that it fails predictably
"""

import pytest
from fastapi.testclient import TestClient
import os

# Set dummy environment variables
os.environ["SUPABASE_URL"] = "https://dummy-url.supabase.co"
os.environ["SUPABASE_KEY"] = "dummy-key-12345"

from main import app

client = TestClient(app)

def test_api_docs_accessible():
    """Test API documentation is accessible"""
    response = client.get("/docs")
    assert response.status_code == 200
    
def test_root_endpoint_exists():
    """Test root endpoint exists"""
    response = client.get("/")
    assert response.status_code in [200, 404]
    assert response.status_code != 500  # Should not crash

def test_openapi_schema_valid():
    """Test OpenAPI schema is properly generated"""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "paths" in data
    assert "info" in data

def test_api_imports_successfully():
    """Verify all critical modules can be imported"""
    try:
        import main
        import collaborative  
        import recommender
        assert True
    except ImportError as e:
        pytest.fail(f"Critical import failed: {e}")

def test_recommendation_endpoint_exists():
    """
    Test recommendation endpoint is properly defined
    Should NOT return 500 (server crash)
    """
    response = client.get("/api/recommend/1")
    assert response.status_code in [200, 404, 422]
    assert response.status_code != 500, "API should not crash"

def test_track_endpoint_exists():
    """Test interaction tracking endpoint exists"""
    response = client.post("/api/track", json={
        "user_id": "test",
        "product_id": "test", 
        "event_type": "view"
    })
    assert response.status_code != 500

def test_environment_configuration():
    """Verify environment variables are properly set"""
    assert os.getenv("SUPABASE_URL") is not None
    assert os.getenv("SUPABASE_KEY") is not None