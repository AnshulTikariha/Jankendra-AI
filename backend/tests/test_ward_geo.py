import json
from collections.abc import AsyncGenerator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.v1.auth import router as auth_router
from app.api.v1.constituency import router as constituency_router
from app.core.database import get_db_session
from app.core.otp import DEV_OTP
from app.models import Base, User, Ward


def _square_geojson(lat: float, lng: float, delta: float = 0.01) -> str:
    ring = [
        [lng - delta, lat - delta],
        [lng + delta, lat - delta],
        [lng + delta, lat + delta],
        [lng - delta, lat + delta],
        [lng - delta, lat - delta],
    ]
    return json.dumps({"type": "Polygon", "coordinates": [ring]})


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
                    phone="9876543212",
                    full_name="Citizen",
                    role="citizen",
                    is_active=True,
                )
            )
            session.add(
                Ward(
                    name="Ward 42",
                    code="W42",
                    constituency_name="South Delhi",
                    population=50000,
                    registered_voters=33800,
                    municipal_ward_number="42",
                    ward_area_name="Demo Ward 42",
                    centroid_lat=23.268,
                    centroid_lng=77.425,
                    boundary_geojson=_square_geojson(23.268, 77.425),
                    boundary_source="test",
                )
            )
            session.add(
                Ward(
                    name="Ward 43",
                    code="W43",
                    constituency_name="South Delhi",
                    population=45000,
                    registered_voters=30400,
                    municipal_ward_number="43",
                    centroid_lat=23.252,
                    centroid_lng=77.398,
                    boundary_geojson=_square_geojson(23.252, 77.398),
                    boundary_source="test",
                )
            )
            await session.commit()

    import asyncio

    loop = asyncio.new_event_loop()
    loop.run_until_complete(init_db())

    app = FastAPI()
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(constituency_router, prefix="/api/v1")

    async def override_get_db_session() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_get_db_session

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()
    loop.run_until_complete(engine.dispose())
    loop.close()


def _token(api_client: TestClient) -> str:
    api_client.post("/api/v1/auth/otp/request", json={"phone": "9876543212"})
    response = api_client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": "9876543212", "otp": DEV_OTP, "role": "citizen"},
    )
    return response.json()["access_token"]


def test_citizen_can_list_wards(api_client: TestClient) -> None:
    token = _token(api_client)
    response = api_client.get(
        "/api/v1/constituency/wards",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["wards"]) == 2
    assert body["wards"][0]["centroid_lat"] == 23.268
    assert body["wards"][0]["has_boundary"] is True


def test_resolve_ward_inside_polygon(api_client: TestClient) -> None:
    token = _token(api_client)
    response = api_client.get(
        "/api/v1/constituency/wards/resolve",
        params={"latitude": 23.268, "longitude": 77.425},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["code"] == "W42"
    assert body["confidence"] == "inside"
    assert body["municipal_ward_number"] == "42"


def test_resolve_ward_returns_nearest_when_outside(api_client: TestClient) -> None:
    token = _token(api_client)
    response = api_client.get(
        "/api/v1/constituency/wards/resolve",
        params={"latitude": 23.26, "longitude": 77.41},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["confidence"] == "nearest"
    assert body["distance_m"] is not None


def test_ward_boundaries_feature_collection(api_client: TestClient) -> None:
    token = _token(api_client)
    response = api_client.get(
        "/api/v1/constituency/ward-boundaries",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "FeatureCollection"
    assert len(body["features"]) == 2
    assert body["features"][0]["properties"]["code"] == "W42"
