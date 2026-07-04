from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base


class Commitment(Base):
    __tablename__ = "db3_commitments"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    ward_id: Mapped[int | None] = mapped_column(ForeignKey("db1_wards.id"), nullable=True, index=True)
    assignee: Mapped[str | None] = mapped_column(String(255), nullable=True)
    deadline: Mapped[date] = mapped_column(Date, index=True)
    weight: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(50), default="active", index=True)
    source_meeting_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    history: Mapped[list["CommitmentHistory"]] = relationship(back_populates="commitment")


class CommitmentHistory(Base):
    __tablename__ = "db3_commitment_history"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    commitment_id: Mapped[str] = mapped_column(ForeignKey("db3_commitments.id"), index=True)
    action: Mapped[str] = mapped_column(String(50))
    old_deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    new_deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    old_weight: Mapped[int | None] = mapped_column(Integer, nullable=True)
    new_weight: Mapped[int | None] = mapped_column(Integer, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    commitment: Mapped[Commitment] = relationship(back_populates="history")
