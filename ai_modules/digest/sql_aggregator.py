"""Pure SQL digest aggregation entry point."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date


@dataclass(frozen=True, slots=True)
class DigestAggregation:
    """Aggregated digest data prepared without LLM inference."""

    ward_id: str
    period_start: date
    period_end: date
    metrics: dict[str, int | float] = field(default_factory=dict)


class DigestSQLAggregator:
    """Prepares weekly digest inputs from backend-provided query results."""

    def aggregate(self, rows: list[dict[str, object]]) -> list[DigestAggregation]:
        raise NotImplementedError("digest SQL aggregation is pending")
