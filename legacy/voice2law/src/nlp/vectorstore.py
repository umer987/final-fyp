import chromadb
from pathlib import Path
import json
from tqdm import tqdm
from .embedder import UrduEmbedder


class VectorStore:
    """
    Manage ChromaDB for storing and querying legal document embeddings.
    Persistent storage at data/vectorstore/
    """

    def __init__(self, persist_dir: str = 'data/vectorstore', embedder: UrduEmbedder = None):
        """
        Initialize vector store with ChromaDB.

        Args:
            persist_dir: Directory for persistent storage
            embedder: UrduEmbedder instance (creates if not provided)
        """
        self.persist_dir = Path(persist_dir)
        self.persist_dir.mkdir(parents=True, exist_ok=True)

        self.embedder = embedder or UrduEmbedder()

        print(f"Initializing ChromaDB at: {self.persist_dir}")
        self.client = chromadb.PersistentClient(path=str(self.persist_dir))

        self.collection = None
        self.collection_name = "criminal_law_chunks"

    def get_or_create_collection(self) -> chromadb.Collection:
        """
        Get or create the collection for storing chunks.

        Returns:
            ChromaDB collection object
        """
        try:
            self.collection = self.client.get_collection(name=self.collection_name)
            print(f"✓ Loaded existing collection: {self.collection_name}")
            print(f"  Documents in collection: {self.collection.count()}")
        except:
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            print(f"✓ Created new collection: {self.collection_name}")

        return self.collection

    def ingest_chunks(self, chunks_json_path: str) -> dict:
        """
        Ingest chunks from JSON file into vector store.
        - Loads chunks from criminal_law_chunks.json
        - Creates embeddings for each chunk
        - Stores in ChromaDB with metadata
        - Shows progress bar

        Args:
            chunks_json_path: Path to chunks JSON file from Step 1

        Returns:
            Dict with ingestion statistics
        """
        chunks_file = Path(chunks_json_path)
        if not chunks_file.exists():
            raise FileNotFoundError(f"Chunks file not found: {chunks_json_path}")

        print(f"Loading chunks from: {chunks_json_path}")
        with open(chunks_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        chunks = data.get('chunks', [])
        print(f"Found {len(chunks)} chunks to ingest")

        if not chunks:
            return {"status": "error", "message": "No chunks found in file"}

        # Ensure collection exists
        if not self.collection:
            self.get_or_create_collection()

        # Extract texts and metadata
        chunk_texts = [chunk['text'] for chunk in chunks]
        chunk_ids = [f"chunk_{chunk['metadata']['global_chunk_index']}" for chunk in chunks]
        chunk_metadatas = [chunk['metadata'] for chunk in chunks]

        # Create embeddings with progress bar
        print("Creating embeddings...")
        embeddings = []
        for i in tqdm(range(0, len(chunk_texts), 32), desc="Embedding chunks", total=(len(chunk_texts) + 31) // 32):
            batch = chunk_texts[i:i+32]
            batch_embeddings = self.embedder.embed_batch(batch)
            embeddings.extend(batch_embeddings)

        # Add to collection
        print("Adding to ChromaDB...")
        self.collection.add(
            ids=chunk_ids,
            embeddings=embeddings,
            documents=chunk_texts,
            metadatas=chunk_metadatas
        )

        stats = {
            "status": "success",
            "total_chunks": len(chunks),
            "total_ingested": self.collection.count(),
            "embedding_dim": self.embedder.get_embedding_dim(),
            "source_file": data.get('source_file', 'unknown'),
            "pages_extracted": data.get('pages_extracted', 0)
        }

        print(f"\n✓ Ingestion complete!")
        print(f"  Total chunks: {stats['total_chunks']}")
        print(f"  Ingested: {stats['total_ingested']}")
        print(f"  Embedding dimension: {stats['embedding_dim']}")

        return stats

    def search(self, query: str, n_results: int = 3) -> list:
        """
        Search for similar chunks using a query.

        Args:
            query: Query text (Urdu, English, or mixed)
            n_results: Number of results to return

        Returns:
            List of dicts with keys: text, page_number, chunk_index, score, category
        """
        if not self.collection:
            raise ValueError("Collection not initialized. Call get_or_create_collection() first.")

        # Embed query
        query_embedding = self.embedder.embed_text(query)

        # Search ChromaDB
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )

        # Format results
        formatted_results = []
        if results['documents'] and len(results['documents']) > 0:
            for i, doc_text in enumerate(results['documents'][0]):
                # Distance to similarity: 1 - distance (for cosine)
                distance = results['distances'][0][i] if results['distances'] else 0
                similarity = 1 - distance

                metadata = results['metadatas'][0][i] if results['metadatas'] else {}

                formatted_results.append({
                    'text': doc_text,
                    'page_number': metadata.get('page_number'),
                    'chunk_index': metadata.get('chunk_index'),
                    'global_chunk_index': metadata.get('global_chunk_index'),
                    'category': metadata.get('category'),
                    'score': float(similarity),
                    'source': metadata.get('source_file', 'unknown')
                })

        return formatted_results

    def get_stats(self) -> dict:
        """Get statistics about the vector store."""
        if not self.collection:
            return {"status": "not_initialized"}

        return {
            "collection_name": self.collection_name,
            "total_documents": self.collection.count(),
            "embedding_dim": self.embedder.get_embedding_dim(),
            "persist_path": str(self.persist_dir),
            "model": self.embedder.model_name
        }

    def reset_collection(self):
        """Delete and recreate the collection."""
        if self.collection:
            self.client.delete_collection(name=self.collection_name)
            self.collection = None
        self.get_or_create_collection()
        print(f"✓ Collection reset")

