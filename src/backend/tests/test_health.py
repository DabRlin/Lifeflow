import pytest


@pytest.mark.asyncio
async def test_health_check(client):
    """Test that health check endpoint returns healthy status."""
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "packaged" in data


@pytest.mark.asyncio
async def test_diagnostics_endpoint(client):
    """Test that diagnostics endpoint returns system information."""
    response = await client.get("/api/diagnostics")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "python_version" in data
    assert "database_path" in data
    assert "cors_origins" in data
