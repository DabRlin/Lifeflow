"""Tests for the daily ring API endpoint."""
import pytest
from datetime import date


@pytest.mark.asyncio
async def test_daily_ring_empty_database(client):
    """Test daily ring returns zeros when no habits exist."""
    response = await client.get("/api/stats/daily-ring")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_habits"] == 0
    assert data["completed_habits"] == 0
    assert data["percentage"] == 0.0
    assert "date" in data


@pytest.mark.asyncio
async def test_daily_ring_with_habits_no_checkins(client):
    """Test daily ring with habits but no check-ins."""
    # Create a habit task
    task_response = await client.post("/api/tasks", json={
        "title": "Morning Exercise",
        "is_habit": True
    })
    assert task_response.status_code == 201
    
    # Get daily ring
    response = await client.get("/api/stats/daily-ring")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_habits"] == 1
    assert data["completed_habits"] == 0
    assert data["percentage"] == 0.0


@pytest.mark.asyncio
async def test_daily_ring_with_checkin(client):
    """Test daily ring updates after check-in."""
    # Create a habit task
    task_response = await client.post("/api/tasks", json={
        "title": "Morning Exercise",
        "is_habit": True
    })
    assert task_response.status_code == 201
    task_id = task_response.json()["id"]
    
    # Check in on the task
    checkin_response = await client.post(f"/api/tasks/{task_id}/checkin")
    assert checkin_response.status_code == 200
    
    # Get daily ring
    response = await client.get("/api/stats/daily-ring")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_habits"] == 1
    assert data["completed_habits"] == 1
    assert data["percentage"] == 100.0


@pytest.mark.asyncio
async def test_daily_ring_partial_completion(client):
    """Test daily ring with partial habit completion."""
    # Create two habit tasks
    task1_response = await client.post("/api/tasks", json={
        "title": "Morning Exercise",
        "is_habit": True
    })
    assert task1_response.status_code == 201
    task1_id = task1_response.json()["id"]
    
    task2_response = await client.post("/api/tasks", json={
        "title": "Read Book",
        "is_habit": True
    })
    assert task2_response.status_code == 201
    
    # Check in on only one task
    checkin_response = await client.post(f"/api/tasks/{task1_id}/checkin")
    assert checkin_response.status_code == 200
    
    # Get daily ring
    response = await client.get("/api/stats/daily-ring")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_habits"] == 2
    assert data["completed_habits"] == 1
    assert data["percentage"] == 50.0


@pytest.mark.asyncio
async def test_daily_ring_excludes_non_habits(client):
    """Test that non-habit tasks are not counted in the ring."""
    # Create a regular task (not a habit)
    task_response = await client.post("/api/tasks", json={
        "title": "Buy groceries",
        "is_habit": False
    })
    assert task_response.status_code == 201
    
    # Get daily ring
    response = await client.get("/api/stats/daily-ring")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_habits"] == 0
    assert data["completed_habits"] == 0


@pytest.mark.asyncio
async def test_daily_ring_excludes_deleted_habits(client):
    """Test that deleted habits are not counted in the ring."""
    # Create a habit task
    task_response = await client.post("/api/tasks", json={
        "title": "Morning Exercise",
        "is_habit": True
    })
    assert task_response.status_code == 201
    task_id = task_response.json()["id"]
    
    # Delete the task
    delete_response = await client.delete(f"/api/tasks/{task_id}")
    assert delete_response.status_code == 204
    
    # Get daily ring
    response = await client.get("/api/stats/daily-ring")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_habits"] == 0
    assert data["completed_habits"] == 0


@pytest.mark.asyncio
async def test_daily_ring_with_timezone_offset(client):
    """Test daily ring respects timezone offset."""
    # Create a habit task
    task_response = await client.post("/api/tasks", json={
        "title": "Morning Exercise",
        "is_habit": True
    })
    assert task_response.status_code == 201
    
    # Get daily ring with timezone offset
    response = await client.get("/api/stats/daily-ring?timezone_offset=-480")
    assert response.status_code == 200
    data = response.json()
    
    # Should still work, just with different date calculation
    assert "date" in data
    assert "total_habits" in data
    assert "completed_habits" in data
    assert "percentage" in data


@pytest.mark.asyncio
async def test_daily_ring_with_specific_date(client):
    """Test daily ring for a specific date."""
    # Create a habit task
    task_response = await client.post("/api/tasks", json={
        "title": "Morning Exercise",
        "is_habit": True
    })
    assert task_response.status_code == 201
    
    # Get daily ring for a specific date
    response = await client.get("/api/stats/daily-ring?target_date=2025-01-01")
    assert response.status_code == 200
    data = response.json()
    
    assert data["date"] == "2025-01-01"
    assert data["total_habits"] == 1
    assert data["completed_habits"] == 0  # No check-ins for that date
