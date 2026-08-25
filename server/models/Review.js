const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    blogId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    comment: { type: String, required: true },
    adminReply: { type: String, default: null },
    replyDate: { type: String, default: null }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
