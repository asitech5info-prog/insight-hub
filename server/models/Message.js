const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, default: 'General Inquiry' },
    message: { type: String, required: true },
    read: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
