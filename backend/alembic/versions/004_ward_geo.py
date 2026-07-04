"""ward geo fields for boundary sync and resolve

Revision ID: 004_ward_geo
Revises: 003_complaint_fields
Create Date: 2026-07-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004_ward_geo"
down_revision: Union[str, Sequence[str], None] = "003_complaint_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("db1_wards", schema=None) as batch_op:
        batch_op.add_column(sa.Column("municipal_ward_number", sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column("ward_area_name", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("centroid_lat", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("centroid_lng", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("boundary_geojson", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("boundary_source", sa.String(length=100), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("db1_wards", schema=None) as batch_op:
        batch_op.drop_column("boundary_source")
        batch_op.drop_column("boundary_geojson")
        batch_op.drop_column("centroid_lng")
        batch_op.drop_column("centroid_lat")
        batch_op.drop_column("ward_area_name")
        batch_op.drop_column("municipal_ward_number")
