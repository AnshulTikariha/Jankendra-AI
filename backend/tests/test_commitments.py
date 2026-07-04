from collections.abc import AsyncGenerator
from datetime import date, timedelta

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.v1.auth import router as auth_router
from app.api.v1.commitments import router as commitments_router
from app.core.database import get_db_session
from app.core.otp import DEV_OTP
from app.models import Base, User, Ward


@pytest.fixture
def api_client() -> TestClient:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def init_db() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        async with session_factory() as session:
            session.add(User(phone="9876543210", full_name="Leader", role="leader", is_active=True))
            session.add(User(phone="9876543211", full_name="Staff", role="staff", is_active=True))
            session.add(User(phone="9876543212", full_name="Citizen", role="citizen", is_active=True))
            session.add(
                Ward(
                    name="Ward 42",
                    code="W42",
                    constituency_name="South Delhi",
                    population=50000,
                    registered_voters=33800,
                )
            )
            await session.commit()

    import asyncio

    loop = asyncio.new_event_loop()
    loop.run_until_complete(init_db())

    app = FastAPI()
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(commitments_router, prefix="/api/v1")

    async def override_get_db_session() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_get_db_session

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()
    loop.run_until_complete(engine.dispose())
    loop.close()


def _token(api_client: TestClient, phone: str, role: str) -> str:
    api_client.post("/api/v1/auth/otp/request", json={"phone": phone})
    response = api_client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": phone, "otp": DEV_OTP, "role": role},
    )
    return response.json()["access_token"]


def test_staff_can_create_and_list_todo(api_client: TestClient) -> None:
    token = _token(api_client, "9876543211", "staff")
    create_response = api_client.post(
        "/api/v1/commitments",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Clear drainage canal",
            "description": "Desilt canal before monsoon",
            "ward_id": 1,
            "assignee": "PWD",
            "deadline": (date.today() - timedelta(days=5)).isoformat(),
        },
    )

    assert create_response.status_code == 201
    body = create_response.json()
    assert body["weight"] == 3
    assert body["weight_tier"] == "W3"
    assert body["days_overdue"] == 5
    assert body["status"] == "active"

    todo_response = api_client.get(
        "/api/v1/todo",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert todo_response.status_code == 200
    assert todo_response.json()["total"] == 1
    assert todo_response.json()["items"][0]["title"] == "Clear drainage canal"


def test_extend_and_complete_commitment(api_client: TestClient) -> None:
    token = _token(api_client, "9876543210", "leader")
    created = api_client.post(
        "/api/v1/commitments",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Repair streetlights",
            "description": "Block C lights",
            "ward_id": 1,
            "deadline": (date.today() - timedelta(days=2)).isoformat(),
        },
    )
    commitment_id = created.json()["id"]

    extend_response = api_client.patch(
        f"/api/v1/todo/{commitment_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "action": "extend",
            "new_deadline": (date.today() + timedelta(days=10)).isoformat(),
            "note": "Parts delayed",
        },
    )
    assert extend_response.status_code == 200
    assert extend_response.json()["weight"] == 1
    assert extend_response.json()["days_overdue"] == 0

    complete_response = api_client.patch(
        f"/api/v1/todo/{commitment_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"action": "complete", "note": "Work finished"},
    )
    assert complete_response.status_code == 200
    assert complete_response.json()["status"] == "completed"

    todo_response = api_client.get(
        "/api/v1/todo",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert todo_response.json()["total"] == 0

    all_response = api_client.get(
        "/api/v1/commitments?status=completed",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert all_response.status_code == 200
    assert all_response.json()["total"] == 1


def test_citizen_forbidden(api_client: TestClient) -> None:
    token = _token(api_client, "9876543212", "citizen")
    response = api_client.get(
        "/api/v1/todo",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_todo_requires_auth(api_client: TestClient) -> None:
    response = api_client.get("/api/v1/todo")
    assert response.status_code == 401
