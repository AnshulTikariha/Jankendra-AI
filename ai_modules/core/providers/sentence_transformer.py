"""sentence-transformers embedder adapter stub."""

from __future__ import annotations

from collections.abc import Sequence


class SentenceTransformerEmbedder:
    """Embedder placeholder for sentence-transformers/all-MiniLM-L6-v2."""

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2") -> None:
        self.model_name = model_name

    @property
    def dimension(self) -> int:
        return 384

    def embed_text(self, text: str) -> list[float]:
        raise NotImplementedError("sentence-transformers implementation is pending")

    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        raise NotImplementedError("sentence-transformers implementation is pending")
