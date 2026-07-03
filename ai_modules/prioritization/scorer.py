"""Development prioritization entry point."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class PriorityInput:
    """Input factors for development priority scoring."""

    id: str
    ward_id: str
    severity: float
    affected_population: int
    commitment_weight: float = 0.0
    metadata: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class DevelopmentPriority:
    """Prioritized development candidate returned to the backend."""

    id: str
    ward_id: str
    score: float
    reasons: list[str]


class PriorityScorer:
    """Scores development candidates using explicit factor pipelines."""

    def score(self, candidates: list[PriorityInput]) -> list[DevelopmentPriority]:
        raise NotImplementedError("development prioritization pipeline is pending")
