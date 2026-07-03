"""Commitment extraction entry point."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date

from ai_modules.core.interfaces import LLMProvider


@dataclass(frozen=True, slots=True)
class CommitmentExtraction:
    """A commitment extracted from transcript text."""

    text: str
    owner: str | None = None
    due_date: date | None = None
    confidence: float | None = None
    metadata: dict[str, str] = field(default_factory=dict)


class CommitmentExtractor:
    """Extracts actionable commitments from meeting text."""

    def __init__(self, *, llm_provider: LLMProvider) -> None:
        self.llm_provider = llm_provider

    def extract(self, transcript: str) -> list[CommitmentExtraction]:
        raise NotImplementedError("commitment extraction pipeline is pending")
