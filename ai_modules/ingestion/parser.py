"""Transcript parsing entry point."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class IngestedSegment:
    """Normalized segment extracted from a transcript or source document."""

    text: str
    source_id: str
    position: int
    metadata: dict[str, str] = field(default_factory=dict)


class TranscriptParser:
    """Parses raw meeting transcripts into ordered text segments."""

    def parse(self, *, source_id: str, transcript: str) -> list[IngestedSegment]:
        raise NotImplementedError("transcript parsing pipeline is pending")
