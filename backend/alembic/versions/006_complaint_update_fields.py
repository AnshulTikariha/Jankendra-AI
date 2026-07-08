"""add staff update fields to complaints

Revision ID: 006_complaint_update_fields
Revises: 005_ward_city
Create Date: 2026-07-08

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006_complaint_update_fields"
down_revision: Union[str, Sequence[str], None] = "005_ward_city"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("db4_complaints", schema=None) as batch_op:
        batch_op.add_column(sa.Column("assigned_department", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("staff_note", sa.Text(), nullable=True))
        batch_op.add_column(
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=True,
            )
        )

    op.execute(sa.text("UPDATE db4_complaints SET updated_at = created_at WHERE updated_at IS NULL"))


def downgrade() -> None:
    with op.batch_alter_table("db4_complaints", schema=None) as batch_op:
        batch_op.drop_column("updated_at")
        batch_op.drop_column("staff_note")
        batch_op.drop_column("assigned_department")
