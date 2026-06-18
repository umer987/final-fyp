const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema(
  {
    titleUrdu: {
      type: String,
      required: true,
      trim: true,
    },
    titleEnglish: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['family', 'rent', 'criminal', 'other'],
      default: 'other',
    },
    contentUrdu: {
      type: String,
      required: true,
    },
    summaryUrdu: {
      type: String,
      default: '',
    },
    // Entries start as "pending" and must be approved by an admin before
    // they appear in the public knowledge base.
    status: {
      type: String,
      enum: ['pending', 'approved'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
