"""auth phone otp

Revision ID: 002_auth_phone_otp
Revises: 001_initial_phase1
Create Date: 2026-07-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002_auth_phone_otp"
down_revision: Union[str, Sequence[str], None] = "001_initial_phase1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("phone", sa.String(length=15), nullable=True))
        batch_op.alter_column("email", existing_type=sa.String(length=255), nullable=True)
        batch_op.alter_column("password_hash", existing_type=sa.String(length=255), nullable=True)

    op.execute(sa.text("DELETE FROM users"))

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.alter_column("phone", existing_type=sa.String(length=15), nullable=False)
        batch_op.create_index(batch_op.f("ix_users_phone"), ["phone"], unique=True)


def downgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_users_phone"))
        batch_op.drop_column("phone")
        batch_op.alter_column("password_hash", existing_type=sa.String(length=255), nullable=False)
        batch_op.alter_column("email", existing_type=sa.String(length=255), nullable=False)
