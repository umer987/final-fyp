const admin = require('firebase-admin');
const express = require('express');
const nlp = require('./services/nlp');
const { recommendLawyers } = require('./services/lawyerRecommendation');
const sessionAuth = require('./services/sessionAuth');

/**
 * @param {object} [options]
 * @param {boolean} [options.firebaseEnabled] Whether real Firebase credentials were supplied.
 *   When false, Firestore-backed routes degrade gracefully (empty list / clean 503) instead
 *   of crashing the process, while the RAG answer routes keep working.
 */
module.exports = function createApiApp(options = {}) {
  const firebaseEnabled = options.firebaseEnabled !== false;
  const app = express();

  // Wrap every route handler so async rejections are forwarded to the Express error
  // handler (in server.js) as clean JSON instead of crashing the process via an
  // unhandledRejection. Express 4 does not await async handlers on its own.
  const asyncHandler = (fn) =>
    typeof fn === 'function'
      ? (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
      : fn;
  ['get', 'post', 'put', 'delete', 'patch'].forEach((method) => {
    const original = app[method].bind(app);
    app[method] = (path, ...handlers) => original(path, ...handlers.map(asyncHandler));
  });

  // Lazy Firestore accessor — throws a clean 503 when Firebase is not configured so
  // a missing/invalid service account NEVER crashes the server.
  let dbInstance;
  function getDb() {
    if (!firebaseEnabled) {
      const err = new Error(
        'Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID in backend/.env.',
      );
      err.statusCode = 503;
      throw err;
    }
    if (!dbInstance) dbInstance = admin.firestore();
    return dbInstance;
  }

  // Backwards-compatible shim: existing handlers call `db.collection(...)` / `db.batch()`.
  const db = {
    collection: (...args) => getDb().collection(...args),
    batch: () => getDb().batch(),
  };

  app.use(express.json({ limit: '12mb' }));

  const collections = {
    lawyers: 'lawyers',
    queries: 'queries',
    knowledgeBase: 'knowledgeBase',
    urduDocuments: 'urduDocuments',
    contactSubmissions: 'contactSubmissions',
    analyticsEvents: 'analyticsEvents',
    auditLogs: 'auditLogs',
    securityEvents: 'securityEvents',
  };

  const defaultSettings = {
    siteName: 'Voice2Law',
    siteNameUrdu: 'وائس ٹو لاء',
    maintenanceMode: false,
    allowRegistration: false,
    emailNotifications: true,
    smsNotifications: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    backupFrequency: 'daily',
    adminEmail: 'admin@voice2law.com',
    supportEmail: 'support@voice2law.com',
    aiConfidenceThreshold: 85,
    urduAccuracyThreshold: 90,
  };

  const seedLawyers = [
    {
      name: 'Advocate Muhammad Ali Khan',
      nameUrdu: 'ایڈووکیٹ محمد علی خان',
      expertise: ['Family Law', 'Divorce', 'Child Custody'],
      courtLocation: 'Islamabad High Court',
      city: 'Islamabad',
      rating: 4.9,
      reviewCount: 127,
      experience: 15,
      languages: ['Urdu', 'English'],
      phoneNumber: '03001234567',
      whatsapp: '923001234567',
      email: 'mali.khan@voice2law.pk',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
      verified: true,
      availability: 'Available Today',
      barCouncilNo: 'ISB-2010-4521',
    },
    {
      name: 'Advocate Fatima Sheikh',
      nameUrdu: 'ایڈووکیٹ فاطمہ شیخ',
      expertise: ['Property Law', 'Rent Disputes', 'Land Records'],
      courtLocation: 'Sindh High Court, Karachi',
      city: 'Karachi',
      rating: 4.8,
      reviewCount: 98,
      experience: 12,
      languages: ['Urdu', 'English', 'Sindhi'],
      phoneNumber: '03017654321',
      whatsapp: '923017654321',
      email: 'fatima.sheikh@voice2law.pk',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      verified: true,
      availability: 'Available Today',
      barCouncilNo: 'KHI-2012-8834',
    },
    {
      name: 'Advocate Hassan Raza',
      nameUrdu: 'ایڈووکیٹ حسن رضا',
      expertise: ['Criminal Law', 'Bail Matters', 'FIR Guidance'],
      courtLocation: 'Lahore High Court',
      city: 'Lahore',
      rating: 4.7,
      reviewCount: 84,
      experience: 10,
      languages: ['Urdu', 'English', 'Punjabi'],
      phoneNumber: '03035551234',
      whatsapp: '923035551234',
      email: 'hassan.raza@voice2law.pk',
      image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop',
      verified: true,
      availability: 'Available Tomorrow',
      barCouncilNo: 'LHR-2014-2290',
    },
    {
      name: 'Advocate Sana Mirza',
      nameUrdu: 'ایڈووکیٹ ثناء مرزا',
      expertise: ['Corporate Law', 'Business Contracts', 'Taxation'],
      courtLocation: 'Islamabad District Courts',
      city: 'Rawalpindi',
      rating: 4.9,
      reviewCount: 61,
      experience: 8,
      languages: ['Urdu', 'English'],
      phoneNumber: '03049876543',
      whatsapp: '923049876543',
      email: 'sana.mirza@voice2law.pk',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
      verified: true,
      availability: 'Available Today',
      barCouncilNo: 'RWP-2016-7712',
    },
    {
      name: 'Advocate Usman Tariq',
      nameUrdu: 'ایڈووکیٹ عثمان طارق',
      expertise: ['Civil Law', 'Consumer Rights', 'Contract Disputes'],
      courtLocation: 'Peshawar High Court',
      city: 'Peshawar',
      rating: 4.6,
      reviewCount: 45,
      experience: 7,
      languages: ['Urdu', 'English', 'Pashto'],
      phoneNumber: '03021112233',
      whatsapp: '923021112233',
      email: 'usman.tariq@voice2law.pk',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      verified: false,
      availability: 'Available Today',
      barCouncilNo: 'PSH-2018-3344',
    },
    {
      name: 'Advocate Ayesha Malik',
      nameUrdu: 'ایڈووکیٹ عائشہ ملک',
      expertise: ['Family Law', 'Inheritance', 'Women Rights'],
      courtLocation: 'Multan District Courts',
      city: 'Multan',
      rating: 4.8,
      reviewCount: 72,
      experience: 11,
      languages: ['Urdu', 'English', 'Punjabi'],
      phoneNumber: '03034445566',
      whatsapp: '923034445566',
      email: 'ayesha.malik@voice2law.pk',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      verified: true,
      availability: 'Available Today',
      barCouncilNo: 'MUL-2011-5566',
    },
    {
      name: 'Advocate Bilal Hussain',
      nameUrdu: 'ایڈووکیٹ بلال حسین',
      expertise: ['Property Law', 'Land Disputes', 'Real Estate'],
      courtLocation: 'Lahore District Courts',
      city: 'Lahore',
      rating: 4.5,
      reviewCount: 39,
      experience: 6,
      languages: ['Urdu', 'English', 'Punjabi'],
      phoneNumber: '03037778899',
      whatsapp: '923037778899',
      email: 'bilal.hussain@voice2law.pk',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      verified: false,
      availability: 'Available Tomorrow',
      barCouncilNo: 'LHR-2019-9012',
    },
    {
      name: 'Advocate Zainab Qureshi',
      nameUrdu: 'ایڈووکیٹ زینب قریشی',
      expertise: ['Criminal Law', 'Cyber Law', 'FIR Guidance'],
      courtLocation: 'Karachi District Courts',
      city: 'Karachi',
      rating: 4.9,
      reviewCount: 103,
      experience: 9,
      languages: ['Urdu', 'English'],
      phoneNumber: '03030001122',
      whatsapp: '923030001122',
      email: 'zainab.qureshi@voice2law.pk',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
      verified: true,
      availability: 'Available Today',
      barCouncilNo: 'KHI-2015-6678',
    },
  ];

  function filterSeedLawyers(query) {
    let lawyers = seedLawyers.map((lawyer, index) => ({ id: `demo-${index + 1}`, ...lawyer }));
    const { city, expertise, availability, minRating } = query;
    if (city) lawyers = lawyers.filter((lawyer) => lawyer.city === city);
    if (expertise) {
      lawyers = lawyers.filter(
        (lawyer) =>
          Array.isArray(lawyer.expertise) &&
          lawyer.expertise.some((area) => area.toLowerCase().includes(String(expertise).toLowerCase())),
      );
    }
    if (availability) lawyers = lawyers.filter((lawyer) => lawyer.availability === availability);
    if (minRating) lawyers = lawyers.filter((lawyer) => Number(lawyer.rating || 0) >= Number(minRating));
    return lawyers;
  }

  const seedKnowledge = [
    {
      category: 'Family Law',
      section: 'Muslim Family Laws Ordinance 1961',
      urduSummary: 'Family law guidance for divorce and reconciliation procedure.',
      englishSummary: 'Divorce rules and procedures under family law ordinance.',
      status: 'approved',
      lastUpdated: new Date().toISOString().slice(0, 10),
    },
    {
      category: 'Property Law',
      section: 'Transfer of Property Act 1882 - Section 54',
      urduSummary: 'Property transfer documentation and registration guidance.',
      englishSummary: 'Property transfer laws and documentation requirements.',
      status: 'approved',
      lastUpdated: new Date().toISOString().slice(0, 10),
    },
  ];

  const seedDocuments = [
    {
      title: 'Muslim Family Laws Ordinance 1961',
      titleUrdu: 'Muslim Family Laws Ordinance 1961',
      category: 'Family Law',
      description: 'Complete guide to Muslim family laws in Pakistan.',
      descriptionUrdu: 'Complete guide to Muslim family laws in Pakistan.',
      fileName: 'family-laws-1961.pdf',
      fileSize: '2.5 MB',
      uploadDate: new Date().toISOString(),
      status: 'published',
      content: '',
    },
  ];

  const seedQueries = [
    {
      userName: 'Ahmed Khan',
      userEmail: 'ahmed@example.com',
      queryType: 'text',
      category: 'Family Law',
      question: 'What is the procedure for divorce in Pakistan?',
      aiResponse:
        'Under the Muslim Family Laws Ordinance 1961, a written notice and reconciliation period may apply. This is general legal information only.',
      rating: 5,
      feedback: 'Helpful explanation',
      status: 'resolved',
      timestamp: new Date().toISOString(),
      confidence: 92,
    },
  ];

  function sanitizeString(value, max = 4000) {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/[<>]/g, '').slice(0, max);
  }

  function serializeDoc(doc) {
    return { id: doc.id, ...doc.data() };
  }

  function toUserProfile(token) {
    const isAdmin = token.admin === true || token.role === 'admin';
    const displayName =
      (token.displayName || token.name || '').trim() ||
      token.email?.split('@')[0] ||
      (isAdmin ? 'Voice2Law Admin' : 'User');
    const picture = token.picture || token.photoURL || null;
    return {
      id: token.uid || token.sub,
      email: token.email || '',
      role: isAdmin ? 'admin' : 'user',
      name: displayName,
      displayName,
      picture,
      photoURL: picture,
    };
  }

  async function verifyToken(req) {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) return null;

    const session = sessionAuth.verifySessionToken(match[1]);
    if (session) return session;

    if (firebaseEnabled) {
      try {
        return await admin.auth().verifyIdToken(match[1]);
      } catch {
        return null;
      }
    }

    return null;
  }

  async function requireAdmin(req, res, next) {
    try {
      const token = await verifyToken(req);
      if (!token || token.admin !== true) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      req.user = token;
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  async function addAudit(req, action, targetType, targetId) {
    await db.collection(collections.auditLogs).add({
      action,
      targetType,
      targetId,
      adminUid: req.user?.uid || null,
      adminEmail: req.user?.email || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  async function upsert(collectionName, id, data) {
    const payload = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (id) {
      await db.collection(collectionName).doc(id).set(payload, { merge: true });
      const doc = await db.collection(collectionName).doc(id).get();
      return serializeDoc(doc);
    }
    const docRef = await db.collection(collectionName).add({
      ...payload,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const doc = await docRef.get();
    return serializeDoc(doc);
  }

  function normalizeLawyer(body) {
    return {
      name: sanitizeString(body.name, 160),
      nameUrdu: sanitizeString(body.nameUrdu, 160),
      expertise: Array.isArray(body.expertise) ? body.expertise.map((v) => sanitizeString(v, 80)).filter(Boolean) : [],
      courtLocation: sanitizeString(body.courtLocation, 160),
      city: sanitizeString(body.city, 80),
      rating: Number(body.rating || 4.5),
      reviewCount: Number(body.reviewCount || 0),
      experience: Number(body.experience || 0),
      languages: Array.isArray(body.languages) ? body.languages.map((v) => sanitizeString(v, 40)).filter(Boolean) : [],
      phoneNumber: sanitizeString(body.phoneNumber, 40),
      whatsapp: sanitizeString(body.whatsapp, 40),
      email: sanitizeString(body.email, 160),
      image:
        sanitizeString(body.image, 1000) ||
        'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop',
      verified: Boolean(body.verified),
      availability: sanitizeString(body.availability, 80),
      barCouncilNo: sanitizeString(body.barCouncilNo, 80),
    };
  }

  function normalizeKnowledge(body) {
    return {
      category: sanitizeString(body.category, 120),
      section: sanitizeString(body.section, 240),
      urduSummary: sanitizeString(body.urduSummary, 3000),
      englishSummary: sanitizeString(body.englishSummary, 3000),
      status: ['approved', 'pending', 'review'].includes(body.status) ? body.status : 'pending',
      lastUpdated: body.lastUpdated || new Date().toISOString().slice(0, 10),
    };
  }

  function normalizeDocument(body) {
    return {
      title: sanitizeString(body.title, 200),
      titleUrdu: sanitizeString(body.titleUrdu, 200),
      category: sanitizeString(body.category, 120),
      description: sanitizeString(body.description, 1000),
      descriptionUrdu: sanitizeString(body.descriptionUrdu, 1000),
      fileName: sanitizeString(body.fileName, 240),
      fileSize: sanitizeString(body.fileSize, 40),
      uploadDate: body.uploadDate || new Date().toISOString(),
      status: ['published', 'draft', 'pending'].includes(body.status) ? body.status : 'pending',
      content: sanitizeString(body.content, 10000),
      fileUrl: sanitizeString(body.fileUrl, 1000),
      storagePath: sanitizeString(body.storagePath, 1000),
    };
  }

  app.get('/auth/me', async (req, res) => {
    try {
      const token = await verifyToken(req);
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      return res.json({ user: toUserProfile(token) });
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  });

  app.post('/auth/google', async (req, res) => {
    try {
      const credential = req.body.credential || req.body.idToken;
      if (!credential) {
        return res.status(400).json({ error: 'Google credential is required' });
      }
      if (!sessionAuth.isGoogleAuthConfigured()) {
        return res.status(503).json({
          error:
            'Google sign-in is not configured on the server. Set GOOGLE_CLIENT_ID and JWT_SECRET in backend/.env.',
        });
      }

      const payload = await sessionAuth.verifyGoogleCredential(credential);
      const user = sessionAuth.buildUserFromGoogle(payload);
      const token = sessionAuth.signSessionToken(user);

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          displayName: user.displayName,
          picture: user.picture,
          photoURL: user.photoURL,
        },
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      const message = String(error.message || '');
      if (message.includes('Token used too late') || message.includes('Invalid token')) {
        return res.status(401).json({ error: 'Invalid or expired Google sign-in. Please try again.' });
      }
      return res.status(401).json({ error: 'Google sign-in failed' });
    }
  });

  app.post('/auth/login', async (req, res) => {
    const email = sanitizeString(req.body.email, 160).toLowerCase();
    const id = email.replace(/[^\w.-]/g, '_') || 'unknown';
    const ref = db.collection(collections.securityEvents).doc(id);
    const snap = await ref.get();
    const current = snap.exists ? snap.data() : {};
    const failures = Number(current.failures || 0) + 1;
    const lockedUntil = failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
    await ref.set(
      {
        email,
        failures,
        lockedUntil,
        lastFailureAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return res
      .status(401)
      .json({ error: lockedUntil ? 'Too many failed login attempts' : 'Login failed', lockedUntil });
  });

  app.post('/auth/logout', async (req, res) => {
    try {
      const token = await verifyToken(req);
      if (token?.admin === true) {
        req.user = token;
        await addAudit(req, 'logout', 'auth', token.uid);
      }
    } catch {
      // Ignore invalid tokens on logout.
    }
    return res.json({ ok: true });
  });

  app.get('/queries/mine', async (req, res) => {
    try {
      const token = await verifyToken(req);
      if (!token?.email) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (!firebaseEnabled) return res.json({ queries: [] });
      const email = token.email.toLowerCase();
      const snapshot = await db.collection(collections.queries).orderBy('timestamp', 'desc').get();
      const queries = snapshot.docs
        .map(serializeDoc)
        .filter((query) => String(query.userEmail || '').toLowerCase() === email);
      return res.json({ queries });
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  });

  app.get('/lawyers', async (req, res) => {
    if (!firebaseEnabled) return res.json({ lawyers: filterSeedLawyers(req.query) });
    const snapshot = await db.collection(collections.lawyers).orderBy('name').get();
    let lawyers = snapshot.docs.map(serializeDoc);
    if (!lawyers.length) lawyers = filterSeedLawyers(req.query);
    else {
      const { city, expertise, availability, minRating } = req.query;
      if (city) lawyers = lawyers.filter((lawyer) => lawyer.city === city);
      if (expertise) {
        lawyers = lawyers.filter((lawyer) => Array.isArray(lawyer.expertise) && lawyer.expertise.includes(expertise));
      }
      if (availability) lawyers = lawyers.filter((lawyer) => lawyer.availability === availability);
      if (minRating) lawyers = lawyers.filter((lawyer) => Number(lawyer.rating || 0) >= Number(minRating));
    }
    return res.json({ lawyers });
  });

  app.get('/lawyers/:id', async (req, res) => {
    if (!firebaseEnabled) return res.status(404).json({ error: 'Lawyer not found' });
    const doc = await db.collection(collections.lawyers).doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Lawyer not found' });
    return res.json({ lawyer: serializeDoc(doc) });
  });

  app.post('/lawyers', requireAdmin, async (req, res) => {
    const lawyer = await upsert(collections.lawyers, null, normalizeLawyer(req.body));
    await addAudit(req, 'create', 'lawyer', lawyer.id);
    return res.status(201).json({ lawyer });
  });

  app.put('/lawyers/:id', requireAdmin, async (req, res) => {
    const lawyer = await upsert(collections.lawyers, req.params.id, normalizeLawyer(req.body));
    await addAudit(req, 'update', 'lawyer', req.params.id);
    return res.json({ lawyer });
  });

  app.delete('/lawyers/:id', requireAdmin, async (req, res) => {
    await db.collection(collections.lawyers).doc(req.params.id).delete();
    await addAudit(req, 'delete', 'lawyer', req.params.id);
    return res.json({ ok: true });
  });

  app.get('/queries', requireAdmin, async (req, res) => {
    const snapshot = await db.collection(collections.queries).orderBy('timestamp', 'desc').get();
    return res.json({ queries: snapshot.docs.map(serializeDoc) });
  });

  app.get('/queries/:id', requireAdmin, async (req, res) => {
    const doc = await db.collection(collections.queries).doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Query not found' });
    return res.json({ query: serializeDoc(doc) });
  });

  app.post('/queries', async (req, res) => {
    const query = await upsert(collections.queries, null, {
      userName: sanitizeString(req.body.userName || 'Anonymous', 120),
      userEmail: sanitizeString(req.body.userEmail || 'anonymous@voice2law.local', 160),
      queryType: req.body.queryType === 'voice' ? 'voice' : 'text',
      category: sanitizeString(req.body.category || 'General Law', 120),
      question: sanitizeString(req.body.question, 4000),
      questionUrdu: sanitizeString(req.body.questionUrdu, 4000),
      aiResponse: sanitizeString(req.body.aiResponse, 8000),
      aiResponseUrdu: sanitizeString(req.body.aiResponseUrdu, 8000),
      rating: Number(req.body.rating || 0),
      feedback: sanitizeString(req.body.feedback, 2000),
      status: ['pending', 'resolved', 'flagged'].includes(req.body.status) ? req.body.status : 'pending',
      timestamp: req.body.timestamp || new Date().toISOString(),
      confidence: Number(req.body.confidence || 0),
    });
    return res.status(201).json({ query });
  });

  app.put('/queries/:id', requireAdmin, async (req, res) => {
    const query = await upsert(collections.queries, req.params.id, req.body);
    await addAudit(req, 'update', 'query', req.params.id);
    return res.json({ query });
  });

  app.delete('/queries/:id', requireAdmin, async (req, res) => {
    await db.collection(collections.queries).doc(req.params.id).delete();
    await addAudit(req, 'delete', 'query', req.params.id);
    return res.json({ ok: true });
  });

  app.get('/knowledge-base', requireAdmin, async (req, res) => {
    const snapshot = await db.collection(collections.knowledgeBase).orderBy('category').get();
    return res.json({ entries: snapshot.docs.map(serializeDoc) });
  });

  app.post('/knowledge-base', requireAdmin, async (req, res) => {
    const entry = await upsert(collections.knowledgeBase, null, normalizeKnowledge(req.body));
    await addAudit(req, 'create', 'knowledgeBase', entry.id);
    return res.status(201).json({ entry });
  });

  app.put('/knowledge-base/:id', requireAdmin, async (req, res) => {
    const entry = await upsert(collections.knowledgeBase, req.params.id, normalizeKnowledge(req.body));
    await addAudit(req, 'update', 'knowledgeBase', req.params.id);
    return res.json({ entry });
  });

  app.delete('/knowledge-base/:id', requireAdmin, async (req, res) => {
    await db.collection(collections.knowledgeBase).doc(req.params.id).delete();
    await addAudit(req, 'delete', 'knowledgeBase', req.params.id);
    return res.json({ ok: true });
  });

  app.get('/urdu-documents', requireAdmin, async (req, res) => {
    const snapshot = await db.collection(collections.urduDocuments).orderBy('uploadDate', 'desc').get();
    return res.json({ documents: snapshot.docs.map(serializeDoc) });
  });

  app.post('/urdu-documents', requireAdmin, async (req, res) => {
    const document = await upsert(collections.urduDocuments, null, normalizeDocument(req.body));
    await addAudit(req, 'create', 'urduDocument', document.id);
    return res.status(201).json({ document });
  });

  app.put('/urdu-documents/:id', requireAdmin, async (req, res) => {
    const document = await upsert(collections.urduDocuments, req.params.id, normalizeDocument(req.body));
    await addAudit(req, 'update', 'urduDocument', req.params.id);
    return res.json({ document });
  });

  app.delete('/urdu-documents/:id', requireAdmin, async (req, res) => {
    await db.collection(collections.urduDocuments).doc(req.params.id).delete();
    await addAudit(req, 'delete', 'urduDocument', req.params.id);
    return res.json({ ok: true });
  });

  app.get('/legal-topics', async (req, res) => {
    if (!firebaseEnabled) return res.json({ documents: [] });
    const snapshot = await db.collection(collections.urduDocuments).where('status', '==', 'published').get();
    return res.json({ documents: snapshot.docs.map(serializeDoc) });
  });

  app.get('/system-settings', requireAdmin, async (req, res) => {
    const ref = db.collection('system').doc('settings');
    const doc = await ref.get();
    if (!doc.exists) await ref.set(defaultSettings);
    const fresh = await ref.get();
    return res.json({ settings: fresh.data() });
  });

  app.put('/system-settings', requireAdmin, async (req, res) => {
    const settings = { ...defaultSettings, ...req.body };
    await db.collection('system').doc('settings').set(settings, { merge: true });
    await addAudit(req, 'update', 'systemSettings', 'settings');
    return res.json({ settings });
  });

  app.post('/contact', async (req, res) => {
    const payload = {
      name: sanitizeString(req.body.name, 120),
      email: sanitizeString(req.body.email, 160),
      phone: sanitizeString(req.body.phone, 40),
      subject: sanitizeString(req.body.subject, 120),
      message: sanitizeString(req.body.message, 4000),
      status: 'new',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      return res.status(400).json({ error: 'Missing required contact fields' });
    }
    const doc = await db.collection(collections.contactSubmissions).add(payload);
    return res.status(201).json({ id: doc.id });
  });

  /** Pick the answer language from the question's script (Urdu/Arabic vs Latin). */
  function detectLanguage(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return 'urdu';
    const arabic = (trimmed.match(/[\u0600-\u06FF]/g) || []).length;
    return arabic / trimmed.length >= 0.15 ? 'urdu' : 'english';
  }

  /**
   * Optional OpenAI fallback, used ONLY when the RAG/NLP service is unreachable AND
   * OPENAI_API_KEY is set. RAG (nlp-service) is the primary answer engine.
   * @returns {Promise<string|null>}
   */
  async function tryOpenAiFallback(question) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are Voice2Law, a Pakistani legal information assistant. Provide general legal information only, not legal advice. Respond concisely and include a disclaimer.',
            },
            { role: 'user', content: question },
          ],
          temperature: 0.2,
        }),
      });
      if (!response.ok) throw new Error(`OpenAI request failed (${response.status})`);
      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (err) {
      console.error('[openai] fallback failed:', err.message);
      return null;
    }
  }

  /**
   * Generate a legal answer. PRIMARY path = RAG via the NLP service (Chroma retrieval
   * + Gemini/Groq). Falls back to OpenAI (if configured) and finally to a graceful
   * "service unavailable" message — never throws.
   */
  async function generateLegalAnswer(question, queryType) {
    const language = detectLanguage(question);
    const result = await nlp.askNlp(question, language);

    if (result.fromNlp) {
      return {
        answer: result.answer,
        answerUrdu: language === 'urdu' ? result.answer : '',
        sources: result.sources,
        confidence: queryType === 'voice' ? 82 : 88,
        category: inferCategory(question),
        fromNlp: true,
        language,
      };
    }

    // RAG is down — try OpenAI as a graceful, secondary fallback.
    const openAiAnswer = await tryOpenAiFallback(question);
    if (openAiAnswer) {
      return {
        answer: openAiAnswer,
        answerUrdu: '',
        sources: [],
        confidence: queryType === 'voice' ? 70 : 72,
        category: inferCategory(question),
        fromNlp: false,
        language,
      };
    }

    // Nothing available — return the graceful fallback text (flagged as low confidence).
    return {
      answer: result.answer,
      answerUrdu: '',
      sources: [],
      confidence: 55,
      category: inferCategory(question),
      fromNlp: false,
      language,
    };
  }

  /** Best-effort Firestore persistence — never fails the request when Firebase is off/down. */
  async function persistQuery(record) {
    if (!firebaseEnabled) return null;
    try {
      return await upsert(collections.queries, null, record);
    } catch (err) {
      console.error('[firestore] failed to persist query:', err.message);
      return null;
    }
  }

  async function logAnalytics(type) {
    if (!firebaseEnabled) return;
    try {
      await getDb()
        .collection(collections.analyticsEvents)
        .add({ type, timestamp: admin.firestore.FieldValue.serverTimestamp() });
    } catch (err) {
      console.error('[firestore] analytics write failed:', err.message);
    }
  }

  function inferCategory(question) {
    const lower = question.toLowerCase();
    if (lower.includes('divorce') || lower.includes('marriage') || lower.includes('custody')) return 'Family Law';
    if (lower.includes('property') || lower.includes('inheritance') || lower.includes('rent')) return 'Property Law';
    if (lower.includes('fir') || lower.includes('criminal') || lower.includes('bail')) return 'Criminal Law';
    return 'General Law';
  }

  async function loadLawyerPool() {
    const demoPool = () => seedLawyers.map((lawyer, index) => ({ id: `demo-${index + 1}`, ...lawyer }));

    if (!firebaseEnabled) return demoPool();

    try {
      const snapshot = await db.collection(collections.lawyers).get();
      const lawyers = snapshot.docs.map(serializeDoc);
      if (lawyers.length) return lawyers;
    } catch (err) {
      console.error('[firestore] failed to load lawyers:', err.message);
    }

    return demoPool();
  }

  async function attachLawyerRecommendations(question, sources) {
    try {
      return await recommendLawyers(question, sources, loadLawyerPool);
    } catch (err) {
      console.error('[lawyers] recommendation failed:', err.message);
      return { lawyers: [], detectedTopic: null };
    }
  }

  app.post('/ai/text-query', async (req, res) => {
    const question = sanitizeString(req.body.question, 4000);
    if (!question) return res.status(400).json({ error: 'Question is required' });
    const ai = await generateLegalAnswer(question, 'text');
    const status = ai.confidence < 70 ? 'flagged' : 'pending';
    const query = await persistQuery({
      userName: sanitizeString(req.body.userName || 'Anonymous', 120),
      userEmail: sanitizeString(req.body.userEmail || 'anonymous@voice2law.local', 160),
      queryType: 'text',
      category: ai.category,
      question,
      aiResponse: ai.answer,
      aiResponseUrdu: ai.answerUrdu,
      rating: 0,
      status,
      timestamp: new Date().toISOString(),
      confidence: ai.confidence,
    });
    await logAnalytics('text-query');
    const { lawyers: recommendedLawyers, detectedTopic } = await attachLawyerRecommendations(
      question,
      ai.sources,
    );
    return res.json({
      id: query?.id || null,
      answer: ai.answer,
      answerUrdu: ai.answerUrdu,
      category: ai.category,
      confidence: ai.confidence,
      status,
      sources: ai.sources,
      recommendedLawyers,
      detectedTopic,
    });
  });

  app.post('/ai/voice-query', async (req, res) => {
    const transcript = sanitizeString(req.body.transcript || 'Voice transcription is not configured yet.', 4000);
    const ai = await generateLegalAnswer(transcript, 'voice');
    const status = ai.confidence < 70 ? 'flagged' : 'pending';
    const query = await persistQuery({
      userName: sanitizeString(req.body.userName || 'Anonymous', 120),
      userEmail: sanitizeString(req.body.userEmail || 'anonymous@voice2law.local', 160),
      queryType: 'voice',
      category: ai.category,
      question: transcript,
      aiResponse: ai.answer,
      aiResponseUrdu: ai.answerUrdu,
      rating: 0,
      status,
      timestamp: new Date().toISOString(),
      confidence: ai.confidence,
    });
    await logAnalytics('voice-query');
    const { lawyers: recommendedLawyers, detectedTopic } = await attachLawyerRecommendations(
      transcript,
      ai.sources,
    );
    return res.json({
      id: query?.id || null,
      transcript,
      answer: ai.answer,
      answerUrdu: ai.answerUrdu,
      category: ai.category,
      confidence: ai.confidence,
      status,
      sources: ai.sources,
      recommendedLawyers,
      detectedTopic,
    });
  });

  const MAX_TTS_CHARS = Number(process.env.MAX_TTS_CHARS) || 1500;

  function truncateForTts(rawText, maxChars = MAX_TTS_CHARS) {
    const trimmed = rawText.trim();
    if (trimmed.length <= maxChars) return trimmed;

    const slice = trimmed.slice(0, maxChars);
    const lastSentence = Math.max(
      slice.lastIndexOf('۔'),
      slice.lastIndexOf('.'),
      slice.lastIndexOf('!'),
      slice.lastIndexOf('?'),
    );
    if (lastSentence > maxChars * 0.4) {
      return slice.slice(0, lastSentence + 1).trim();
    }

    const lastSpace = slice.lastIndexOf(' ');
    if (lastSpace > maxChars * 0.5) {
      return slice.slice(0, lastSpace).trim();
    }

    return slice.trim();
  }

  /** POST /api/tts — proxies to NLP /tts (ElevenLabs when TTS_PROVIDER=elevenlabs). */
  app.post('/tts', async (req, res) => {
    const rawText = sanitizeString(req.body.text, 4000);
    const language = req.body.language === 'english' ? 'english' : 'urdu';

    if (!rawText) {
      return res.status(400).json({ message: 'Missing "text" to synthesize.' });
    }

    const text = truncateForTts(rawText);
    if (text.length < rawText.length) {
      console.info(`[tts] truncated ${rawText.length} -> ${text.length} chars for faster synthesis`);
    }

    try {
      const { audio, contentType } = await nlp.ttsNlp(text, language);
      res.setHeader('Content-Type', contentType || 'audio/mpeg');
      res.setHeader('Content-Length', audio.length);
      res.setHeader('Cache-Control', 'no-store');
      return res.send(audio);
    } catch (err) {
      return res.status(502).json({
        message: err.message || 'Text-to-speech is currently unavailable.',
      });
    }
  });

  app.get('/admin/dashboard', requireAdmin, async (req, res) => {
    const [queries, lawyers, documents] = await Promise.all([
      db.collection(collections.queries).get(),
      db.collection(collections.lawyers).get(),
      db.collection(collections.urduDocuments).get(),
    ]);
    const queryData = queries.docs.map((doc) => doc.data());
    return res.json({
      metrics: {
        totalQueries: queryData.length,
        voiceQueries: queryData.filter((query) => query.queryType === 'voice').length,
        textQueries: queryData.filter((query) => query.queryType === 'text').length,
        flaggedQueries: queryData.filter((query) => query.status === 'flagged').length,
        lawyers: lawyers.size,
        documents: documents.size,
      },
      recentActivities: queryData.slice(0, 5),
    });
  });

  app.post('/admin/seed', requireAdmin, async (req, res) => {
    const batch = db.batch();

    batch.set(db.collection('system').doc('settings'), defaultSettings, { merge: true });

    async function seedCollection(collectionName, records) {
      const existing = await db.collection(collectionName).limit(1).get();
      if (!existing.empty) return 0;
      records.forEach((record) => {
        const ref = db.collection(collectionName).doc();
        batch.set(ref, {
          ...record,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      return records.length;
    }

    const counts = {
      lawyers: await seedCollection(collections.lawyers, seedLawyers),
      knowledgeBase: await seedCollection(collections.knowledgeBase, seedKnowledge),
      urduDocuments: await seedCollection(collections.urduDocuments, seedDocuments),
      queries: await seedCollection(collections.queries, seedQueries),
    };

    await batch.commit();
    await addAudit(req, 'seed', 'database', 'initial-data');
    return res.json({ ok: true, counts });
  });

  return app;
};
