from ai_modules.commitment_engine import CommitmentExtractor, WeightEscalator
from ai_modules.core.providers import (
    GeminiLLMProvider,
    OllamaLLMProvider,
    PgVectorStore,
    SQLiteVecStore,
    SentenceTransformerEmbedder,
)
from ai_modules.digest import DigestSQLAggregator
from ai_modules.ingestion import TranscriptParser
from ai_modules.issue_engine import ComplaintClusterer
from ai_modules.prioritization import PriorityScorer
from ai_modules.rag import RAGRetriever


def test_architecture_scaffold_imports() -> None:
    assert TranscriptParser is not None
    assert ComplaintClusterer is not None
    assert CommitmentExtractor is not None
    assert WeightEscalator is not None
    assert PriorityScorer is not None
    assert RAGRetriever is not None
    assert DigestSQLAggregator is not None


def test_provider_adapter_stubs_import() -> None:
    assert GeminiLLMProvider(api_key="test").api_key == "test"
    assert OllamaLLMProvider(base_url="http://example.test").base_url == "http://example.test"
    assert SentenceTransformerEmbedder().dimension == 384
    assert SQLiteVecStore(database_url="sqlite:///test.db").database_url == "sqlite:///test.db"
    assert PgVectorStore(database_url="postgresql://example").database_url == "postgresql://example"
