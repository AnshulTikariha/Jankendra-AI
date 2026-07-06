"""Import or update municipal ward boundaries from Bharatlas for configured cities.

Usage:
    cd backend && python scripts/sync_municipal_wards.py
    cd backend && python scripts/sync_municipal_wards.py --cities bengaluru kanpur
    cd backend && python scripts/sync_municipal_wards.py --cities bhopal --match-demo
"""

from __future__ import annotations

import argparse
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
from app.data.municipal_layers import MUNICIPAL_LAYERS, MunicipalLayerConfig
from app.models import Ward
from app.services.ward_geo import compute_centroid, normalize_geojson_geometry

USER_AGENT = "JankendraAI/1.0 (ward boundary sync)"


def load_geojson(config: MunicipalLayerConfig) -> dict:
    local_path = ROOT / "data" / config.local_filename
    if local_path.exists():
        return json.loads(local_path.read_text(encoding="utf-8"))

    request = urllib.request.Request(config.geojson_url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=180) as response:
        payload = json.loads(response.read().decode("utf-8"))

    local_path.parent.mkdir(parents=True, exist_ok=True)
    local_path.write_text(json.dumps(payload), encoding="utf-8")
    return payload


def feature_property(feature: dict, keys: tuple[str, ...]) -> str | None:
    properties = feature.get("properties") or {}
    for key in keys:
        value = properties.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return None


def ward_code(config: MunicipalLayerConfig, ward_number: str) -> str:
    normalized = ward_number.zfill(3) if config.city != "kanpur" else ward_number.zfill(2)
    return f"{config.code_prefix}-{normalized}"


def demo_number_from_ward(ward: Ward) -> str | None:
    if ward.municipal_ward_number:
        return ward.municipal_ward_number
    code_match = re.search(r"(\d+)", ward.code)
    if code_match:
        return code_match.group(1)
    name_match = re.search(r"(\d+)", ward.name)
    if name_match:
        return name_match.group(1)
    return None


async def sync_city(
    session,
    config: MunicipalLayerConfig,
    *,
    match_demo: bool,
) -> int:
    collection = load_geojson(config)
    features = collection.get("features") or []
    by_number = {}
    for feature in features:
        number = feature_property(feature, config.number_keys)
        if number:
            by_number[number] = feature
            by_number[str(int(number))] = feature if number.isdigit() else feature

    updated = 0

    if match_demo and config.city == "bhopal":
        wards = list((await session.scalars(select(Ward).where(Ward.code.like("W%")))).all())
        for ward in wards:
            number = demo_number_from_ward(ward)
            if not number:
                continue
            feature = by_number.get(number) or by_number.get(str(int(number)))
            if not feature or not feature.get("geometry"):
                print(f"skip {ward.code}: no Bharatlas feature for ward {number}")
                continue
            geometry_json = json.dumps(feature["geometry"], separators=(",", ":"))
            lat, lng = compute_centroid(geometry_json)
            ward.city = config.city
            ward.municipal_ward_number = number
            ward.ward_area_name = feature_property(feature, config.name_keys)
            ward.boundary_geojson = geometry_json
            ward.boundary_source = f"bharatlas:{config.layer_id}"
            ward.centroid_lat = lat
            ward.centroid_lng = lng
            updated += 1
            print(f"updated demo {ward.code} -> {config.city} ward {number}")
        return updated

    for feature in features:
        number = feature_property(feature, config.number_keys)
        geometry = feature.get("geometry")
        if not number or not geometry:
            continue

        geometry = normalize_geojson_geometry(geometry)
        code = ward_code(config, number)
        geometry_json = json.dumps(geometry, separators=(",", ":"))
        lat, lng = compute_centroid(geometry_json)
        area_name = feature_property(feature, config.name_keys)

        ward = await session.scalar(select(Ward).where(Ward.code == code))
        if ward is None:
            ward = Ward(
                name=f"Ward {number}",
                code=code,
                city=config.city,
                constituency_name=config.constituency_name,
            )
            session.add(ward)

        ward.name = f"Ward {number}"
        ward.city = config.city
        ward.constituency_name = config.constituency_name
        ward.municipal_ward_number = number
        ward.ward_area_name = area_name
        ward.boundary_geojson = geometry_json
        ward.boundary_source = f"bharatlas:{config.layer_id}"
        ward.centroid_lat = lat
        ward.centroid_lng = lng
        updated += 1

    print(f"{config.city}: upserted {updated} ward(s)")
    return updated


async def run(cities: list[str], match_demo: bool) -> None:
    configs = [layer for layer in MUNICIPAL_LAYERS if layer.city in cities]
    if not configs:
        raise SystemExit(f"No matching city configs for: {', '.join(cities)}")

    async with AsyncSessionLocal() as session:
        total = 0
        for config in configs:
            use_demo_match = match_demo and config.city == "bhopal"
            total += await sync_city(session, config, match_demo=use_demo_match)
        await session.commit()
        print(f"Done. Touched {total} ward record(s) across {len(configs)} city/cities.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync municipal ward boundaries from Bharatlas")
    parser.add_argument(
        "--cities",
        nargs="+",
        default=[layer.city for layer in MUNICIPAL_LAYERS],
        choices=[layer.city for layer in MUNICIPAL_LAYERS],
        help="Cities to sync (default: all configured)",
    )
    parser.add_argument(
        "--match-demo",
        action="store_true",
        help="For Bhopal only: update existing demo W42–W47 rows instead of importing all 86 wards",
    )
    args = parser.parse_args()
    asyncio.run(run(args.cities, args.match_demo))


if __name__ == "__main__":
    main()
