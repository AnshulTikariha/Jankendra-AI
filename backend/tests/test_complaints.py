from collections.abc import AsyncGenerator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.v1.auth import router as auth_router
from app.api.v1.complaints import router as complaints_router
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
            session.add(
                Ward(
                    name="Ward 43",
                    code="W43",
                    constituency_name="South Delhi",
                    population=45000,
                    registered_voters=30400,
                )
            )
            await session.commit()

    import asyncio

    loop = asyncio.new_event_loop()
    loop.run_until_complete(init_db())

    app = FastAPI()
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(complaints_router, prefix="/api/v1")

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


def test_citizen_can_create_and_list_own_complaints(api_client: TestClient) -> None:
    token = _token(api_client, "9876543212", "citizen")

    create_response = api_client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "ward_id": 1,
            "category": "drainage",
            "description": "Standing water near market",
            "location_detail": "Main market",
        },
    )

    assert create_response.status_code == 201
    body = create_response.json()
    assert body["public_reference"] == "JK-2026-0001"
    assert body["ward_name"] == "Ward 42"
    assert body["source"] == "citizen"
    assert body["reporter_phone"] == "9876543212"
    assert body["cluster_count"] == 1
    assert body["department_suggestion"] == "PWD"
    assert body["status"] == "submitted"

    list_response = api_client.get(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1


def test_citizen_does_not_see_other_complaints(api_client: TestClient) -> None:
    staff_token = _token(api_client, "9876543211", "staff")
    api_client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={
            "ward_id": 1,
            "category": "water",
            "description": "Staff logged water issue",
            "citizen_contact": "9000000000",
        },
    )

    citizen_token = _token(api_client, "9876543212", "citizen")
    response = api_client.get(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert response.status_code == 200
    assert response.json()["total"] == 0


def test_staff_lists_all_and_filters_by_ward(api_client: TestClient) -> None:
    citizen_token = _token(api_client, "9876543212", "citizen")
    api_client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {citizen_token}"},
        json={"ward_id": 1, "category": "drainage", "description": "Ward 42 drainage"},
    )
    api_client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {citizen_token}"},
        json={"ward_id": 2, "category": "water", "description": "Ward 43 water"},
    )

    staff_token = _token(api_client, "9876543211", "staff")
    all_response = api_client.get(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert all_response.status_code == 200
    assert all_response.json()["total"] == 2

    filtered = api_client.get(
        "/api/v1/complaints?ward_id=1",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert filtered.status_code == 200
    assert filtered.json()["total"] == 1
    assert filtered.json()["complaints"][0]["ward_id"] == 1


def test_same_ward_category_increments_cluster_count(api_client: TestClient) -> None:
    token = _token(api_client, "9876543212", "citizen")
    first = api_client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {token}"},
        json={"ward_id": 1, "category": "drainage", "description": "First drainage issue"},
    )
    second = api_client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {token}"},
        json={"ward_id": 1, "category": "drainage", "description": "Second drainage issue"},
    )

    assert first.json()["cluster_count"] == 1
    assert second.json()["cluster_count"] == 2


def test_create_requires_auth(api_client: TestClient) -> None:
    response = api_client.post(
        "/api/v1/complaints",
        json={"ward_id": 1, "category": "drainage", "description": "No auth"},
    )
    assert response.status_code == 401


def test_get_complaint_by_id(api_client: TestClient) -> None:
    token = _token(api_client, "9876543212", "citizen")
    created = api_client.post(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {token}"},
        json={"ward_id": 1, "category": "roads", "description": "Road damage"},
    )
    complaint_id = created.json()["id"]

    response = api_client.get(
        f"/api/v1/complaints/{complaint_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["id"] == complaint_id
