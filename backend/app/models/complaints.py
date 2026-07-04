from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base


class ComplaintCluster(Base):
    __tablename__ = "db4_complaint_clusters"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    ward_id: Mapped[int] = mapped_column(ForeignKey("db1_wards.id"), index=True)
    label: Mapped[str] = mapped_column(String(255))
    category: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    citizen_count: Mapped[int] = mapped_column(Integer, default=0)
    department_suggestion: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    complaints: Mapped[list["Complaint"]] = relationship(back_populates="cluster")


class Complaint(Base):
    __tablename__ = "db4_complaints"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    ward_id: Mapped[int] = mapped_column(ForeignKey("db1_wards.id"), index=True)
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100), index=True)
    citizen_contact: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cluster_id: Mapped[str | None] = mapped_column(
        ForeignKey("db4_complaint_clusters.id"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    cluster: Mapped[ComplaintCluster | None] = relationship(back_populates="complaints")
