from collections.abc import AsyncGenerator
from datetime import date, timedelta

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.v1.auth import router as auth_router
from app.api.v1.digest import router as digest_router
from app.api.v1.priorities import router as priorities_router
from app.core.commitment_weights import compute_commitment_weight
from app.core.database import get_db_session
from app.core.otp import DEV_OTP
from app.models import (
    Base,
    Commitment,
    Complaint,
    ComplaintCluster,
    Infrastructure,
    User,
    Ward,
)


@pytest.fixture
def api_client() -> TestClient:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def init_db() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        async with session_factory() as session:
            session.add(User(phone="9876543210", full_name="Leader", role="leader", is_active=True))
            session.add(User(phone="9876543212", full_name="Citizen", role="citizen", is_active=True))

            ward = Ward(
                name="Ward 42",
                code="W42",
                constituency_name="South Delhi",
                population=50000,
                registered_voters=33800,
            )
            session.add(ward)
            await session.flush()

            session.add(
                Infrastructure(
                    ward_id=ward.id,
                    category="drainage",
                    status="critical",
                    description="Canal overflow risk",
                )
            )
            cluster = ComplaintCluster(
                ward_id=ward.id,
                label="Drainage issues",
                category="drainage",
                citizen_count=2,
                department_suggestion="PWD",
            )
            session.add(cluster)
            await session.flush()
            session.add(
                Complaint(
                    public_reference="JK-2026-0001",
                    ward_id=ward.id,
                    description="Standing water",
                    category="drainage",
                    citizen_contact="9876543212",
                    status="submitted",
                    source="citizen",
                    cluster_id=cluster.id,
                )
            )
            deadline = date.today() - timedelta(days=5)
            session.add(
                Commitment(
                    title="Clear canal",
                    description="Desilt canal",
                    ward_id=ward.id,
                    assignee="PWD",
                    deadline=deadline,
                    weight=compute_commitment_weight(deadline),
                    status="active",
                )
            )
            await session.commit()

    import asyncio

    loop = asyncio.new_event_loop()
    loop.run_until_complete(init_db())

    app = FastAPI()
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(priorities_router, prefix="/api/v1")
    app.include_router(digest_router, prefix="/api/v1")

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


def test_priorities_returns_ranked_actions(api_client: TestClient) -> None:
    token = _token(api_client, "9876543210", "leader")
    response = api_client.get(
        "/api/v1/priorities",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["constituency_name"] == "South Delhi"
    assert body["total"] >= 3
    assert body["priorities"][0]["rank"] == 1
    assert body["priorities"][0]["reasons"]
    assert body["ward_comparison"][0]["ward_name"] == "Ward 42"
    assert body["ward_comparison"][0]["open_complaints"] == 1


def test_priorities_filter_by_ward(api_client: TestClient) -> None:
    token = _token(api_client, "9876543210", "leader")
    response = api_client.get(
        "/api/v1/priorities?ward_id=1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert all(item["ward_id"] == 1 for item in response.json()["priorities"])


def test_digest_returns_numbers_only(api_client: TestClient) -> None:
    token = _token(api_client, "9876543210", "leader")
    response = api_client.get(
        "/api/v1/digest",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["totals"]["complaints_opened"] == 1
    assert body["totals"]["active_commitments"] == 1
    assert body["totals"]["overdue_commitments"] == 1
    assert body["totals"]["total_population"] == 50000
    assert body["wards"][0]["complaints_by_category"]["drainage"] == 1
    assert "period_start" in body
    assert "period_end" in body


def test_citizen_forbidden(api_client: TestClient) -> None:
    token = _token(api_client, "9876543212", "citizen")
    priorities = api_client.get(
        "/api/v1/priorities",
        headers={"Authorization": f"Bearer {token}"},
    )
    digest = api_client.get(
        "/api/v1/digest",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert priorities.status_code == 403
    assert digest.status_code == 403
