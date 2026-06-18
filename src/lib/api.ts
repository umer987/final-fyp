import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { DEMO_LAWYERS, filterDemoLawyers } from '../data/lawyersDemo';
import { getAuthToken } from './authToken';
import { requireFirebase } from './firebase';

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name: string;
  displayName?: string;
  picture?: string | null;
  photoURL?: string | null;
}

export interface Lawyer {
  id: string;
  name: string;
  nameUrdu: string;
  expertise: string[];
  courtLocation: string;
  city: string;
  rating: number;
  reviewCount: number;
  experience: number;
  languages: string[];
  phoneNumber: string;
  whatsapp: string;
  email?: string;
  image: string;
  verified: boolean;
  availability: string;
  barCouncilNo?: string;
}

export interface QueryRecord {
  id: string;
  userName: string;
  userEmail: string;
  queryType: 'voice' | 'text';
  category: string;
  question: string;
  questionUrdu?: string;
  aiResponse: string;
  aiResponseUrdu?: string;
  rating: number;
  feedback?: string;
  status: 'pending' | 'resolved' | 'flagged';
  timestamp: string;
  confidence: number;
}

export interface LegalEntry {
  id: string;
  category: string;
  section: string;
  urduSummary: string;
  englishSummary: string;
  status: 'approved' | 'pending' | 'review';
  lastUpdated: string;
}

export interface UrduDocument {
  id: string;
  title: string;
  titleUrdu: string;
  category: string;
  description: string;
  descriptionUrdu: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  status: 'published' | 'draft' | 'pending';
  content?: string;
  fileUrl?: string;
  storagePath?: string;
}

export interface SystemSettingsData {
  siteName: string;
  siteNameUrdu: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  backupFrequency: string;
  adminEmail: string;
  supportEmail: string;
  aiConfidenceThreshold: number;
  urduAccuracyThreshold: number;
}

export interface AiSource {
  text: string;
  metadata?: Record<string, unknown>;
}

export interface TextAiResponse {
  id: string | null;
  answer: string;
  answerUrdu?: string;
  category: string;
  confidence: number;
  status: 'pending' | 'resolved' | 'flagged';
  sources?: AiSource[];
  recommendedLawyers?: RecommendedLawyer[];
  detectedTopic?: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function authHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(await authHeaders()),
        ...(init.headers || {}),
      },
    });
  } catch {
    throw new Error(
      `Cannot reach the API at ${API_BASE}. Start the backend (port 5000) and ensure CORS allows your frontend origin.`,
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }
  return data as T;
}

export interface RecommendedLawyer {
  id: string;
  name: string;
  nameUrdu?: string;
  city: string;
  phoneNumber: string;
  image?: string;
  rating?: number;
  verified: boolean;
  courtLocation?: string;
  /** Comma-separated expertise areas (legacy MongoDB shape). */
  specialization?: string;
  expertise?: string[];
  whatsappLink?: string;
}

export const api = {
  authMe: () => apiFetch<{ user: UserProfile }>('/auth/me'),
  loginWithGoogle: (credential: string) =>
    apiFetch<{ token: string; user: UserProfile }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),
  recordFailedLogin: (email: string) =>
    apiFetch<{ lockedUntil?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, result: 'failed' }),
    }),
  logout: () => apiFetch<{ ok: true }>('/auth/logout', { method: 'POST' }),
  getMyQueries: () => apiFetch<{ queries: QueryRecord[] }>('/queries/mine'),

  getLawyers: async (filters?: { city?: string; expertise?: string; availability?: string; minRating?: number }) => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== 'all') params.set(key, String(value));
    });
    try {
      const result = await apiFetch<{ lawyers: Lawyer[] }>(
        `/lawyers${params.toString() ? `?${params}` : ''}`,
      );
      if (result.lawyers?.length) return result;
    } catch {
      // Fall through to demo lawyers when the API is unreachable.
    }
    return { lawyers: filterDemoLawyers(DEMO_LAWYERS, filters) };
  },
  createLawyer: (lawyer: Omit<Lawyer, 'id'>) =>
    apiFetch<{ lawyer: Lawyer }>('/lawyers', { method: 'POST', body: JSON.stringify(lawyer) }),
  updateLawyer: (id: string, lawyer: Partial<Lawyer>) =>
    apiFetch<{ lawyer: Lawyer }>(`/lawyers/${id}`, { method: 'PUT', body: JSON.stringify(lawyer) }),
  deleteLawyer: (id: string) => apiFetch<{ ok: true }>(`/lawyers/${id}`, { method: 'DELETE' }),

  getQueries: () => apiFetch<{ queries: QueryRecord[] }>('/queries'),
  updateQuery: (id: string, query: Partial<QueryRecord>) =>
    apiFetch<{ query: QueryRecord }>(`/queries/${id}`, { method: 'PUT', body: JSON.stringify(query) }),
  deleteQuery: (id: string) => apiFetch<{ ok: true }>(`/queries/${id}`, { method: 'DELETE' }),

  getKnowledgeBase: () => apiFetch<{ entries: LegalEntry[] }>('/knowledge-base'),
  createKnowledgeEntry: (entry: Omit<LegalEntry, 'id'>) =>
    apiFetch<{ entry: LegalEntry }>('/knowledge-base', { method: 'POST', body: JSON.stringify(entry) }),
  updateKnowledgeEntry: (id: string, entry: Partial<LegalEntry>) =>
    apiFetch<{ entry: LegalEntry }>(`/knowledge-base/${id}`, { method: 'PUT', body: JSON.stringify(entry) }),
  deleteKnowledgeEntry: (id: string) => apiFetch<{ ok: true }>(`/knowledge-base/${id}`, { method: 'DELETE' }),

  getUrduDocuments: (publicOnly = false) =>
    apiFetch<{ documents: UrduDocument[] }>(publicOnly ? '/legal-topics' : '/urdu-documents'),
  createUrduDocument: (document: Omit<UrduDocument, 'id'>) =>
    apiFetch<{ document: UrduDocument }>('/urdu-documents', { method: 'POST', body: JSON.stringify(document) }),
  updateUrduDocument: (id: string, document: Partial<UrduDocument>) =>
    apiFetch<{ document: UrduDocument }>(`/urdu-documents/${id}`, { method: 'PUT', body: JSON.stringify(document) }),
  deleteUrduDocument: (id: string) => apiFetch<{ ok: true }>(`/urdu-documents/${id}`, { method: 'DELETE' }),

  getSystemSettings: () => apiFetch<{ settings: SystemSettingsData }>('/system-settings'),
  updateSystemSettings: (settings: SystemSettingsData) =>
    apiFetch<{ settings: SystemSettingsData }>('/system-settings', { method: 'PUT', body: JSON.stringify(settings) }),

  submitContact: (payload: { name: string; email: string; phone?: string; subject: string; message: string }) =>
    apiFetch<{ id: string }>('/contact', { method: 'POST', body: JSON.stringify(payload) }),

  askText: (payload: { question: string; userName?: string; userEmail?: string }) =>
    apiFetch<TextAiResponse>('/ai/text-query', { method: 'POST', body: JSON.stringify(payload) }),
  askVoice: (payload: { audioData?: string; transcript?: string; userName?: string; userEmail?: string }) =>
    apiFetch<TextAiResponse & { transcript: string }>('/ai/voice-query', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** ElevenLabs/HF TTS via backend proxy to nlp-service /tts. Returns audio blob. */
  tts: async (payload: { text: string; language?: 'urdu' | 'english' }): Promise<Blob> => {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/tts`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error(
        `Cannot reach the TTS API at ${API_BASE}/tts. Start the backend (port 5000) and nlp-service (port 8001).`,
      );
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (!response.ok) {
      const data = contentType.includes('application/json')
        ? await response.json().catch(() => ({}))
        : {};
      throw new Error(
        (data as { message?: string }).message ||
          `Text-to-speech failed with status ${response.status}`,
      );
    }

    if (contentType.includes('application/json')) {
      const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      throw new Error(data.message || data.error || 'Text-to-speech is unavailable.');
    }

    const blob = await response.blob();
    if (!blob.size) {
      throw new Error('Text-to-speech returned empty audio.');
    }
    return blob;
  },

  getDashboard: () =>
    apiFetch<{ metrics: Record<string, number>; recentActivities: unknown[] }>('/admin/dashboard'),

  health: () =>
    apiFetch<{
      status: string;
      service: string;
      time: string;
      nlpServiceUrl?: string;
      nlpReady?: boolean;
      ragReady?: boolean;
      indexedChunks?: number;
      llmProvider?: string;
      firebaseConfigured?: boolean;
      googleAuthConfigured?: boolean;
      openAiConfigured?: boolean;
    }>('/health'),
};

export async function uploadUrduDocumentFile(file: File, documentId: string) {
  const { storage } = requireFirebase();
  const storagePath = `urdu-documents/${documentId}/${file.name}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const fileUrl = await getDownloadURL(storageRef);
  return { fileUrl, storagePath, fileName: file.name, fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB` };
}
