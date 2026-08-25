const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    action: { type: String, required: true },
    detail: { type: String, default: '' },
    timestamp: { type: String, default: () => new Date().toISOString() }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
