const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'site_config' },
    siteName: { type: String, default: 'Insight Hub' },
    tagline: { type: String, default: 'Explore · Learn · Innovate · Shape the Future' },
    contactEmail: { type: String, default: 'asitech5info@gmail.com' },
    youtubeUrl: { type: String, default: 'https://www.youtube.com/@howtech_works' },
    announcementBanner: { type: String, default: '🚀 Welcome to Insight Hub — The Future of Tech & AI Insights' },
    showBanner: { type: Boolean, default: true },
    accentTheme: { type: String, default: 'green-yellow' },
    featuredBadge: { type: String, default: 'Editor Choice 2026' }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
