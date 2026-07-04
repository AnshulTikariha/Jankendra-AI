"""initial phase1 schema

Revision ID: 001_initial_phase1
Revises:
Create Date: 2026-07-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001_initial_phase1"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "db1_wards",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("constituency_name", sa.String(length=255), nullable=False),
        sa.Column("population", sa.Integer(), nullable=True),
        sa.Column("registered_voters", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("db1_wards", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_db1_wards_code"), ["code"], unique=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(as_uuid=False), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_users_email"), ["email"], unique=True)
        batch_op.create_index(batch_op.f("ix_users_role"), ["role"], unique=False)

    op.create_table(
        "db1_demographics",
        sa.Column("id", sa.Uuid(as_uuid=False), nullable=False),
        sa.Column("ward_id", sa.Integer(), nullable=False),
        sa.Column("population", sa.Integer(), nullable=False),
        sa.Column("registered_voters", sa.Integer(), nullable=False),
        sa.Column("literacy_rate", sa.Float(), nullable=True),
        sa.Column("key_indicators", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["ward_id"], ["db1_wards.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("db1_demographics", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_db1_demographics_ward_id"), ["ward_id"], unique=False)

    op.create_table(
        "db1_infrastructure",
        sa.Column("id", sa.Uuid(as_uuid=False), nullable=False),
        sa.Column("ward_id", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["ward_id"], ["db1_wards.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("db1_infrastructure", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_db1_infrastructure_category"), ["category"], unique=False)
        batch_op.create_index(batch_op.f("ix_db1_infrastructure_ward_id"), ["ward_id"], unique=False)

    op.create_table(
        "db1_schemes",
        sa.Column("id", sa.Uuid(as_uuid=False), nullable=False),
        sa.Column("ward_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("penetration_rate", sa.Float(), nullable=True),
        sa.Column("beneficiaries", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["ward_id"], ["db1_wards.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("db1_schemes", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_db1_schemes_ward_id"), ["ward_id"], unique=False)

    op.create_table(
        "db2_cluster_snapshots",
        sa.Column("id", sa.Uuid(as_uuid=False), nullable=False),
        sa.Column("ward_id", sa.Integer(), nullable=False),
        sa.Column("cluster_label", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("citizen_count", sa.Integer(), nullable=False),
        sa.Column("snapshot_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("metadata_json", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["ward_id"], ["db1_wards.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("db2_cluster_snapshots", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_db2_cluster_snapshots_ward_id"), ["ward_id"], unique=False)

    op.create_table(
        "db2_meeting_summaries",
        sa.Column("id", sa.Uuid(as_uuid=False), nullable=False),
        sa.Column("meeting_date", sa.Date(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary_text", sa.Text(), nullable=False),
        sa.Column("ward_id", sa.Integer(), nullable=True),
        sa.Column("source_filename", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["ward_id"], ["db1_wards.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("db2_meeting_summaries", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_db2_meeting_summaries_ward_id"), ["ward_id"], unique=False)

    op.create_table(
        "db2_resolved_commitments",
        sa.Column("id", sa.Uuid(as_uuid=False), nullable=False),
        sa.Column("original_commitment_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("ward_id", sa.Integer(), nullable=True),
        sa.Column("assignee", sa.String(length=255), nullable=True),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("history_snapshot", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["ward_id"], ["db1_wards.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("db2_resolved_commitments", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_db2_resolved_commitments_original_commitment_id"),
            ["original_commitment_id"],
            unique=False,
        )
        batch_op.create_index(batch_op.f("ix_db2_resolved_commitments_ward_id"), ["ward_id"], unique=False)

    op.create_table(
        "db3_commitments",
        sa.Column("id", sa.Uuid(as_uuid=False), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("ward_id", sa.Integer(), nullable=True),
        sa.Column("assignee", sa.String(length=255), nullable=True),
        sa.Column("deadline", sa.Date(), nullable=False),
        sa.Column("weight", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("source_meeting_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["ward_id"], ["db1_wards.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("db3_commitments", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_db3_commitments_deadline"), ["deadline"], unique=False)
        batch_op.create_index(batch_op.f("ix_db3_commitments_status"), ["status"], unique=False)
        batch_op.create_index(batch_op.f("ix_db3_commitments_ward_id"), ["ward_id"], unique=False)

    op.create_table(
        "db4_complaint_clusters",
        sa.Column("id", sa.Uuid(as_uuid=False), nullable=False),
        sa.Column("ward_id", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("citizen_count", sa.Integer(), nullable=False),
        sa.Column("department_suggestion", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["ward_id"], ["db1_wards.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("db4_complaint_clusters", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_db4_complaint_clusters_category"), ["category"], unique=False)
        batch_op.create_index(batch_op.f("ix_db4_complaint_clusters_ward_id"), ["ward_id"], unique=False)

    op.create_table(
        "db3_commitment_history",
        sa.Column("id", sa.Uuid(as_uuid=False), nullable=False),
        sa.Column("commitment_id", sa.Uuid(as_uuid=False), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("old_deadline", sa.Date(), nullable=True),
        sa.Column("new_deadline", sa.Date(), nullable=True),
        sa.Column("old_weight", sa.Integer(), nullable=True),
        sa.Column("new_weight", sa.Integer(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["commitment_id"], ["db3_commitments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("db3_commitment_history", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_db3_commitment_history_commitment_id"), ["commitment_id"], unique=False)

    op.create_table(
        "db4_complaints",
        sa.Column("id", sa.Uuid(as_uuid=False), nullable=False),
        sa.Column("ward_id", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("citizen_contact", sa.String(length=255), nullable=True),
        sa.Column("cluster_id", sa.Uuid(as_uuid=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["cluster_id"], ["db4_complaint_clusters.id"]),
        sa.ForeignKeyConstraint(["ward_id"], ["db1_wards.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("db4_complaints", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_db4_complaints_category"), ["category"], unique=False)
        batch_op.create_index(batch_op.f("ix_db4_complaints_cluster_id"), ["cluster_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_db4_complaints_ward_id"), ["ward_id"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("db4_complaints", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_db4_complaints_ward_id"))
        batch_op.drop_index(batch_op.f("ix_db4_complaints_cluster_id"))
        batch_op.drop_index(batch_op.f("ix_db4_complaints_category"))
    op.drop_table("db4_complaints")

    with op.batch_alter_table("db3_commitment_history", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_db3_commitment_history_commitment_id"))
    op.drop_table("db3_commitment_history")

    with op.batch_alter_table("db4_complaint_clusters", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_db4_complaint_clusters_ward_id"))
        batch_op.drop_index(batch_op.f("ix_db4_complaint_clusters_category"))
    op.drop_table("db4_complaint_clusters")

    with op.batch_alter_table("db3_commitments", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_db3_commitments_ward_id"))
        batch_op.drop_index(batch_op.f("ix_db3_commitments_status"))
        batch_op.drop_index(batch_op.f("ix_db3_commitments_deadline"))
    op.drop_table("db3_commitments")

    with op.batch_alter_table("db2_resolved_commitments", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_db2_resolved_commitments_ward_id"))
        batch_op.drop_index(batch_op.f("ix_db2_resolved_commitments_original_commitment_id"))
    op.drop_table("db2_resolved_commitments")

    with op.batch_alter_table("db2_meeting_summaries", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_db2_meeting_summaries_ward_id"))
    op.drop_table("db2_meeting_summaries")

    with op.batch_alter_table("db2_cluster_snapshots", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_db2_cluster_snapshots_ward_id"))
    op.drop_table("db2_cluster_snapshots")

    with op.batch_alter_table("db1_schemes", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_db1_schemes_ward_id"))
    op.drop_table("db1_schemes")

    with op.batch_alter_table("db1_infrastructure", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_db1_infrastructure_ward_id"))
        batch_op.drop_index(batch_op.f("ix_db1_infrastructure_category"))
    op.drop_table("db1_infrastructure")

    with op.batch_alter_table("db1_demographics", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_db1_demographics_ward_id"))
    op.drop_table("db1_demographics")

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_users_role"))
        batch_op.drop_index(batch_op.f("ix_users_email"))
    op.drop_table("users")

    with op.batch_alter_table("db1_wards", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_db1_wards_code"))
    op.drop_table("db1_wards")
