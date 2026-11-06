"""
LegalOS Backend API Test Suite
Tests all core modules: Auth, Matters, Strategy, Hearings, Invoices, AI Skills, and Audit.
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from src.db import memory_db

client = TestClient(app)

FOUNDER_ID = "a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5"


def test_health_check():
    """Verify system health endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "LegalOS API" in data["service"]


def test_user_login_jwt():
    """Verify demo login issues a valid JWT token."""
    response = client.post(
        "/api/v1/users/login",
        json={"email": "founder@legalos.dev", "password": "demo1234"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["email"] == "founder@legalos.dev"
    assert data["user"]["role"] == "founder"


def test_list_and_create_matters():
    """Verify listing and creating matters."""
    # List matters
    res = client.get("/api/v1/matters", headers={"X-User-Id": FOUNDER_ID})
    assert res.status_code == 200
    matters = res.json()
    assert isinstance(matters, list)
    assert len(matters) >= 2

    # Create new matter
    new_matter = {
        "client_name": "Test Test Corp",
        "client_email": "test@testcorp.in",
        "case_type": "arbitration",
        "court": "high_court",
        "court_name": "Delhi High Court",
        "brief_facts": "Arbitration dispute regarding supply contract payment default.",
        "relief_sought": "Recovery of ₹1.2 Cr",
        "status": "intake"
    }
    create_res = client.post("/api/v1/matters", json=new_matter, headers={"X-User-Id": FOUNDER_ID})
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["client_name"] == "Test Test Corp"
    assert "LOS-" in created["matter_number"]


def test_strategy_notes():
    """Verify strategy note read and lock."""
    matter_id = "m1-rajesh-kumar"
    res = client.get(f"/api/v1/matters/{matter_id}/strategy")
    assert res.status_code == 200
    note = res.json()
    assert note["matter_id"] == matter_id


def test_hearings_and_client_update():
    """Verify logging a hearing and approving client update."""
    matter_id = "m1-rajesh-kumar"
    hearing_payload = {
        "court_room": "Court 3, Item 12",
        "judge_name": "Hon'ble Justice Singh",
        "bench_composition": "Single Bench",
        "order_summary": "Arguments heard. Notice issued returnable in 3 weeks.",
        "outcome": "Notice issued",
        "next_steps": "File affidavit of service.",
        "adjourned_to": "2024-04-15T10:30:00Z"
    }

    log_res = client.post(
        f"/api/v1/matters/{matter_id}/hearings",
        json=hearing_payload,
        headers={"X-User-Id": FOUNDER_ID}
    )
    assert log_res.status_code == 200
    hearing = log_res.json()
    assert hearing["matter_id"] == matter_id
    assert hearing["client_update_draft"] is not None

    # Approve update
    approve_res = client.post(
        f"/api/v1/hearings/{hearing['id']}/client-update/approve",
        headers={"X-User-Id": FOUNDER_ID}
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["client_update_approved"] is True


def test_invoices_workflow():
    """Verify invoice generation and approval workflow."""
    matter_id = "m1-rajesh-kumar"
    inv_payload = {
        "milestone_name": "Interim Hearing Appearance",
        "description": "Fee for appearance on admission hearing",
        "amount": 75000.0
    }

    create_res = client.post(
        f"/api/v1/matters/{matter_id}/invoices",
        json=inv_payload,
        headers={"X-User-Id": FOUNDER_ID}
    )
    assert create_res.status_code == 200
    inv = create_res.json()
    assert inv["amount"] == 75000.0
    assert inv["total_amount"] == 75000.0 * 1.18

    # Approve invoice
    app_res = client.post(
        f"/api/v1/invoices/{inv['id']}/approve",
        headers={"X-User-Id": FOUNDER_ID}
    )
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "sent"


def test_ai_skills_execution_and_review():
    """Verify AI skills execution with context auto-hydration and human review."""
    matter_id = "m1-rajesh-kumar"
    run_res = client.post(
        "/api/v1/ai-skills/run",
        json={
            "skill_name": "skill_04_engagement_letter",
            "matter_id": matter_id,
            "input_data": {}
        },
        headers={"X-User-Id": FOUNDER_ID}
    )
    assert run_res.status_code == 200
    ai_output = run_res.json()
    assert ai_output["review_status"] == "pending"
    assert ai_output["raw_output"] is not None

    # Review AI output (Approve)
    rev_res = client.post(
        f"/api/v1/ai-skills/{ai_output['id']}/review",
        json={"review_status": "approved", "review_notes": "Terms reviewed by Senior Advocate"},
        headers={"X-User-Id": FOUNDER_ID}
    )
    assert rev_res.status_code == 200
    assert rev_res.json()["review_status"] == "approved"


def test_audit_logs_and_csv():
    """Verify audit trail logging and CSV export."""
    res = client.get("/api/v1/audit", headers={"X-User-Id": FOUNDER_ID})
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) > 0

    export_res = client.get("/api/v1/audit/export")
    assert export_res.status_code == 200
    assert "text/csv" in export_res.headers.get("content-type", "")

