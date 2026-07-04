from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from app.models.base import Base


class MeetingSummary(Base):
    __tablename__ = "db2_meeting_summaries"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    meeting_date: Mapped[date] = mapped_column(Date)
    title: Mapped[str] = mapped_column(String(255))
    summary_text: Mapped[str] = mapped_column(Text)
    ward_id: Mapped[int | None] = mapped_column(ForeignKey("db1_wards.id"), nullable=True, index=True)
    source_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ResolvedCommitment(Base):
    __tablename__ = "db2_resolved_commitments"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    original_commitment_id: Mapped[str] = mapped_column(String(36), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    ward_id: Mapped[int | None] = mapped_column(ForeignKey("db1_wards.id"), nullable=True, index=True)
    assignee: Mapped[str | None] = mapped_column(String(255), nullable=True)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    history_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ClusterSnapshot(Base):
    __tablename__ = "db2_cluster_snapshots"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    ward_id: Mapped[int] = mapped_column(ForeignKey("db1_wards.id"), index=True)
    cluster_label: Mapped[str] = mapped_column(String(255))
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    citizen_count: Mapped[int] = mapped_column(Integer, default=0)
    snapshot_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
