"""pgvector vector store adapter stub."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from ai_modules.core.interfaces import EmbeddingVector, VectorRecord, VectorSearchResult


class PgVectorStore:
    """Production vector store placeholder backed by PostgreSQL pgvector."""

    def __init__(self, *, database_url: str) -> None:
        self.database_url = database_url

    def upsert(self, collection: str, records: Sequence[VectorRecord]) -> None:
        raise NotImplementedError("pgvector provider implementation is pending")

    def query(
        self,
        collection: str,
        embedding: EmbeddingVector,
        *,
        top_k: int = 5,
        filters: Mapping[str, Any] | None = None,
    ) -> list[VectorSearchResult]:
        raise NotImplementedError("pgvector provider implementation is pending")

    def delete(self, collection: str, ids: Sequence[str]) -> None:
        raise NotImplementedError("pgvector provider implementation is pending")
