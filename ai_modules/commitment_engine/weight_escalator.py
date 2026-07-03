"""Commitment weight escalation entry point."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True, slots=True)
class CommitmentForEscalation:
    """Commitment DTO accepted by the weight escalation job."""

    id: str
    base_weight: float
    due_date: date | None
    status: str


@dataclass(frozen=True, slots=True)
class EscalatedCommitment:
    """Commitment score returned by the escalation job."""

    id: str
    weight: float
    reason: str


class WeightEscalator:
    """Computes deadline-aware commitment weights."""

    def escalate(
        self, commitments: list[CommitmentForEscalation], *, as_of: date
    ) -> list[EscalatedCommitment]:
        raise NotImplementedError("commitment weight escalation is pending")
