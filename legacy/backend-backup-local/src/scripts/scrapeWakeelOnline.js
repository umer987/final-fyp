/**
 * Scrape lawyer listings from wakeelonline.com (or seed from sample JSON).
 *
 * The site currently serves a Next.js "Legal Eagles" marketing site without a
 * public lawyer directory API. This script:
 *   1. Checks robots.txt and respects crawl delays
 *   2. Attempts to parse lawyer-like cards from known listing paths
 *   3. Falls back to backend/data/lawyers-sample.json when scraping yields nothing
 *
 * Usage:
 *   node src/scripts/scrapeWakeelOnline.js              # scrape + print JSON
 *   node src/scripts/scrapeWakeelOnline.js --seed       # upsert into MongoDB
 *   node src/scripts/scrapeWakeelOnline.js --import     # import sample JSON only
 *
 * Env: MONGODB_URI (from backend/.env)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const Lawyer = require('../models/Lawyer');

const BASE_URL = 'https://www.wakeelonline.com';
const RATE_LIMIT_MS = 2000;
const USER_AGENT = 'Voice2Law-FYP-Bot/1.0 (+https://github.com/voice2law; academic research)';

const SAMPLE_PATH = path.join(__dirname, '..', '..', 'data', 'lawyers-sample.json');

const LISTING_PATHS = ['/', '/lawyers', '/find-lawyer', '/directory', '/lawyer-directory'];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/json' },
    signal: AbortSignal.timeout(20000),
  });
  const text = await response.text();
  return { ok: response.ok, status: response.status, text, url };
}

async function checkRobotsTxt() {
  try {
    const { text } = await fetchText(`${BASE_URL}/robots.txt`);
    const disallowAll = /User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*$/im.test(text);
    if (disallowAll) {
      console.warn('[scrape] robots.txt disallows all crawlers — using sample data only.');
      return false;
    }
    console.info('[scrape] robots.txt allows limited crawling; proceeding with rate limiting.');
    return true;
  } catch (err) {
    console.warn('[scrape] Could not read robots.txt:', err.message);
    return true;
  }
}

/** Best-effort HTML parser for lawyer cards (name, city, specialty, phone). */
function parseLawyersFromHtml(html, sourceUrl) {
  const lawyers = [];

  // Pattern: structured data or card blocks with phone numbers.
  const phoneRegex = /(?:\+92|0)3\d{2}[-\s]?\d{7}/g;
  const phones = [...new Set((html.match(phoneRegex) || []).map((p) => p.replace(/\s+/g, '')))];

  // Try JSON-LD Person / LocalBusiness blocks.
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (!item.name) continue;
        const phone = (item.telephone || '').replace(/\s+/g, '');
        if (!phone) continue;
        lawyers.push({
          name: item.name.trim(),
          specialization: item.jobTitle || item.description || 'General Practice',
          city: item.address?.addressLocality || 'Pakistan',
          phone,
          email: item.email || undefined,
          verified: false,
          source: sourceUrl,
        });
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }

  // Heuristic: headings near phone numbers (common directory layout).
  if (lawyers.length === 0 && phones.length > 0) {
    for (const phone of phones.slice(0, 10)) {
      const idx = html.indexOf(phone);
      const snippet = html.slice(Math.max(0, idx - 400), idx);
      const nameMatch = snippet.match(/>([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})</);
      const cityMatch = snippet.match(/(Lahore|Karachi|Islamabad|Rawalpindi|Peshawar|Multan|Faisalabad|Quetta)/i);
      if (nameMatch) {
        lawyers.push({
          name: nameMatch[1].trim(),
          specialization: 'General Practice',
          city: cityMatch ? cityMatch[1] : 'Pakistan',
          phone,
          verified: false,
          source: sourceUrl,
        });
      }
    }
  }

  return lawyers;
}

function dedupeLawyers(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = `${row.name}|${row.phone}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function loadSampleLawyers() {
  const raw = fs.readFileSync(SAMPLE_PATH, 'utf8');
  return JSON.parse(raw);
}

async function scrapeLawyers() {
  const allowed = await checkRobotsTxt();
  if (!allowed) return loadSampleLawyers();

  const collected = [];

  for (const listingPath of LISTING_PATHS) {
    const url = `${BASE_URL}${listingPath}`;
    try {
      console.info(`[scrape] GET ${url}`);
      const { ok, status, text } = await fetchText(url);
      if (!ok) {
        console.warn(`[scrape] ${url} -> HTTP ${status}`);
        await sleep(RATE_LIMIT_MS);
        continue;
      }
      const parsed = parseLawyersFromHtml(text, url);
      console.info(`[scrape] ${url} -> ${parsed.length} candidate(s)`);
      collected.push(...parsed);
    } catch (err) {
      console.warn(`[scrape] ${url} failed:`, err.message);
    }
    await sleep(RATE_LIMIT_MS);
  }

  const unique = dedupeLawyers(collected);
  if (unique.length === 0) {
    console.warn('[scrape] No lawyers parsed from wakeelonline.com — using sample JSON.');
    return loadSampleLawyers();
  }
  return unique;
}

async function seedMongo(lawyers) {
  await connectDB();
  let inserted = 0;
  let updated = 0;

  for (const row of lawyers) {
    const payload = {
      name: row.name,
      specialization: row.specialization,
      city: row.city,
      phone: row.phone,
      email: row.email,
      verified: Boolean(row.verified),
      image: row.image,
      nameUrdu: row.nameUrdu,
      rating: row.rating,
      reviewCount: row.reviewCount,
      experience: row.experience,
      courtLocation: row.courtLocation,
      languages: row.languages,
      availability: row.availability,
      barCouncilNo: row.barCouncilNo,
    };

    const existing = await Lawyer.findOne({ phone: payload.phone });
    if (existing) {
      await Lawyer.findByIdAndUpdate(existing._id, payload, { runValidators: true });
      updated += 1;
    } else {
      await Lawyer.create(payload);
      inserted += 1;
    }
  }

  console.log(`[seed] Done: ${inserted} inserted, ${updated} updated (${lawyers.length} total).`);
  await mongoose.connection.close();
}

async function main() {
  const args = process.argv.slice(2);
  const seed = args.includes('--seed');
  const importOnly = args.includes('--import');

  let lawyers;
  if (importOnly) {
    lawyers = loadSampleLawyers();
    console.info(`[import] Loaded ${lawyers.length} lawyers from sample JSON.`);
  } else {
    lawyers = await scrapeLawyers();
  }

  const outPath = path.join(__dirname, '..', '..', 'data', 'lawyers-scraped.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(lawyers, null, 2));
  console.info(`[scrape] Wrote ${lawyers.length} records to ${outPath}`);

  if (seed) {
    await seedMongo(lawyers);
  } else {
    console.info('[scrape] Run with --seed to upsert into MongoDB lawyers collection.');
  }
}

main().catch((err) => {
  console.error('Scrape failed:', err.message);
  process.exit(1);
});
