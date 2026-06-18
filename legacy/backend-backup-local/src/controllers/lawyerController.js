const { validationResult } = require('express-validator');
const Lawyer = require('../models/Lawyer');

/**
 * Build a WhatsApp "click to chat" link (https://wa.me/<number>) from a
 * phone number. wa.me requires digits only, in full international format
 * with no '+', spaces or dashes.
 */
function buildWhatsAppLink(phone, message) {
  const digits = String(phone || '').replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}

// Attach a `whatsappLink` field to a lawyer document for the frontend.
function withWhatsApp(lawyerDoc) {
  const lawyer = lawyerDoc.toObject ? lawyerDoc.toObject() : lawyerDoc;
  lawyer.whatsappLink = buildWhatsAppLink(
    lawyer.phone,
    `السلام علیکم ${lawyer.name}, I found your profile on Voice2Law and would like a legal consultation.`
  );
  return lawyer;
}

/**
 * GET /api/lawyers (public)
 * Optional query filters: ?city=Lahore&specialization=Family&verified=true
 */
async function listLawyers(req, res, next) {
  try {
    const { city, specialization, verified } = req.query;
    const filter = {};

    if (city) filter.city = new RegExp(`^${city}$`, 'i');
    if (specialization) filter.specialization = new RegExp(specialization, 'i');
    if (verified !== undefined) filter.verified = verified === 'true';

    const lawyers = await Lawyer.find(filter).sort({ createdAt: -1 });
    res.json(lawyers.map(withWhatsApp));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/lawyers/:id (public)
 */
async function getLawyer(req, res, next) {
  try {
    const lawyer = await Lawyer.findById(req.params.id);
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }
    res.json(withWhatsApp(lawyer));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/lawyers (admin only)
 */
async function createLawyer(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const lawyer = await Lawyer.create(req.body);
    res.status(201).json(withWhatsApp(lawyer));
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/lawyers/:id (admin only)
 */
async function updateLawyer(req, res, next) {
  try {
    const lawyer = await Lawyer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }
    res.json(withWhatsApp(lawyer));
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/lawyers/:id (admin only)
 */
async function deleteLawyer(req, res, next) {
  try {
    const lawyer = await Lawyer.findByIdAndDelete(req.params.id);
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }
    res.json({ message: 'Lawyer deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  buildWhatsAppLink,
  listLawyers,
  getLawyer,
  createLawyer,
  updateLawyer,
  deleteLawyer,
};
