"""One-off: set city=bhopal on demo wards missing city (W42–W47)."""
import asyncio
import sys
from pathlib import Path

from sqlalchemy import or_, select, update

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.database import AsyncSessionLocal, async_engine
from app.models import Ward


async def main() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            update(Ward)
            .where(or_(Ward.city.is_(None), Ward.city == ""))
            .values(city="bhopal")
        )
        await session.commit()
        rows = list(
            (await session.execute(select(Ward.city, Ward.code).order_by(Ward.code))).all()
        )
        print(f"Updated {result.rowcount} ward(s).")
        for city, code in rows:
            print(f"  {code}: {city}")


if __name__ == "__main__":
    asyncio.run(main())
    asyncio.run(async_engine.dispose())
