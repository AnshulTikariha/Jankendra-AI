"""Sync Bhopal municipal ward boundaries from Bharatlas into db1_wards.

Matches seeded demo wards (W42–W47) by municipal ward number extracted from ward code/name.
Run after migrations and seed_demo_data.py:

    cd backend && python scripts/sync_bhopal_ward_boundaries.py
"""

from __future__ import annotations

import asyncio
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models import Ward
from app.services.ward_geo import compute_centroid

BHARATLAS_GEOJSON_URL = (
    "https://pub-0429b8e3b5a946e69ea007df844a6f1c.r2.dev/admin/wards-bhopal/wards_bhopal.geojson"
)
LOCAL_GEOJSON = ROOT / "data" / "wards_bhopal.geojson"
BOUNDARY_SOURCE = "bharatlas:wards_bhopal"


def load_geojson() -> dict:
    if LOCAL_GEOJSON.exists():
        return json.loads(LOCAL_GEOJSON.read_text(encoding="utf-8"))

    request = urllib.request.Request(
        BHARATLAS_GEOJSON_URL,
        headers={"User-Agent": "JankendraAI/1.0 (ward boundary sync)"},
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        payload = json.loads(response.read().decode("utf-8"))

    LOCAL_GEOJSON.parent.mkdir(parents=True, exist_ok=True)
    LOCAL_GEOJSON.write_text(json.dumps(payload), encoding="utf-8")
    return payload


def municipal_number_from_ward(ward: Ward) -> str | None:
    if ward.municipal_ward_number:
        return ward.municipal_ward_number

    code_match = re.search(r"(\d+)", ward.code)
    if code_match:
        return code_match.group(1)

    name_match = re.search(r"(\d+)", ward.name)
    if name_match:
        return name_match.group(1)

    return None


def feature_municipal_number(feature: dict) -> str | None:
    properties = feature.get("properties") or {}
    for key in ("Ward_Number", "ward_number", "WARD_NO", "ward_no"):
        value = properties.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return None


def feature_area_name(feature: dict) -> str | None:
    properties = feature.get("properties") or {}
    for key in ("Name", "name", "WARD_NAME", "ward_name"):
        value = properties.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return None


async def sync_boundaries() -> None:
    collection = load_geojson()
    features = collection.get("features") or []
    by_number = {}
    for feature in features:
        number = feature_municipal_number(feature)
        if number:
            by_number[number] = feature

    async with AsyncSessionLocal() as session:
        wards = list((await session.scalars(select(Ward).order_by(Ward.code))).all())
        updated = 0

        for ward in wards:
            number = municipal_number_from_ward(ward)
            if not number:
                print(f"skip {ward.code}: no municipal ward number")
                continue

            feature = by_number.get(number)
            if feature is None:
                print(f"skip {ward.code}: Bharatlas has no ward {number}")
                continue

            geometry = feature.get("geometry")
            if not geometry:
                continue

            geometry_json = json.dumps(geometry, separators=(",", ":"))
            lat, lng = compute_centroid(geometry_json)

            ward.municipal_ward_number = number
            ward.ward_area_name = feature_area_name(feature)
            ward.boundary_geojson = geometry_json
            ward.boundary_source = BOUNDARY_SOURCE
            ward.centroid_lat = lat
            ward.centroid_lng = lng
            updated += 1
            print(f"updated {ward.code} -> municipal ward {number} ({ward.ward_area_name})")

        await session.commit()
        print(f"Done. Updated {updated} ward(s).")


if __name__ == "__main__":
    asyncio.run(sync_boundaries())
