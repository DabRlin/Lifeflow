"""Tests for Life Entries API endpoints."""
import pytest
from datetime import datetime, timedelta


@pytest.mark.asyncio
async def test_create_life_entry(client):
    """Test creating a new life entry."""
    response = await client.post(
        "/api/life-entries",
        json={"content": "Today was a great day!"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "Today was a great day!"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert data["is_deleted"] is False


@pytest.mark.asyncio
async def test_create_life_entry_empty_content(client):
    """Test that empty content is rejected."""
    response = await client.post(
        "/api/life-entries",
        json={"content": ""}
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_life_entry_whitespace_only(client):
    """Test that whitespace-only content is rejected."""
    response = await client.post(
        "/api/life-entries",
        json={"content": "   "}
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_life_entry(client):
    """Test getting a single life entry by ID."""
    # Create an entry first
    create_response = await client.post(
        "/api/life-entries",
        json={"content": "Test entry"}
    )
    entry_id = create_response.json()["id"]
    
    # Get the entry
    response = await client.get(f"/api/life-entries/{entry_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == entry_id
    assert data["content"] == "Test entry"



@pytest.mark.asyncio
async def test_get_life_entry_not_found(client):
    """Test getting a non-existent life entry."""
    response = await client.get("/api/life-entries/non-existent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_life_entries_pagination(client):
    """Test paginated retrieval of life entries."""
    # Create multiple entries
    for i in range(5):
        await client.post(
            "/api/life-entries",
            json={"content": f"Entry {i}"}
        )
    
    # Get first page
    response = await client.get("/api/life-entries?page=1&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert data["total_pages"] == 3


@pytest.mark.asyncio
async def test_get_life_entries_reverse_chronological(client):
    """Test that entries are returned in reverse chronological order (newest first)."""
    # Create entries
    await client.post("/api/life-entries", json={"content": "First entry"})
    await client.post("/api/life-entries", json={"content": "Second entry"})
    await client.post("/api/life-entries", json={"content": "Third entry"})
    
    response = await client.get("/api/life-entries")
    assert response.status_code == 200
    data = response.json()
    
    # Newest should be first
    assert data["items"][0]["content"] == "Third entry"
    assert data["items"][1]["content"] == "Second entry"
    assert data["items"][2]["content"] == "First entry"


@pytest.mark.asyncio
async def test_update_life_entry(client):
    """Test updating a life entry."""
    # Create an entry
    create_response = await client.post(
        "/api/life-entries",
        json={"content": "Original content"}
    )
    entry = create_response.json()
    entry_id = entry["id"]
    original_created_at = entry["created_at"]
    
    # Update the entry
    response = await client.put(
        f"/api/life-entries/{entry_id}",
        json={"content": "Updated content"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Updated content"
    # created_at should be preserved
    assert data["created_at"] == original_created_at


@pytest.mark.asyncio
async def test_update_life_entry_not_found(client):
    """Test updating a non-existent life entry."""
    response = await client.put(
        "/api/life-entries/non-existent-id",
        json={"content": "Updated content"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_soft_delete_life_entry(client):
    """Test soft deleting a life entry."""
    # Create an entry
    create_response = await client.post(
        "/api/life-entries",
        json={"content": "To be deleted"}
    )
    entry_id = create_response.json()["id"]
    
    # Soft delete
    response = await client.delete(f"/api/life-entries/{entry_id}")
    assert response.status_code == 204
    
    # Entry should not appear in normal list
    list_response = await client.get("/api/life-entries")
    assert all(item["id"] != entry_id for item in list_response.json()["items"])
    
    # Entry should appear when including deleted
    list_response = await client.get("/api/life-entries?include_deleted=true")
    deleted_entry = next(
        (item for item in list_response.json()["items"] if item["id"] == entry_id),
        None
    )
    assert deleted_entry is not None
    assert deleted_entry["is_deleted"] is True


@pytest.mark.asyncio
async def test_hard_delete_life_entry(client):
    """Test hard deleting a life entry."""
    # Create an entry
    create_response = await client.post(
        "/api/life-entries",
        json={"content": "To be permanently deleted"}
    )
    entry_id = create_response.json()["id"]
    
    # Hard delete
    response = await client.delete(f"/api/life-entries/{entry_id}?hard_delete=true")
    assert response.status_code == 204
    
    # Entry should not exist at all
    get_response = await client.get(f"/api/life-entries/{entry_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_life_entry_not_found(client):
    """Test deleting a non-existent life entry."""
    response = await client.delete("/api/life-entries/non-existent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_life_entries_grouped(client):
    """Test getting life entries grouped by date."""
    # Create entries
    await client.post("/api/life-entries", json={"content": "Entry 1"})
    await client.post("/api/life-entries", json={"content": "Entry 2"})
    
    response = await client.get("/api/life-entries/grouped")
    assert response.status_code == 200
    data = response.json()
    
    assert "groups" in data
    assert "total" in data
    assert data["total"] == 2
    # All entries created today should be in one group
    assert len(data["groups"]) == 1
    assert len(data["groups"][0]["entries"]) == 2
