const mongoose = require('mongoose');

const lawyerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    // Phone number is also used to build the WhatsApp (wa.me) link.
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      trim: true,
    },
    nameUrdu: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    experience: {
      type: Number,
      default: 0,
    },
    courtLocation: {
      type: String,
      trim: true,
    },
    languages: {
      type: [String],
      default: [],
    },
    availability: {
      type: String,
      trim: true,
    },
    barCouncilNo: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lawyer', lawyerSchema);
