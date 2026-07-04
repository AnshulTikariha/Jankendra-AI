"""complaint fields for phase 2

Revision ID: 003_complaint_fields
Revises: 002_auth_phone_otp
Create Date: 2026-07-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_complaint_fields"
down_revision: Union[str, Sequence[str], None] = "002_auth_phone_otp"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("db4_complaints", schema=None) as batch_op:
        batch_op.add_column(sa.Column("public_reference", sa.String(length=30), nullable=True))
        batch_op.add_column(sa.Column("location_detail", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("status", sa.String(length=50), nullable=False, server_default="submitted"))
        batch_op.add_column(sa.Column("source", sa.String(length=20), nullable=False, server_default="citizen"))

    op.execute(
        sa.text(
            "UPDATE db4_complaints "
            "SET public_reference = 'JK-LEGACY-' || substr(id, 1, 8) "
            "WHERE public_reference IS NULL"
        )
    )

    with op.batch_alter_table("db4_complaints", schema=None) as batch_op:
        batch_op.alter_column("public_reference", existing_type=sa.String(length=30), nullable=False)
        batch_op.create_index(batch_op.f("ix_db4_complaints_public_reference"), ["public_reference"], unique=True)
        batch_op.create_index(batch_op.f("ix_db4_complaints_citizen_contact"), ["citizen_contact"], unique=False)
        batch_op.create_index(batch_op.f("ix_db4_complaints_status"), ["status"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("db4_complaints", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_db4_complaints_status"))
        batch_op.drop_index(batch_op.f("ix_db4_complaints_citizen_contact"))
        batch_op.drop_index(batch_op.f("ix_db4_complaints_public_reference"))
        batch_op.drop_column("source")
        batch_op.drop_column("status")
        batch_op.drop_column("location_detail")
        batch_op.drop_column("public_reference")
