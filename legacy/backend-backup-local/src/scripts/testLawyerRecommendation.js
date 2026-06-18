/**
 * Quick smoke test for lawyer topic detection + DB lookup (no NLP required).
 * Usage: node src/scripts/testLawyerRecommendation.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const connectDB = require('../config/db');
const { detectLegalTopics, recommendLawyers } = require('../services/lawyerRecommendation');

const CASES = [
  { question: 'چوری کی سزا کیا ہے؟', expectTopic: 'criminal' },
  { question: 'طلاق کا طریقہ کار کیا ہے؟', expectTopic: 'family' },
  { question: 'کرایہ دار کے کیا حقوق ہیں؟', expectTopic: 'property' },
];

async function main() {
  await connectDB();

  let passed = 0;
  for (const { question, expectTopic } of CASES) {
    const topics = detectLegalTopics(question, []);
    const topic = topics[0] || null;
    const { lawyers, detectedTopic } = await recommendLawyers(question, []);
    const ok = topic === expectTopic && lawyers.length > 0;
    console.log(
      ok ? 'PASS' : 'FAIL',
      `| Q: ${question.slice(0, 30)}... | topic=${topic} (want ${expectTopic}) | lawyers=${lawyers.length} | names=${lawyers.map((l) => l.name).join(', ')}`,
    );
    if (ok) passed += 1;
    if (detectedTopic !== topic) {
      console.warn('  warn: detectedTopic mismatch', detectedTopic, topic);
    }
  }

  console.log(`\n${passed}/${CASES.length} cases passed`);
  process.exit(passed === CASES.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
