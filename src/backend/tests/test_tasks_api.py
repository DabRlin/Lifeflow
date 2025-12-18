"""Tests for Task Card CRUD API endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_tasks_empty(client: AsyncClient):
    """Test getting tasks when none exist."""
    response = await client.get("/api/tasks")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient):
    """Test creating a new task card."""
    task_data = {
        "title": "Test Task",
        "content": "Test content",
        "is_habit": False
    }
    response = await client.post("/api/tasks", json=task_data)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Task"
    assert data["content"] == "Test content"
    assert data["is_habit"] is False
    assert data["is_deleted"] is False
    assert "id" in data


@pytest.mark.asyncio
async def test_create_task_empty_title_rejected(client: AsyncClient):
    """Test that empty title is rejected."""
    task_data = {"title": ""}
    response = await client.post("/api/tasks", json=task_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_task_whitespace_title_rejected(client: AsyncClient):
    """Test that whitespace-only title is rejected."""
    task_data = {"title": "   "}
    response = await client.post("/api/tasks", json=task_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_task_by_id(client: AsyncClient):
    """Test getting a task by ID."""
    # Create a task first
    task_data = {"title": "Get Test Task"}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    
    # Get the task
    response = await client.get(f"/api/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Get Test Task"



@pytest.mark.asyncio
async def test_get_task_not_found(client: AsyncClient):
    """Test getting a non-existent task."""
    response = await client.get("/api/tasks/non-existent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_task(client: AsyncClient):
    """Test updating a task card."""
    # Create a task first
    task_data = {"title": "Original Title"}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    
    # Update the task
    update_data = {"title": "Updated Title", "content": "New content"}
    response = await client.put(f"/api/tasks/{task_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["content"] == "New content"


@pytest.mark.asyncio
async def test_update_task_whitespace_title_rejected(client: AsyncClient):
    """Test that updating with whitespace-only title is rejected."""
    # Create a task first
    task_data = {"title": "Original Title"}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    
    # Try to update with whitespace title
    update_data = {"title": "   "}
    response = await client.put(f"/api/tasks/{task_id}", json=update_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_soft_delete_task(client: AsyncClient):
    """Test soft deleting a task card."""
    # Create a task first
    task_data = {"title": "Task to Delete"}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    
    # Soft delete the task
    response = await client.delete(f"/api/tasks/{task_id}")
    assert response.status_code == 204
    
    # Task should not appear in normal list
    list_response = await client.get("/api/tasks")
    assert all(t["id"] != task_id for t in list_response.json())
    
    # Task should appear when including deleted
    list_response = await client.get("/api/tasks?include_deleted=true")
    deleted_task = next((t for t in list_response.json() if t["id"] == task_id), None)
    assert deleted_task is not None
    assert deleted_task["is_deleted"] is True


@pytest.mark.asyncio
async def test_filter_tasks_by_list_id(client: AsyncClient):
    """Test filtering tasks by list_id."""
    # Create a list first
    list_response = await client.post("/api/lists", json={"name": "Test List"})
    list_id = list_response.json()["id"]
    
    # Create tasks with and without list_id
    await client.post("/api/tasks", json={"title": "Task in list", "list_id": list_id})
    await client.post("/api/tasks", json={"title": "Task without list"})
    
    # Filter by list_id
    response = await client.get(f"/api/tasks?list_id={list_id}")
    tasks = response.json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Task in list"


@pytest.mark.asyncio
async def test_checkin_task_creates_record(client: AsyncClient):
    """Test that checking in creates a check-in record and updates streak."""
    # Create a habit task
    task_data = {"title": "Daily Exercise", "is_habit": True}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    
    # Check in
    response = await client.post(f"/api/tasks/{task_id}/checkin")
    assert response.status_code == 200
    data = response.json()
    assert data["current_streak"] == 1
    assert data["longest_streak"] == 1
    assert data["last_checkin_date"] is not None


@pytest.mark.asyncio
async def test_checkin_task_idempotent_same_day(client: AsyncClient):
    """Test that checking in twice on the same day doesn't double count."""
    # Create a habit task
    task_data = {"title": "Daily Reading", "is_habit": True}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    
    # Check in twice
    await client.post(f"/api/tasks/{task_id}/checkin")
    response = await client.post(f"/api/tasks/{task_id}/checkin")
    
    assert response.status_code == 200
    data = response.json()
    # Streak should still be 1, not 2
    assert data["current_streak"] == 1


@pytest.mark.asyncio
async def test_checkin_task_not_found(client: AsyncClient):
    """Test checking in on a non-existent task."""
    response = await client.post("/api/tasks/non-existent-id/checkin")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_task_checkins(client: AsyncClient):
    """Test getting check-in records for a task."""
    # Create a habit task
    task_data = {"title": "Daily Meditation", "is_habit": True}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    
    # Check in
    await client.post(f"/api/tasks/{task_id}/checkin")
    
    # Get check-ins
    response = await client.get(f"/api/tasks/{task_id}/checkins")
    assert response.status_code == 200
    records = response.json()
    assert len(records) == 1
    assert records[0]["task_id"] == task_id


@pytest.mark.asyncio
async def test_checkin_with_timezone(client: AsyncClient):
    """Test checking in with timezone offset."""
    # Create a habit task
    task_data = {"title": "Daily Journal", "is_habit": True}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    
    # Check in with timezone offset (UTC+8 = -480 minutes)
    response = await client.post(
        f"/api/tasks/{task_id}/checkin",
        json={"timezone_offset": -480}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["current_streak"] == 1


@pytest.mark.asyncio
async def test_create_task_with_reminder_time(client: AsyncClient):
    """Test creating a task with a valid reminder time."""
    from datetime import datetime, timedelta, timezone
    
    # Set reminder time to 1 hour in the future
    future_time = datetime.now(timezone.utc) + timedelta(hours=1)
    task_data = {
        "title": "Task with Reminder",
        "reminder_time": future_time.isoformat()
    }
    response = await client.post("/api/tasks", json=task_data)
    assert response.status_code == 201
    data = response.json()
    assert data["reminder_time"] is not None


@pytest.mark.asyncio
async def test_create_task_with_past_reminder_rejected(client: AsyncClient):
    """Test that creating a task with a past reminder time is rejected."""
    from datetime import datetime, timedelta, timezone
    
    # Set reminder time to 1 hour in the past
    past_time = datetime.now(timezone.utc) - timedelta(hours=1)
    task_data = {
        "title": "Task with Past Reminder",
        "reminder_time": past_time.isoformat()
    }
    response = await client.post("/api/tasks", json=task_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_task_reminder_time(client: AsyncClient):
    """Test updating a task's reminder time."""
    from datetime import datetime, timedelta, timezone
    
    # Create a task without reminder
    task_data = {"title": "Task to Update Reminder"}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    
    # Update with a future reminder time
    future_time = datetime.now(timezone.utc) + timedelta(hours=2)
    update_data = {"reminder_time": future_time.isoformat()}
    response = await client.put(f"/api/tasks/{task_id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["reminder_time"] is not None


@pytest.mark.asyncio
async def test_clear_task_reminder_time(client: AsyncClient):
    """Test clearing a task's reminder time using clear_reminder flag."""
    from datetime import datetime, timedelta, timezone
    
    # Create a task with reminder
    future_time = datetime.now(timezone.utc) + timedelta(hours=1)
    task_data = {
        "title": "Task with Reminder to Clear",
        "reminder_time": future_time.isoformat()
    }
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    assert create_response.json()["reminder_time"] is not None
    
    # Clear the reminder
    update_data = {"clear_reminder": True}
    response = await client.put(f"/api/tasks/{task_id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["reminder_time"] is None


@pytest.mark.asyncio
async def test_update_task_with_past_reminder_rejected(client: AsyncClient):
    """Test that updating a task with a past reminder time is rejected."""
    from datetime import datetime, timedelta, timezone
    
    # Create a task
    task_data = {"title": "Task to Update with Past Reminder"}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    
    # Try to update with a past reminder time
    past_time = datetime.now(timezone.utc) - timedelta(hours=1)
    update_data = {"reminder_time": past_time.isoformat()}
    response = await client.put(f"/api/tasks/{task_id}", json=update_data)
    assert response.status_code == 422
