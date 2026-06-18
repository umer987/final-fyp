import os
from typing import Optional, Callable
from .embedder import UrduEmbedder
from .vectorstore import VectorStore


class LegalRAG:
    """
    Retrieval-Augmented Generation for Pakistani legal Q&A in Urdu.
    Uses extractive approach (no local LLM).
    Optional Claude API fallback for better answer generation.
    """

    def __init__(self, vectorstore: VectorStore = None, embedder: UrduEmbedder = None):
        """
        Initialize LegalRAG pipeline.

        Args:
            vectorstore: VectorStore instance
            embedder: UrduEmbedder instance
        """
        self.embedder = embedder or UrduEmbedder()
        self.vectorstore = vectorstore or VectorStore(embedder=self.embedder)

        if not self.vectorstore.collection:
            self.vectorstore.get_or_create_collection()

        # Optional Claude API
        self.claude_api_key = os.getenv('ANTHROPIC_API_KEY')
        self.use_claude = self.claude_api_key is not None

    def retrieve(self, question: str, n_results: int = 3) -> list:
        """
        Retrieve relevant legal documents for the question.

        Args:
            question: Question in Urdu
            n_results: Number of chunks to retrieve (default: 3)

        Returns:
            List of dicts with text, page_number, score, category
        """
        results = self.vectorstore.search(question, n_results=n_results)
        return results

    def format_context(self, chunks: list) -> str:
        """
        Format retrieved chunks into readable context.

        Args:
            chunks: List of chunk dicts with 'text' key

        Returns:
            Formatted context string with legal information header
        """
        if not chunks:
            return "کوئی متعلقہ معلومات دستیاب نہیں ہے۔"

        header = "قانونی معلومات:\n\n"
        formatted_chunks = []

        for i, chunk in enumerate(chunks, 1):
            chunk_text = chunk if isinstance(chunk, str) else chunk.get('text', '')
            formatted_chunks.append(chunk_text)

        context = "\n---\n".join(formatted_chunks)
        return header + context

    def answer_extractive(self, question: str, n_results: int = 3) -> dict:
        """
        Answer question using extractive approach (no LLM).
        Returns the most relevant chunk directly.

        Args:
            question: Question in Urdu
            n_results: Number of chunks to retrieve

        Returns:
            Dict with answer, source_pages, confidence, category
        """
        # Retrieve relevant chunks
        results = self.retrieve(question, n_results=n_results)

        if not results:
            return {
                'answer': 'معافی چاہتا ہوں، اس سوال کے بارے میں معلومات دستیاب نہیں ہے۔',
                'source_pages': [],
                'confidence': 0.0,
                'category': 'unknown',
                'approach': 'extractive',
                'method': 'no_results'
            }

        # Get top result
        top_result = results[0]

        # Collect source pages from all results
        source_pages = [r['page_number'] for r in results if r.get('page_number')]

        return {
            'answer': top_result['text'],
            'source_pages': source_pages,
            'confidence': float(top_result['score']),
            'category': top_result.get('category', 'unknown'),
            'approach': 'extractive',
            'method': 'top_chunk',
            'retrieved_chunks': len(results)
        }

    def answer_with_claude(self, question: str, context: str) -> dict:
        """
        Generate answer using Anthropic Claude API (optional fallback).
        Requires ANTHROPIC_API_KEY environment variable.

        Args:
            question: Question in Urdu
            context: Retrieved context from vectorstore

        Returns:
            Dict with answer, source, confidence
        """
        if not self.claude_api_key:
            raise ValueError("ANTHROPIC_API_KEY not set")

        try:
            from anthropic import Anthropic
        except ImportError:
            raise ImportError("Install anthropic: pip install anthropic")

        client = Anthropic()

        system_prompt = """آپ ایک پاکستانی قانونی مشیر ہیں۔ صرف اردو میں جواب دیں۔
صرف دی گئی معلومات کا استعمال کریں۔
اگر دی گئی معلومات میں جواب نہ ملے تو کہیں: "معافی چاہتا ہوں، اس بارے میں معلومات دستیاب نہیں ہے۔"
ہمیشہ اہم قانونی نکات واضح اور سادہ اردو میں بیان کریں۔"""

        user_message = f"""سوال: {question}

دستاویزات سے معلومات:
{context}

براہ کرم صرف دی گئی معلومات کی بنیاد پر جواب دیں۔"""

        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_message}
            ]
        )

        answer_text = response.content[0].text

        return {
            'answer': answer_text,
            'approach': 'claude_api',
            'model': 'claude-3-5-sonnet-20241022',
            'tokens_used': response.usage.input_tokens + response.usage.output_tokens
        }

    def answer(self, question: str, use_llm: bool = False, n_results: int = 3) -> dict:
        """
        Answer a legal question in Urdu using RAG.

        Args:
            question: Question in Urdu
            use_llm: Use Claude API if available (default: False, use extractive)
            n_results: Number of chunks to retrieve

        Returns:
            Dict with answer, source_pages, confidence, category, approach
        """
        # Retrieve chunks
        results = self.retrieve(question, n_results=n_results)

        if not results:
            return {
                'question': question,
                'answer': 'معافی چاہتا ہوں، اس سوال کے بارے میں معلومات دستیاب نہیں ہے۔',
                'source_pages': [],
                'confidence': 0.0,
                'category': 'unknown',
                'approach': 'extractive',
                'retrieved_chunks': 0
            }

        # Format context from retrieved chunks
        context = self.format_context([r['text'] for r in results])

        # Use extractive approach by default
        if not use_llm or not self.use_claude:
            result = self.answer_extractive(question, n_results)
            result['question'] = question
            result['context_used'] = context
            return result

        # Use Claude API if requested and available
        try:
            result = self.answer_with_claude(question, context)
            result['question'] = question
            result['source_pages'] = [r['page_number'] for r in results if r.get('page_number')]
            result['confidence'] = results[0]['score'] if results else 0.0
            result['category'] = results[0].get('category', 'unknown') if results else 'unknown'
            return result
        except Exception as e:
            print(f"Claude API error: {e}. Falling back to extractive.")
            result = self.answer_extractive(question, n_results)
            result['question'] = question
            result['error'] = str(e)
            result['fallback'] = 'extractive'
            return result


# Backward compatibility: keep RAGPipeline as alias
class RAGPipeline(LegalRAG):
    """Backward compatibility alias for LegalRAG."""
    pass


