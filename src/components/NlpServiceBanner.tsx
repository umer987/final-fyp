import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

type ServiceStatus = 'unknown' | 'ready' | 'unavailable';

/** Non-blocking API status — page renders immediately; banner updates when check finishes. */
export function NlpServiceBanner() {
  const [status, setStatus] = useState<ServiceStatus>('unknown');
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .health()
      .then((data) => {
        if (cancelled) return;
        if (data.status === 'ok' && (data.ragReady || data.nlpReady)) {
          setStatus('ready');
          const chunks = data.indexedChunks ? ` (${data.indexedChunks.toLocaleString()} indexed passages)` : '';
          setDetail(`RAG legal assistant is online${chunks}`);
        } else if (data.status === 'ok' && data.openAiConfigured) {
          setStatus('ready');
          setDetail('Legal assistant is online (OpenAI fallback)');
        } else if (data.status === 'ok') {
          setStatus('unavailable');
          setDetail('Backend is running but the RAG service (nlp-service on 8001) is not reachable.');
        } else {
          setStatus('unavailable');
          setDetail('Backend health check returned an unexpected status.');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('unavailable');
        setDetail('Cannot reach the backend API on port 5000. Start the backend, then refresh.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'unknown') {
    return null;
  }

  if (status === 'ready') {
    return (
      <div className="max-w-5xl mx-auto mb-8 flex items-start gap-3 px-4 py-3 rounded-xl bg-[#1FAA59]/10 border border-[#1FAA59]/30 text-[#0B3D2E]">
        <CheckCircle2 className="w-5 h-5 text-[#1FAA59] flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Legal assistant ready</p>
          {detail && <p className="text-[#0B3D2E]/70 mt-0.5">{detail}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mb-8 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950">
      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-medium urdu-text">قانونی جواب کی سروس ابھی دستیاب نہیں</p>
        <p className="mt-1">Legal answer service is not available.</p>
        {detail && <p className="text-amber-900/80 mt-1">{detail}</p>}
      </div>
    </div>
  );
}
