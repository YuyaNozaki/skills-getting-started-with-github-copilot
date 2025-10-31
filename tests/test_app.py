import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add the src directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

from app import app

client = TestClient(app)


def test_read_activities():
    """Test retrieving all activities"""
    response = client.get("/activities")
    assert response.status_code == 200
    activities = response.json()
    assert isinstance(activities, dict)
    assert "Chess Club" in activities
    assert "participants" in activities["Chess Club"]


@pytest.mark.parametrize("activity,email", [
    ("Chess Club", "test@mergington.edu"),
    ("Programming Class", "new@mergington.edu"),
])
def test_signup_success(activity, email):
    """Test successful signup for activities"""
    response = client.post(f"/signup/{activity}/{email}")
    assert response.status_code == 200
    assert response.json()["message"] == f"Successfully signed up {email} for {activity}"

    # Verify the participant was added
    activities = client.get("/activities").json()
    assert email in activities[activity]["participants"]


def test_signup_nonexistent_activity():
    """Test signup for non-existent activity"""
    response = client.post("/signup/NonexistentClub/test@mergington.edu")
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_duplicate():
    """Test signup when already registered"""
    email = "duplicate@mergington.edu"
    activity = "Chess Club"
    
    # First signup
    client.post(f"/signup/{activity}/{email}")
    
    # Try to signup again
    response = client.post(f"/signup/{activity}/{email}")
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up for this activity"


def test_unregister_success():
    """Test successful unregistration"""
    email = "tounregister@mergington.edu"
    activity = "Chess Club"
    
    # First sign up
    client.post(f"/signup/{activity}/{email}")
    
    # Then unregister
    response = client.delete(f"/unregister/{activity}/{email}")
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully unregistered"
    
    # Verify the participant was removed
    activities = client.get("/activities").json()
    assert email not in activities[activity]["participants"]


def test_unregister_nonexistent_activity():
    """Test unregistering from non-existent activity"""
    response = client.delete("/unregister/NonexistentClub/test@mergington.edu")
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_nonexistent_participant():
    """Test unregistering non-existent participant"""
    response = client.delete("/unregister/Chess Club/nonexistent@mergington.edu")
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found"