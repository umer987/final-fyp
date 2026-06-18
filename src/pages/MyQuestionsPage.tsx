import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Loader, ArrowRight } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { api, QueryRecord } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function MyQuestionsPage() {
  const { user } = useAuth();
  const [queries, setQueries] = useState<QueryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getMyQueries()
      .then(({ queries: data }) => setQueries(data))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to load your questions';
        toast.error(message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="pt-28 pb-16 px-4 sm:px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl text-[#0B3D2E] mb-2">My Questions</h1>
          <p className="text-[#0B3D2E]/70">
            Signed in as <strong>{user?.email}</strong>. Your saved legal questions appear below.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[#0B3D2E]/60 gap-3">
            <Loader className="w-6 h-6 animate-spin" />
            <span>Loading your questions…</span>
          </div>
        ) : queries.length === 0 ? (
          <div className="bg-[#F8F9FA] border border-[#0B3D2E]/10 rounded-2xl p-10 text-center">
            <MessageSquare className="w-12 h-12 text-[#1FAA59] mx-auto mb-4" />
            <h2 className="text-xl text-[#0B3D2E] mb-2">No questions yet</h2>
            <p className="text-[#0B3D2E]/70 mb-6">
              Ask a legal question on the Ask or Voice page while signed in to see it here.
            </p>
            <Link
              to="/ask"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-lg transition-all"
            >
              Ask a Question
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {queries.map((query) => (
              <article
                key={query.id}
                className="bg-white border border-[#0B3D2E]/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-xs uppercase tracking-wide text-[#1FAA59] font-medium">
                    {query.category}
                  </span>
                  <span className="text-xs text-[#0B3D2E]/50">
                    {new Date(query.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-[#0B3D2E] font-medium mb-2">{query.question}</p>
                <p className="text-[#0B3D2E]/80 text-sm line-clamp-4">{query.aiResponse}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
