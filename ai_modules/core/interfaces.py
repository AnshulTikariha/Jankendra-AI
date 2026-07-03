"""Provider interfaces shared by the AI engines.

The backend talks to AI engines using typed inputs and outputs. Engines then
delegate model and vector operations through these protocols so development and
production providers can be swapped by configuration instead of code changes.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable

EmbeddingVector = Sequence[float]


@dataclass(frozen=True, slots=True)
class LLMMessage:
    """A single chat-style message sent to an LLM provider."""

    role: str
    content: str


@dataclass(frozen=True, slots=True)
class LLMResponse:
    """Provider-neutral LLM response returned to an engine."""

    text: str
    raw: Mapping[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class VectorRecord:
    """A vector plus metadata stored in a named collection."""

    id: str
    embedding: EmbeddingVector
    metadata: Mapping[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class VectorSearchResult:
    """A vector search hit returned by a VectorStore provider."""

    id: str
    score: float
    metadata: Mapping[str, Any] = field(default_factory=dict)


@runtime_checkable
class LLMProvider(Protocol):
    """Protocol implemented by Gemini, Ollama, and test LLM providers."""

    def generate(
        self,
        messages: Sequence[LLMMessage],
        *,
        model: str | None = None,
        temperature: float = 0.0,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        """Generate a response for a list of messages."""


@runtime_checkable
class Embedder(Protocol):
    """Protocol implemented by sentence-transformers and test embedders."""

    @property
    def dimension(self) -> int:
        """Return the number of dimensions emitted by this embedder."""

    def embed_text(self, text: str) -> list[float]:
        """Embed one text string."""

    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        """Embed multiple text strings in request order."""


@runtime_checkable
class VectorStore(Protocol):
    """Protocol implemented by sqlite-vec, pgvector, and in-memory stores."""

    def upsert(self, collection: str, records: Sequence[VectorRecord]) -> None:
        """Insert or update vector records in a collection."""

    def query(
        self,
        collection: str,
        embedding: EmbeddingVector,
        *,
        top_k: int = 5,
        filters: Mapping[str, Any] | None = None,
    ) -> list[VectorSearchResult]:
        """Return nearest neighbors for an embedding."""

    def delete(self, collection: str, ids: Sequence[str]) -> None:
        """Delete vector records by id."""
