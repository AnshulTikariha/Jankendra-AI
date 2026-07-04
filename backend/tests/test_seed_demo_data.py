from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.models import Base, Demographic, Infrastructure, Scheme, User, Ward
from scripts.seed_demo_data import USER_SEED, WARD_SEED, seed_demo_data
import scripts.seed_demo_data as seed_module


async def test_seed_demo_data_creates_users_and_wards(monkeypatch) -> None:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    monkeypatch.setattr(seed_module, "AsyncSessionLocal", session_factory)

    result = await seed_demo_data()

    assert result["users"]["skipped"] == 0
    assert result["users"]["users"] == len(USER_SEED)
    assert result["wards"]["skipped"] == 0
    assert result["wards"]["wards"] == 6
    assert result["complaints"]["skipped"] == 0
    assert result["complaints"]["complaints"] == 3
    assert result["commitments"]["skipped"] == 0
    assert result["commitments"]["commitments"] == 3
    assert result["wards"]["demographics"] == 6
    assert result["wards"]["infrastructure"] == len(
        [item for ward in WARD_SEED for item in ward["infrastructure"]]
    )
    assert result["wards"]["schemes"] == len(
        [item for ward in WARD_SEED for item in ward["schemes"]]
    )

    async with session_factory() as session:
        user_count = await session.scalar(select(func.count()).select_from(User))
        ward_count = await session.scalar(select(func.count()).select_from(Ward))
        demographic_count = await session.scalar(select(func.count()).select_from(Demographic))
        infrastructure_count = await session.scalar(select(func.count()).select_from(Infrastructure))
        scheme_count = await session.scalar(select(func.count()).select_from(Scheme))
        ward_42 = await session.scalar(select(Ward).where(Ward.code == "W42"))
        total_population = await session.scalar(select(func.sum(Ward.population)))
        total_voters = await session.scalar(select(func.sum(Ward.registered_voters)))
        leader = await session.scalar(select(User).where(User.phone == "9876543210"))

    assert user_count == 3
    assert ward_count == 6
    assert demographic_count == 6
    assert infrastructure_count == result["wards"]["infrastructure"]
    assert scheme_count == result["wards"]["schemes"]
    assert ward_42 is not None
    assert ward_42.constituency_name == "South Delhi"
    assert total_population == 270000
    assert total_voters == 182400
    assert leader is not None
    assert leader.role == "leader"

    second_run = await seed_demo_data()
    assert second_run["users"]["skipped"] == 1
    assert second_run["wards"]["skipped"] == 1
    assert second_run["complaints"]["skipped"] == 1
    assert second_run["commitments"]["skipped"] == 1

    await engine.dispose()
