from ai_modules.core.interfaces import (
    Embedder,
    LLMMessage,
    LLMProvider,
    VectorRecord,
    VectorStore,
)
from ai_modules.core.providers import InMemoryVectorStore, MockEmbedder, MockLLMProvider


def test_mock_providers_satisfy_core_protocols() -> None:
    llm = MockLLMProvider(response_text="ok")
    embedder = MockEmbedder(dimension=4)
    vector_store = InMemoryVectorStore()

    assert isinstance(llm, LLMProvider)
    assert isinstance(embedder, Embedder)
    assert isinstance(vector_store, VectorStore)

    response = llm.generate([LLMMessage(role="user", content="hello")])
    assert response.text == "ok"


def test_in_memory_vector_store_returns_filtered_nearest_neighbors() -> None:
    embedder = MockEmbedder(dimension=4)
    vector_store = InMemoryVectorStore()
    query_embedding = embedder.embed_text("drainage overflow")

    vector_store.upsert(
        "complaints",
        [
            VectorRecord(
                id="matching",
                embedding=query_embedding,
                metadata={"ward_id": "42"},
            ),
            VectorRecord(
                id="other-ward",
                embedding=embedder.embed_text("road repair"),
                metadata={"ward_id": "43"},
            ),
        ],
    )

    results = vector_store.query(
        "complaints",
        query_embedding,
        top_k=1,
        filters={"ward_id": "42"},
    )

    assert [result.id for result in results] == ["matching"]
