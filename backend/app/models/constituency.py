from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base


class Ward(Base):
    __tablename__ = "db1_wards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255))
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    city: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    constituency_name: Mapped[str] = mapped_column(String(255))
    population: Mapped[int | None] = mapped_column(Integer, nullable=True)
    registered_voters: Mapped[int | None] = mapped_column(Integer, nullable=True)
    municipal_ward_number: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    ward_area_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    centroid_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    centroid_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    boundary_geojson: Mapped[str | None] = mapped_column(Text, nullable=True)
    boundary_source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    demographics: Mapped[list["Demographic"]] = relationship(back_populates="ward")
    infrastructure: Mapped[list["Infrastructure"]] = relationship(back_populates="ward")
    schemes: Mapped[list["Scheme"]] = relationship(back_populates="ward")


class Demographic(Base):
    __tablename__ = "db1_demographics"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    ward_id: Mapped[int] = mapped_column(ForeignKey("db1_wards.id"), index=True)
    population: Mapped[int] = mapped_column(Integer)
    registered_voters: Mapped[int] = mapped_column(Integer)
    literacy_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    key_indicators: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    ward: Mapped[Ward] = relationship(back_populates="demographics")


class Infrastructure(Base):
    __tablename__ = "db1_infrastructure"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    ward_id: Mapped[int] = mapped_column(ForeignKey("db1_wards.id"), index=True)
    category: Mapped[str] = mapped_column(String(100), index=True)
    status: Mapped[str] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    ward: Mapped[Ward] = relationship(back_populates="infrastructure")


class Scheme(Base):
    __tablename__ = "db1_schemes"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    ward_id: Mapped[int] = mapped_column(ForeignKey("db1_wards.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    penetration_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    beneficiaries: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    ward: Mapped[Ward] = relationship(back_populates="schemes")
