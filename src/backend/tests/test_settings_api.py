"""
Tests for Settings API endpoints
Requirements: 1.2, 1.3
"""
import pytest


@pytest.mark.asyncio
async def test_get_settings_default(client):
    """Test getting settings returns defaults when empty"""
    response = await client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert data["notificationsEnabled"] is True
    assert data["theme"] == "system"


@pytest.mark.asyncio
async def test_update_settings(client):
    """Test updating settings persists changes"""
    # Update settings
    response = await client.put(
        "/api/settings",
        json={"notificationsEnabled": False, "theme": "dark"}
    )
    assert response.status_code == 200
    
    # Verify changes persisted
    response = await client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert data["notificationsEnabled"] is False
    assert data["theme"] == "dark"


@pytest.mark.asyncio
async def test_export_data_empty(client):
    """Test exporting data from empty database"""
    response = await client.get("/api/settings/export")
    assert response.status_code == 200
    data = response.json()
    
    # Verify export structure
    assert "exportVersion" in data
    assert "exportDate" in data
    assert "cardLists" in data
    assert "taskCards" in data
    assert "checkinRecords" in data
    assert "lifeEntries" in data
    assert "settings" in data
    
    # Empty database should have empty lists
    assert data["cardLists"] == []
    assert data["taskCards"] == []
    assert data["checkinRecords"] == []
    assert data["lifeEntries"] == []


@pytest.mark.asyncio
async def test_export_data_with_content(client):
    """Test exporting data includes created content"""
    # Create a task (returns 201 Created)
    task_response = await client.post(
        "/api/tasks",
        json={"title": "Test Task", "listId": None}
    )
    assert task_response.status_code == 201
    
    # Create a life entry (returns 201 Created)
    entry_response = await client.post(
        "/api/life-entries",
        json={"content": "Test Entry"}
    )
    assert entry_response.status_code == 201
    
    # Export data
    response = await client.get("/api/settings/export")
    assert response.status_code == 200
    data = response.json()
    
    # Verify content is included
    assert len(data["taskCards"]) == 1
    assert data["taskCards"][0]["title"] == "Test Task"
    assert len(data["lifeEntries"]) == 1
    assert data["lifeEntries"][0]["content"] == "Test Entry"
