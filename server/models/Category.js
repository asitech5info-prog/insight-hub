const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    icon: { type: String, default: '✨' }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.models.Category || mongoose.model('Category', CategorySchema);
