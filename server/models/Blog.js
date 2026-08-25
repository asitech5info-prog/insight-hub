const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    categoryId: { type: String, required: true, index: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    author: {
      name: { type: String, default: 'Admin Team' },
      role: { type: String, default: 'Editor-in-Chief' },
      avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
    },
    coverImage: { type: String, default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80' },
    readTime: { type: String, default: '5 min read' },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    tags: { type: [String], default: ['Tech'] },
    featured: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
