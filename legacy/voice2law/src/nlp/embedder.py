from sentence_transformers import SentenceTransformer
import numpy as np


class UrduEmbedder:
    """
    Create embeddings using multilingual sentence transformer.
    Supports Urdu, English, and other languages.
    """

    MODEL_NAME = 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2'

    def __init__(self, model_name: str = None):
        """
        Initialize embedder with multilingual model.

        Args:
            model_name: HuggingFace model name (default: multilingual-mpnet-base-v2)
        """
        self.model_name = model_name or self.MODEL_NAME
        print(f"Loading embedder model: {self.model_name}")
        self.model = SentenceTransformer(self.model_name)
        print(f"Model loaded. Embedding dimension: {self.get_embedding_dim()}")

    def embed_text(self, text: str) -> list:
        """
        Embed a single text string.

        Args:
            text: Text to embed (Urdu, English, or mixed)

        Returns:
            List of floats representing the embedding vector
        """
        if not text or not text.strip():
            return np.zeros(self.get_embedding_dim()).tolist()

        embedding = self.model.encode(text, convert_to_tensor=False)
        return embedding.tolist()

    def embed_batch(self, texts: list) -> list:
        """
        Embed a batch of texts efficiently.

        Args:
            texts: List of texts to embed

        Returns:
            List of embedding vectors (each is list of floats)
        """
        if not texts:
            return []

        # Filter empty texts
        texts_filtered = [t for t in texts if t and t.strip()]
        if not texts_filtered:
            return [np.zeros(self.get_embedding_dim()).tolist() for _ in texts]

        embeddings = self.model.encode(texts_filtered, convert_to_tensor=False)
        return embeddings.tolist()

    def get_embedding_dim(self) -> int:
        """Get the dimension of embeddings produced by this model."""
        return self.model.get_sentence_embedding_dimension()

    def similarity(self, text1: str, text2: str) -> float:
        """
        Compute cosine similarity between two texts.

        Args:
            text1: First text
            text2: Second text

        Returns:
            Similarity score between 0 and 1
        """
        emb1 = np.array(self.embed_text(text1))
        emb2 = np.array(self.embed_text(text2))

        # Cosine similarity
        sim = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
        return float(sim)

