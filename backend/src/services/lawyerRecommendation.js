/**
 * Detect legal topics from a user question (+ optional NLP RAG sources) and
 * recommend matching lawyers from Firestore or demo seed data.
 */

/** Urdu / English keyword -> topic key (mirrors legacy + nlp-service retrieval.py). */
const KEYWORD_TOPICS = [
  { pattern: /چوری|ڈکیتی|قتل|زیادتی|فراڈ|سزا|جرم|ضمانت|فوجداری|تفتیش|گرفتاری/i, topic: 'criminal' },
  { pattern: /\b(theft|steal|stolen|larceny|murder|homicide|bail|robbery|dacoity|fraud|criminal)\b/i, topic: 'criminal' },
  { pattern: /طلاق|خلع|مہر|گھرانہ|ازدواجی|وراثت|نکاح|شادی|عقد/i, topic: 'family' },
  { pattern: /\b(family\s*law|marriage|divorce|dower|khula|nikah|mahr|matrimonial|inheritance)\b/i, topic: 'family' },
  { pattern: /جائیداد|کرایہ/i, topic: 'property' },
  { pattern: /\b(rent|tenancy|landlord|property|land|acquisition)\b/i, topic: 'property' },
  { pattern: /\b(corporate|business|contract|taxation|company)\b/i, topic: 'corporate' },
];

/** RAG index folder names -> topic key. */
const CATEGORY_TOPICS = {
  penal: 'criminal',
  criminal: 'criminal',
  family: 'family',
  property: 'property',
  rent: 'property',
  corporate: 'corporate',
};

/** Topic key -> regex for lawyer expertise areas. */
const TOPIC_EXPERTISE = {
  criminal: /criminal|bail|fir|cyber\s*law/i,
  family: /family|divorce|inheritance|women\s*rights|custody|marriage/i,
  property: /property|rent|land|real\s*estate/i,
  corporate: /corporate|business|contract|taxation/i,
};

const DEFAULT_LIMIT = 3;

function buildWhatsAppLink(phone, message) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const text = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${text}`;
}

const DEFAULT_LAWYER_IMAGE =
  'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop';

function toPublicLawyer(lawyer) {
  const phone = lawyer.phoneNumber || lawyer.phone || '';
  const whatsapp = lawyer.whatsapp || phone.replace(/^0/, '92');
  const expertise = Array.isArray(lawyer.expertise)
    ? lawyer.expertise
    : String(lawyer.specialization || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  return {
    id: String(lawyer.id || lawyer._id || ''),
    name: lawyer.name,
    nameUrdu: lawyer.nameUrdu || '',
    city: lawyer.city || '',
    phoneNumber: phone,
    image: lawyer.image || DEFAULT_LAWYER_IMAGE,
    rating: lawyer.rating ?? 0,
    verified: Boolean(lawyer.verified),
    courtLocation: lawyer.courtLocation || '',
    expertise,
    whatsappLink: buildWhatsAppLink(
      whatsapp,
      `السلام علیکم ${lawyer.name}, I found your profile on Voice2Law and would like a legal consultation.`,
    ),
  };
}

/**
 * @param {string} question
 * @param {Array<{ metadata?: { category?: string } }>} sources
 * @returns {string[]} Ordered topic keys (most relevant first).
 */
function detectLegalTopics(question, sources = []) {
  const scores = new Map();
  const text = (question || '').trim();

  for (const { pattern, topic } of KEYWORD_TOPICS) {
    if (pattern.test(text)) {
      scores.set(topic, (scores.get(topic) || 0) + 2);
    }
  }

  for (const source of sources) {
    const raw = source?.metadata?.category;
    if (!raw) continue;
    const key = String(raw).toLowerCase();
    const topic = CATEGORY_TOPICS[key] || key;
    if (TOPIC_EXPERTISE[topic]) {
      scores.set(topic, (scores.get(topic) || 0) + 3);
    }
  }

  if (scores.size === 0) {
    return [];
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);
}

function lawyerMatchesTopic(lawyer, topic) {
  const pattern = TOPIC_EXPERTISE[topic];
  if (!pattern) return false;
  const areas = Array.isArray(lawyer.expertise)
    ? lawyer.expertise
    : String(lawyer.specialization || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  return areas.some((area) => pattern.test(area));
}

function sortLawyers(a, b) {
  const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0);
  if (ratingDiff !== 0) return ratingDiff;
  const reviewDiff = Number(b.reviewCount || 0) - Number(a.reviewCount || 0);
  if (reviewDiff !== 0) return reviewDiff;
  return String(a.name || '').localeCompare(String(b.name || ''));
}

/**
 * @param {string} question
 * @param {Array} sources
 * @param {() => Promise<object[]>} loadLawyers
 * @param {{ limit?: number }} options
 * @returns {Promise<{ lawyers: object[], detectedTopic: string | null }>}
 */
async function recommendLawyers(question, sources = [], loadLawyers, options = {}) {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const topics = detectLegalTopics(question, sources);

  if (topics.length === 0) {
    return { lawyers: [], detectedTopic: null };
  }

  const pool = await loadLawyers();
  const collected = [];
  const seen = new Set();

  const addLawyers = (candidates) => {
    for (const lawyer of candidates) {
      const id = String(lawyer.id || lawyer._id || lawyer.name);
      if (seen.has(id)) continue;
      seen.add(id);
      collected.push(lawyer);
      if (collected.length >= limit) break;
    }
  };

  for (const topic of topics) {
    if (collected.length >= limit) break;

    const matching = pool.filter((lawyer) => lawyerMatchesTopic(lawyer, topic));
    const verified = matching.filter((lawyer) => lawyer.verified).sort(sortLawyers);
    addLawyers(verified);

    if (collected.length < limit) {
      const unverified = matching.filter((lawyer) => !lawyer.verified).sort(sortLawyers);
      addLawyers(unverified);
    }
  }

  if (collected.length === 0) {
    const fallback = pool.filter((lawyer) => lawyer.verified).sort(sortLawyers);
    addLawyers(fallback.slice(0, limit));
  }

  return {
    lawyers: collected.slice(0, limit).map(toPublicLawyer),
    detectedTopic: topics[0] || null,
  };
}

module.exports = {
  detectLegalTopics,
  recommendLawyers,
  toPublicLawyer,
};
