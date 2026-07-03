"""Mock providers for unit tests and early engine development."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from math import sqrt
from typing import Any

from ai_modules.core.interfaces import (
    EmbeddingVector,
    LLMMessage,
    LLMResponse,
    VectorRecord,
    VectorSearchResult,
)


class MockLLMProvider:
    """Deterministic LLM provider used in tests."""

    def __init__(self, response_text: str = "mock response") -> None:
        self.response_text = response_text
        self.requests: list[Sequence[LLMMessage]] = []

    def generate(
        self,
        messages: Sequence[LLMMessage],
        *,
        model: str | None = None,
        temperature: float = 0.0,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        self.requests.append(messages)
        return LLMResponse(
            text=self.response_text,
            raw={
                "model": model,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
        )


class MockEmbedder:
    """Small deterministic embedder that avoids external model downloads."""

    def __init__(self, dimension: int = 8) -> None:
        if dimension <= 0:
            raise ValueError("dimension must be positive")
        self._dimension = dimension

    @property
    def dimension(self) -> int:
        return self._dimension

    def embed_text(self, text: str) -> list[float]:
        buckets = [0.0 for _ in range(self.dimension)]
        for index, character in enumerate(text):
            buckets[index % self.dimension] += float(ord(character))
        norm = sqrt(sum(value * value for value in buckets)) or 1.0
        return [value / norm for value in buckets]

    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        return [self.embed_text(text) for text in texts]


class InMemoryVectorStore:
    """In-memory vector store for unit tests and local smoke checks."""

    def __init__(self) -> None:
        self._collections: dict[str, dict[str, VectorRecord]] = {}

    def upsert(self, collection: str, records: Sequence[VectorRecord]) -> None:
        bucket = self._collections.setdefault(collection, {})
        for record in records:
            bucket[record.id] = record

    def query(
        self,
        collection: str,
        embedding: EmbeddingVector,
        *,
        top_k: int = 5,
        filters: Mapping[str, Any] | None = None,
    ) -> list[VectorSearchResult]:
        records = self._collections.get(collection, {}).values()
        results = [
            VectorSearchResult(
                id=record.id,
                score=_cosine_similarity(embedding, record.embedding),
                metadata=record.metadata,
            )
            for record in records
            if _matches_filters(record.metadata, filters)
        ]
        return sorted(results, key=lambda result: result.score, reverse=True)[:top_k]

    def delete(self, collection: str, ids: Sequence[str]) -> None:
        bucket = self._collections.get(collection, {})
        for record_id in ids:
            bucket.pop(record_id, None)


def _matches_filters(
    metadata: Mapping[str, Any], filters: Mapping[str, Any] | None
) -> bool:
    if filters is None:
        return True
    return all(metadata.get(key) == value for key, value in filters.items())


def _cosine_similarity(left: EmbeddingVector, right: EmbeddingVector) -> float:
    if len(left) != len(right):
        raise ValueError("vectors must have the same dimension")

    dot = sum(left_value * right_value for left_value, right_value in zip(left, right))
    left_norm = sqrt(sum(value * value for value in left))
    right_norm = sqrt(sum(value * value for value in right))
    if left_norm == 0.0 or right_norm == 0.0:
        return 0.0
    return dot / (left_norm * right_norm)
