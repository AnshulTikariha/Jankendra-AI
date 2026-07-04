from collections.abc import AsyncGenerator

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.deps import require_roles
from app.api.v1.auth import router as auth_router
from app.core.database import get_db_session
from app.core.otp import DEV_OTP
from app.models import Base, User
from app.schemas.auth import UserResponse


@pytest.fixture
def auth_client() -> TestClient:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def init_db() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        async with session_factory() as session:
            session.add(
                User(
                    phone="9876543210",
                    full_name="Shri Rajendra Kumar Verma",
                    role="leader",
                    is_active=True,
                )
            )
            session.add(
                User(
                    phone="9876543211",
                    full_name="Constituency Staff",
                    role="staff",
                    is_active=True,
                )
            )
            session.add(
                User(
                    phone="9876543212",
                    full_name="Resident",
                    role="citizen",
                    is_active=True,
                )
            )
            await session.commit()

    import asyncio

    loop = asyncio.new_event_loop()
    loop.run_until_complete(init_db())

    app = FastAPI()
    app.include_router(auth_router, prefix="/api/v1")

    @app.get("/api/v1/leader-only", response_model=UserResponse)
    async def leader_only(current_user: User = Depends(require_roles("leader"))) -> UserResponse:
        return UserResponse(
            id=current_user.id,
            phone=current_user.phone,
            full_name=current_user.full_name,
            role=current_user.role,
            is_active=current_user.is_active,
        )

    async def override_get_db_session() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_get_db_session

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()
    loop.run_until_complete(engine.dispose())
    loop.close()


def _login(auth_client: TestClient, phone: str, role: str) -> str:
    request_response = auth_client.post("/api/v1/auth/otp/request", json={"phone": phone})
    assert request_response.status_code == 200

    verify_response = auth_client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": phone, "otp": DEV_OTP, "role": role},
    )
    assert verify_response.status_code == 200
    return verify_response.json()["access_token"]


def test_request_otp_for_registered_phone(auth_client: TestClient) -> None:
    response = auth_client.post("/api/v1/auth/otp/request", json={"phone": "9876543210"})

    assert response.status_code == 200
    body = response.json()
    assert body["phone"] == "9876543210"
    assert body["dev_otp"] == DEV_OTP


def test_request_otp_rejects_unknown_phone(auth_client: TestClient) -> None:
    response = auth_client.post("/api/v1/auth/otp/request", json={"phone": "9000000000"})
    assert response.status_code == 404


def test_verify_otp_returns_token_for_leader(auth_client: TestClient) -> None:
    auth_client.post("/api/v1/auth/otp/request", json={"phone": "9876543210"})
    response = auth_client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": "9876543210", "otp": DEV_OTP, "role": "leader"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["role"] == "leader"
    assert body["user"]["phone"] == "9876543210"
    assert body["user"]["constituency_name"] == "South Delhi"


def test_verify_otp_rejects_wrong_otp(auth_client: TestClient) -> None:
    auth_client.post("/api/v1/auth/otp/request", json={"phone": "9876543210"})
    response = auth_client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": "9876543210", "otp": "000000", "role": "leader"},
    )
    assert response.status_code == 401


def test_verify_otp_rejects_role_mismatch(auth_client: TestClient) -> None:
    auth_client.post("/api/v1/auth/otp/request", json={"phone": "9876543210"})
    response = auth_client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": "9876543210", "otp": DEV_OTP, "role": "staff"},
    )
    assert response.status_code == 403


def test_me_requires_token(auth_client: TestClient) -> None:
    response = auth_client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user(auth_client: TestClient) -> None:
    token = _login(auth_client, "9876543211", "staff")

    response = auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "staff"
    assert response.json()["phone"] == "9876543211"


def test_staff_cannot_access_leader_only_route(auth_client: TestClient) -> None:
    token = _login(auth_client, "9876543211", "staff")

    response = auth_client.get(
        "/api/v1/leader-only",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_leader_can_access_leader_only_route(auth_client: TestClient) -> None:
    token = _login(auth_client, "9876543210", "leader")

    response = auth_client.get(
        "/api/v1/leader-only",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "leader"


def test_citizen_can_login(auth_client: TestClient) -> None:
    token = _login(auth_client, "9876543212", "citizen")
    response = auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "citizen"
