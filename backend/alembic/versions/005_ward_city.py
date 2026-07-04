"""add city column to wards

Revision ID: 005_ward_city
Revises: 004_ward_geo
Create Date: 2026-07-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005_ward_city"
down_revision: Union[str, Sequence[str], None] = "004_ward_geo"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("db1_wards", schema=None) as batch_op:
        batch_op.add_column(sa.Column("city", sa.String(length=50), nullable=True))
        batch_op.create_index(batch_op.f("ix_db1_wards_city"), ["city"], unique=False)

    op.execute(sa.text("UPDATE db1_wards SET city = 'bhopal' WHERE city IS NULL"))


def downgrade() -> None:
    with op.batch_alter_table("db1_wards", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_db1_wards_city"))
        batch_op.drop_column("city")
