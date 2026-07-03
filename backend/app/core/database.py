from collections.abc import AsyncGenerator

from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings


def _engine_options() -> dict[str, object]:
    options: dict[str, object] = {"echo": settings.db_echo}
    url = make_url(settings.database_url)

    if url.get_backend_name().startswith("postgresql"):
        options["pool_size"] = settings.db_pool_size
        options["max_overflow"] = settings.db_max_overflow

    return options


async_engine = create_async_engine(settings.database_url, **_engine_options())
AsyncSessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
