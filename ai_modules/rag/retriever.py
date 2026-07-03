"""RAG retrieval and context assembly entry point."""

from __future__ import annotations

from dataclasses import dataclass, field

from ai_modules.core.interfaces import Embedder, VectorSearchResult, VectorStore


@dataclass(frozen=True, slots=True)
class RAGQuery:
    """Query DTO for retrieval-augmented context assembly."""

    text: str
    ward_id: str | None = None
    top_k: int = 5
    filters: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class RAGContext:
    """Assembled context returned to backend orchestration."""

    query: RAGQuery
    hits: list[VectorSearchResult]


class RAGRetriever:
    """Builds the four-layer context described by the architecture."""

    def __init__(self, *, embedder: Embedder, vector_store: VectorStore) -> None:
        self.embedder = embedder
        self.vector_store = vector_store

    def retrieve(self, query: RAGQuery) -> RAGContext:
        raise NotImplementedError("RAG context assembly pipeline is pending")
