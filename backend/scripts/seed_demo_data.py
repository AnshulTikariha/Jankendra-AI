import asyncio
import sys
from datetime import date, timedelta
from pathlib import Path

from sqlalchemy import func, select

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.commitment_weights import compute_commitment_weight
from app.core.database import AsyncSessionLocal, async_engine
from app.models import (
    Commitment,
    CommitmentHistory,
    Complaint,
    ComplaintCluster,
    Demographic,
    Infrastructure,
    Scheme,
    User,
    Ward,
)

CONSTITUENCY_NAME = "South Delhi"
MLA_NAME = "Shri Rajendra Kumar Verma"
DEMO_OTP = "246810"

USER_SEED = [
    {
        "phone": "9876543210",
        "full_name": MLA_NAME,
        "role": "leader",
    },
    {
        "phone": "9876543211",
        "full_name": "Constituency Staff",
        "role": "staff",
    },
    {
        "phone": "9876543212",
        "full_name": "Resident",
        "role": "citizen",
    },
]

WARD_SEED = [
    {
        "name": "Ward 42",
        "code": "W42",
        "population": 50000,
        "registered_voters": 33800,
        "literacy_rate": 82.4,
        "key_indicators": f"MLA: {MLA_NAME}. Anchor issue: recurring drainage canal overflow for 3 years.",
        "infrastructure": [
            {
                "category": "drainage",
                "status": "critical",
                "description": "Recurring drainage canal overflow during monsoon for 3 years.",
            },
            {
                "category": "roads",
                "status": "fair",
                "description": "Main approach road needs resurfacing near market area.",
            },
        ],
        "schemes": [
            {"name": "PM Awas Yojana", "penetration_rate": 0.62, "beneficiaries": 1840},
            {"name": "Ayushman Bharat", "penetration_rate": 0.71, "beneficiaries": 2410},
        ],
    },
    {
        "name": "Ward 43",
        "code": "W43",
        "population": 45000,
        "registered_voters": 30400,
        "literacy_rate": 79.1,
        "key_indicators": "Mixed residential and small commercial zones.",
        "infrastructure": [
            {
                "category": "water",
                "status": "poor",
                "description": "Irregular piped water supply in southern blocks.",
            }
        ],
        "schemes": [
            {"name": "PM Awas Yojana", "penetration_rate": 0.55, "beneficiaries": 1520},
        ],
    },
    {
        "name": "Ward 44",
        "code": "W44",
        "population": 44000,
        "registered_voters": 29700,
        "literacy_rate": 80.5,
        "key_indicators": "Dense housing colonies with limited open space.",
        "infrastructure": [
            {
                "category": "roads",
                "status": "poor",
                "description": "Internal colony roads damaged after last monsoon.",
            }
        ],
        "schemes": [
            {"name": "Ayushman Bharat", "penetration_rate": 0.68, "beneficiaries": 1980},
        ],
    },
    {
        "name": "Ward 45",
        "code": "W45",
        "population": 44000,
        "registered_voters": 29700,
        "literacy_rate": 81.0,
        "key_indicators": "Growing population near transit corridor.",
        "infrastructure": [
            {
                "category": "sanitation",
                "status": "fair",
                "description": "Community toilet coverage incomplete in two blocks.",
            }
        ],
        "schemes": [
            {"name": "PM Awas Yojana", "penetration_rate": 0.48, "beneficiaries": 1310},
        ],
    },
    {
        "name": "Ward 46",
        "code": "W46",
        "population": 43500,
        "registered_voters": 29400,
        "literacy_rate": 78.6,
        "key_indicators": "Older settlements with limited drainage capacity.",
        "infrastructure": [
            {
                "category": "drainage",
                "status": "poor",
                "description": "Open drains clogged in market lane.",
            }
        ],
        "schemes": [
            {"name": "Ayushman Bharat", "penetration_rate": 0.64, "beneficiaries": 1760},
        ],
    },
    {
        "name": "Ward 47",
        "code": "W47",
        "population": 43500,
        "registered_voters": 29400,
        "literacy_rate": 80.2,
        "key_indicators": "Residential ward with school and primary health centre.",
        "infrastructure": [
            {
                "category": "health",
                "status": "fair",
                "description": "Primary health centre needs staff and equipment upgrade.",
            }
        ],
        "schemes": [
            {"name": "PM Awas Yojana", "penetration_rate": 0.51, "beneficiaries": 1400},
        ],
    },
]


async def seed_users(session) -> dict[str, int]:
    existing_count = await session.scalar(select(func.count()).select_from(User))
    if existing_count and existing_count > 0:
        return {"skipped": 1, "users": existing_count}

    for user_data in USER_SEED:
        session.add(
            User(
                phone=user_data["phone"],
                full_name=user_data["full_name"],
                role=user_data["role"],
                is_active=True,
            )
        )

    await session.flush()
    return {"skipped": 0, "users": len(USER_SEED)}


async def seed_wards(session) -> dict[str, int]:
    existing_count = await session.scalar(select(func.count()).select_from(Ward))
    if existing_count and existing_count > 0:
        return {
            "skipped": 1,
            "wards": existing_count,
            "demographics": 0,
            "infrastructure": 0,
            "schemes": 0,
        }

    wards_created = 0
    demographics_created = 0
    infrastructure_created = 0
    schemes_created = 0

    for ward_data in WARD_SEED:
        ward = Ward(
            name=ward_data["name"],
            code=ward_data["code"],
            constituency_name=CONSTITUENCY_NAME,
            population=ward_data["population"],
            registered_voters=ward_data["registered_voters"],
        )
        session.add(ward)
        await session.flush()
        wards_created += 1

        session.add(
            Demographic(
                ward_id=ward.id,
                population=ward_data["population"],
                registered_voters=ward_data["registered_voters"],
                literacy_rate=ward_data["literacy_rate"],
                key_indicators=ward_data["key_indicators"],
            )
        )
        demographics_created += 1

        for item in ward_data["infrastructure"]:
            session.add(
                Infrastructure(
                    ward_id=ward.id,
                    category=item["category"],
                    status=item["status"],
                    description=item["description"],
                )
            )
            infrastructure_created += 1

        for item in ward_data["schemes"]:
            session.add(
                Scheme(
                    ward_id=ward.id,
                    name=item["name"],
                    penetration_rate=item["penetration_rate"],
                    beneficiaries=item["beneficiaries"],
                    status="active",
                )
            )
            schemes_created += 1

    return {
        "skipped": 0,
        "wards": wards_created,
        "demographics": demographics_created,
        "infrastructure": infrastructure_created,
        "schemes": schemes_created,
    }


async def seed_complaints(session) -> dict[str, int]:
    existing_count = await session.scalar(select(func.count()).select_from(Complaint))
    if existing_count and existing_count > 0:
        return {"skipped": 1, "complaints": existing_count}

    ward_42 = await session.scalar(select(Ward).where(Ward.code == "W42"))
    ward_43 = await session.scalar(select(Ward).where(Ward.code == "W43"))
    if ward_42 is None:
        return {"skipped": 1, "complaints": 0}

    cluster = ComplaintCluster(
        ward_id=ward_42.id,
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
            ward_id=ward_42.id,
            description="Standing water after rain near the main market entrance.",
            category="drainage",
            location_detail="Main market entrance",
            citizen_contact="9876543212",
            status="under_review",
            source="citizen",
            cluster_id=cluster.id,
        )
    )
    session.add(
        Complaint(
            public_reference="JK-2026-0002",
            ward_id=ward_42.id,
            description="Recurring drainage canal overflow during monsoon.",
            category="drainage",
            location_detail="Canal road",
            citizen_contact="9876543212",
            status="submitted",
            source="citizen",
            cluster_id=cluster.id,
        )
    )

    if ward_43 is not None:
        water_cluster = ComplaintCluster(
            ward_id=ward_43.id,
            label="Water issues",
            category="water",
            citizen_count=1,
            department_suggestion="WMD",
        )
        session.add(water_cluster)
        await session.flush()
        session.add(
            Complaint(
                public_reference="JK-2026-0003",
                ward_id=ward_43.id,
                description="Irregular piped water supply in southern blocks.",
                category="water",
                citizen_contact="9876543211",
                status="submitted",
                source="staff",
                cluster_id=water_cluster.id,
            )
        )

    await session.flush()
    return {"skipped": 0, "complaints": 3 if ward_43 is not None else 2}


async def seed_commitments(session) -> dict[str, int]:
    existing_count = await session.scalar(select(func.count()).select_from(Commitment))
    if existing_count and existing_count > 0:
        return {"skipped": 1, "commitments": existing_count}

    ward_42 = await session.scalar(select(Ward).where(Ward.code == "W42"))
    ward_43 = await session.scalar(select(Ward).where(Ward.code == "W43"))
    today = date.today()

    seed_items = [
        {
            "title": "Clear drainage canal before monsoon",
            "description": "Desilt Ward 42 canal and remove market-side blockages.",
            "ward": ward_42,
            "assignee": "PWD Supervisor",
            "deadline": today - timedelta(days=5),
        },
        {
            "title": "Complete streetlight repair on Block C",
            "description": "Replace failed poles and restore night lighting.",
            "ward": ward_42,
            "assignee": "Electrical Wing",
            "deadline": today - timedelta(days=10),
        },
        {
            "title": "Restore morning water supply hours",
            "description": "Coordinate tanker support until pipeline pressure stabilizes.",
            "ward": ward_43,
            "assignee": "WMD Officer",
            "deadline": today + timedelta(days=7),
        },
    ]

    created = 0
    for item in seed_items:
        ward = item["ward"]
        if ward is None:
            continue
        weight = compute_commitment_weight(item["deadline"], today)
        commitment = Commitment(
            title=item["title"],
            description=item["description"],
            ward_id=ward.id,
            assignee=item["assignee"],
            deadline=item["deadline"],
            weight=weight,
            status="active",
        )
        session.add(commitment)
        await session.flush()
        session.add(
            CommitmentHistory(
                commitment_id=commitment.id,
                action="created",
                new_deadline=item["deadline"],
                new_weight=weight,
                note="Seeded demo commitment",
            )
        )
        created += 1

    await session.flush()
    return {"skipped": 0, "commitments": created}


async def seed_demo_data() -> dict[str, dict[str, int]]:
    async with AsyncSessionLocal() as session:
        users_result = await seed_users(session)
        wards_result = await seed_wards(session)
        complaints_result = await seed_complaints(session)
        commitments_result = await seed_commitments(session)
        await session.commit()
        return {
            "users": users_result,
            "wards": wards_result,
            "complaints": complaints_result,
            "commitments": commitments_result,
        }


async def main() -> None:
    result = await seed_demo_data()
    await async_engine.dispose()

    users = result["users"]
    wards = result["wards"]
    complaints = result["complaints"]
    commitments = result["commitments"]

    if users["skipped"]:
        print(f"Users seed skipped. Database already has {users['users']} user(s).")
    else:
        print("Demo users seeded successfully.")
        print(f"  Users: {users['users']}")
        print(f"  Demo OTP for all users: {DEMO_OTP}")
        for user in USER_SEED:
            print(f"  - {user['role']}: {user['phone']}")

    if wards["skipped"]:
        print(f"Wards seed skipped. Database already has {wards['wards']} ward(s).")
    else:
        print("Demo constituency seeded successfully.")
        print(f"  Wards: {wards['wards']}")
        print(f"  Demographics: {wards['demographics']}")
        print(f"  Infrastructure: {wards['infrastructure']}")
        print(f"  Schemes: {wards['schemes']}")
        print(f"  Constituency: {CONSTITUENCY_NAME}")
        print(f"  MLA: {MLA_NAME}")

    if complaints["skipped"]:
        print(f"Complaints seed skipped. Database already has {complaints['complaints']} complaint(s).")
    else:
        print("Demo complaints seeded successfully.")
        print(f"  Complaints: {complaints['complaints']}")

    if commitments["skipped"]:
        print(f"Commitments seed skipped. Database already has {commitments['commitments']} commitment(s).")
    else:
        print("Demo commitments seeded successfully.")
        print(f"  Commitments: {commitments['commitments']}")


if __name__ == "__main__":
    asyncio.run(main())
