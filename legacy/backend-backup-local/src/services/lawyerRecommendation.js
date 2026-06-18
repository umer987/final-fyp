/**
 * Detect legal topics from a user question (+ optional NLP RAG sources) and
 * recommend matching lawyers from MongoDB.
 */
const Lawyer = require('../models/Lawyer');
const { buildWhatsAppLink } = require('../controllers/lawyerController');

/** Urdu / English keyword -> topic key (mirrors nlp-service retrieval.py). */
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

/** Topic key -> regex fragment for Lawyer.specialization. */
const TOPIC_SPECIALIZATION = {
  criminal: 'Criminal',
  penal: 'Criminal',
  family: 'Family',
  property: 'Property',
  rent: 'Property',
  corporate: 'Corporate',
};

const DEFAULT_LIMIT = 3;

function buildWhatsAppForLawyer(lawyer) {
  return buildWhatsAppLink(
    lawyer.phone,
    `السلام علیکم ${lawyer.name}, I found your profile on Voice2Law and would like a legal consultation.`,
  );
}

function toPublicLawyer(doc) {
  const lawyer = doc.toObject ? doc.toObject() : doc;
  return {
    _id: lawyer._id,
    name: lawyer.name,
    nameUrdu: lawyer.nameUrdu || '',
    specialization: lawyer.specialization,
    city: lawyer.city,
    phone: lawyer.phone,
    whatsappLink: buildWhatsAppForLawyer(lawyer),
    image: lawyer.image || '',
    rating: lawyer.rating ?? 0,
    verified: Boolean(lawyer.verified),
    courtLocation: lawyer.courtLocation || '',
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
    if (TOPIC_SPECIALIZATION[topic]) {
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

function topicToSpecialization(topic) {
  return TOPIC_SPECIALIZATION[topic] || null;
}

/**
 * @param {object} filter
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
async function findLawyers(filter, limit) {
  return Lawyer.find(filter)
    .sort({ rating: -1, reviewCount: -1, createdAt: -1 })
    .limit(limit);
}

/**
 * @param {string} question
 * @param {Array} sources
 * @param {{ limit?: number }} options
 * @returns {Promise<{ lawyers: object[], detectedTopic: string | null }>}
 */
async function recommendLawyers(question, sources = [], options = {}) {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const topics = detectLegalTopics(question, sources);

  if (topics.length === 0) {
    return { lawyers: [], detectedTopic: null };
  }

  const collected = [];
  const seen = new Set();

  const addDocs = (docs) => {
    for (const doc of docs) {
      const id = String(doc._id);
      if (seen.has(id)) continue;
      seen.add(id);
      collected.push(doc);
      if (collected.length >= limit) break;
    }
  };

  for (const topic of topics) {
    if (collected.length >= limit) break;
    const spec = topicToSpecialization(topic);
    if (!spec) continue;

    const remaining = limit - collected.length;
    const verified = await findLawyers(
      { specialization: new RegExp(spec, 'i'), verified: true },
      remaining,
    );
    addDocs(verified);

    if (collected.length < limit) {
      const unverified = await findLawyers(
        { specialization: new RegExp(spec, 'i'), verified: false },
        limit - collected.length,
      );
      addDocs(unverified);
    }
  }

  // Last resort: top-rated verified lawyers if topic-specific search found nothing.
  if (collected.length === 0) {
    const fallback = await findLawyers({ verified: true }, limit);
    addDocs(fallback);
  }

  return {
    lawyers: collected.slice(0, limit).map(toPublicLawyer),
    detectedTopic: topics[0] || null,
  };
}

module.exports = {
  detectLegalTopics,
  topicToSpecialization,
  recommendLawyers,
};
