"""Complaint clustering entry point."""

from __future__ import annotations

from dataclasses import dataclass, field

from ai_modules.core.interfaces import Embedder, VectorStore


@dataclass(frozen=True, slots=True)
class ComplaintInput:
    """Complaint DTO accepted by the issue engine."""

    id: str
    ward_id: str
    text: str
    metadata: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class ComplaintCluster:
    """Cluster assignment returned by the issue engine."""

    id: str
    ward_id: str
    complaint_ids: list[str]
    label: str | None = None
    score: float | None = None


class ComplaintClusterer:
    """Groups related complaints within a ward."""

    def __init__(self, *, embedder: Embedder, vector_store: VectorStore) -> None:
        self.embedder = embedder
        self.vector_store = vector_store

    def cluster(self, complaints: list[ComplaintInput]) -> list[ComplaintCluster]:
        raise NotImplementedError("complaint clustering pipeline is pending")
