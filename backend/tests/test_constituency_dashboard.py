from collections.abc import AsyncGenerator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.v1.auth import router as auth_router
from app.api.v1.constituency import router as constituency_router
from app.api.v1.dashboard import router as dashboard_router
from app.core.database import get_db_session
from app.core.otp import DEV_OTP
from app.models import Base, Demographic, Infrastructure, User, Ward


@pytest.fixture
def api_client() -> TestClient:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def init_db() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        async with session_factory() as session:
            session.add(
                User(
                    phone="9876543210",
                    full_name="Leader",
                    role="leader",
                    is_active=True,
                )
            )
            session.add(
                User(
                    phone="9876543211",
                    full_name="Staff",
                    role="staff",
                    is_active=True,
                )
            )
            session.add(
                User(
                    phone="9876543212",
                    full_name="Citizen",
                    role="citizen",
                    is_active=True,
                )
            )

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
                Demographic(
                    ward_id=ward.id,
                    population=50000,
                    registered_voters=33800,
                    literacy_rate=82.4,
                    key_indicators="Anchor drainage issue",
                )
            )
            session.add(
                Infrastructure(
                    ward_id=ward.id,
                    category="drainage",
                    status="critical",
                    description="Drainage canal overflow",
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
    app.include_router(constituency_router, prefix="/api/v1")
    app.include_router(dashboard_router, prefix="/api/v1")

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


def test_list_wards_requires_auth(api_client: TestClient) -> None:
    response = api_client.get("/api/v1/constituency/wards")
    assert response.status_code == 401


def test_list_wards_for_citizen(api_client: TestClient) -> None:
    token = _token(api_client, "9876543212", "citizen")
    response = api_client.get(
        "/api/v1/constituency/wards",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["wards"]) == 2


def test_list_wards_for_staff(api_client: TestClient) -> None:
    token = _token(api_client, "9876543211", "staff")
    response = api_client.get(
        "/api/v1/constituency/wards",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["constituency_name"] == "South Delhi"
    assert body["total_population"] == 95000
    assert len(body["wards"]) == 2
    assert body["wards"][0]["code"] == "W42"


def test_get_ward_detail(api_client: TestClient) -> None:
    token = _token(api_client, "9876543210", "leader")
    wards_response = api_client.get(
        "/api/v1/constituency/wards",
        headers={"Authorization": f"Bearer {token}"},
    )
    ward_id = wards_response.json()["wards"][0]["id"]

    response = api_client.get(
        f"/api/v1/constituency/wards/{ward_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == "W42"
    assert len(body["demographics"]) == 1
    assert len(body["infrastructure"]) == 1
    assert body["infrastructure"][0]["category"] == "drainage"


def test_get_ward_not_found(api_client: TestClient) -> None:
    token = _token(api_client, "9876543210", "leader")
    response = api_client.get(
        "/api/v1/constituency/wards/999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_dashboard_for_leader(api_client: TestClient) -> None:
    token = _token(api_client, "9876543210", "leader")
    response = api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["constituency_name"] == "South Delhi"
    assert body["kpis"]["open_complaints"] >= 1
    assert body["kpis"]["hot_ward"]["name"] == "Ward 42"
    assert len(body["priorities"]) >= 1
    assert len(body["ward_comparison"]) == 2
    assert body["priorities"][0]["title"] == "Drainage canal overflow"


def test_dashboard_forbids_citizen(api_client: TestClient) -> None:
    token = _token(api_client, "9876543212", "citizen")
    response = api_client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
