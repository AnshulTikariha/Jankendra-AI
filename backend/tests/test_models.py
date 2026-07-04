from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.models import Base


EXPECTED_TABLES = {
    "users",
    "db1_wards",
    "db1_demographics",
    "db1_infrastructure",
    "db1_schemes",
    "db2_meeting_summaries",
    "db2_resolved_commitments",
    "db2_cluster_snapshots",
    "db3_commitments",
    "db3_commitment_history",
    "db4_complaint_clusters",
    "db4_complaints",
}


async def test_all_phase1_tables_are_created() -> None:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with engine.connect() as connection:
        table_names = await connection.run_sync(
            lambda sync_conn: set(inspect(sync_conn).get_table_names())
        )

    await engine.dispose()

    assert EXPECTED_TABLES.issubset(table_names)


async def test_ward_and_complaint_can_be_inserted() -> None:
    from app.models import Complaint, Ward

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        ward = Ward(
            name="Ward 42",
            code="W42",
            constituency_name="South Delhi",
            population=45000,
            registered_voters=30400,
        )
        session.add(ward)
        await session.flush()

        complaint = Complaint(
            public_reference="JK-2026-0001",
            ward_id=ward.id,
            description="Drainage canal overflow during monsoon",
            category="drainage",
            citizen_contact="9999999999",
            status="submitted",
            source="citizen",
        )
        session.add(complaint)
        await session.commit()

        assert ward.id is not None
        assert complaint.id is not None
        assert complaint.ward_id == ward.id

    await engine.dispose()
