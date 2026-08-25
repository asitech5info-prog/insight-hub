require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const { dbAdapter, ADMIN_PASSWORD } = require('./data/store');
const { connectToDatabase } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from /public directory
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Simple secure session token generator for single admin
const ACTIVE_TOKENS = new Set();

function generateAuthToken() {
  const token = 'ih_adm_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  ACTIVE_TOKENS.add(token);
  return token;
}

function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token || !ACTIVE_TOKENS.has(token)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session token' });
  }

  next();
}

// ----------------------------------------------------
// SYSTEM HEALTH & STATUS (Useful for Vercel & MongoDB Monitoring)
// ----------------------------------------------------
app.get('/api/health', async (req, res) => {
  try {
    const status = await dbAdapter.getStatus();
    res.json({
      status: 'online',
      service: 'The Insight Hub Engine',
      environment: process.env.NODE_ENV || 'production',
      database: status,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (password === ADMIN_PASSWORD) {
    const token = generateAuthToken();
    return res.json({
      success: true,
      token,
      message: 'Admin access authenticated successfully'
    });
  }

  return res.status(401).json({ error: 'Invalid admin credentials' });
});

app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.json({ authenticated: false });
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const authenticated = ACTIVE_TOKENS.has(token);
  return res.json({ authenticated });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    ACTIVE_TOKENS.delete(token);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// ----------------------------------------------------
// BLOG ENDPOINTS (Public & Admin)
// ----------------------------------------------------
// Get all blogs with optional search, category, or featured filters
app.get('/api/blogs', async (req, res) => {
  try {
    const result = await dbAdapter.getBlogs(req.query);
    res.json(result);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Get single blog by ID or slug
app.get('/api/blogs/:idOrSlug', async (req, res) => {
  try {
    const result = await dbAdapter.getBlogByIdOrSlug(req.params.idOrSlug);
    if (!result) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json(result);
  } catch (err) {
    console.error('Error fetching blog:', err);
    res.status(500).json({ error: 'Failed to retrieve article' });
  }
});

// Like a blog post
app.post('/api/blogs/:id/like', async (req, res) => {
  try {
    const likes = await dbAdapter.likeBlog(req.params.id);
    if (likes === null) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json({ success: true, likes });
  } catch (err) {
    console.error('Error liking blog:', err);
    res.status(500).json({ error: 'Failed to register like' });
  }
});

// Create new blog (Admin only)
app.post('/api/blogs', adminAuthMiddleware, async (req, res) => {
  try {
    const {
      title,
      category,
      categoryId,
      excerpt,
      content,
      coverImage,
      authorName,
      authorRole,
      authorAvatar,
      readTime,
      tags,
      featured
    } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content, and category are required' });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 6);

    const blogData = {
      title: title.trim(),
      slug,
      category: category.trim(),
      categoryId: categoryId || category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      excerpt: (excerpt || content.substring(0, 160) + '...').trim(),
      content: content.trim(),
      author: {
        name: authorName || 'Admin Team',
        role: authorRole || 'Editor-in-Chief',
        avatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      },
      coverImage: coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      readTime: readTime || `${Math.max(2, Math.ceil(content.split(' ').length / 180))} min read`,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : ['Tech']),
      featured: Boolean(featured)
    };

    const newBlog = await dbAdapter.createBlog(blogData);
    res.status(201).json({ success: true, blog: newBlog });
  } catch (err) {
    console.error('Error creating blog:', err);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// Edit blog (Admin only)
app.put('/api/blogs/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const {
      title,
      category,
      categoryId,
      excerpt,
      content,
      coverImage,
      authorName,
      authorRole,
      authorAvatar,
      readTime,
      tags,
      featured
    } = req.body;

    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title.trim();
    if (category !== undefined) updatePayload.category = category.trim();
    if (categoryId !== undefined) updatePayload.categoryId = categoryId;
    if (excerpt !== undefined) updatePayload.excerpt = excerpt.trim();
    if (content !== undefined) updatePayload.content = content.trim();
    if (coverImage !== undefined) updatePayload.coverImage = coverImage;
    if (readTime !== undefined) updatePayload.readTime = readTime;
    if (featured !== undefined) updatePayload.featured = Boolean(featured);
    if (tags !== undefined) {
      updatePayload.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }
    if (authorName !== undefined || authorRole !== undefined || authorAvatar !== undefined) {
      updatePayload.author = {
        name: authorName || 'Admin Team',
        role: authorRole || 'Editor-in-Chief',
        avatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };
    }

    const updated = await dbAdapter.updateBlog(req.params.id, updatePayload);
    if (!updated) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json({ success: true, blog: updated });
  } catch (err) {
    console.error('Error updating blog:', err);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// Delete blog (Admin only)
app.delete('/api/blogs/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const success = await dbAdapter.deleteBlog(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json({ success: true, message: 'Blog and associated reviews deleted successfully' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// ----------------------------------------------------
// REVIEW ENDPOINTS
// ----------------------------------------------------
// Submit review for blog (Public)
app.post('/api/blogs/:id/reviews', async (req, res) => {
  try {
    const { userName, userEmail, rating, comment } = req.body;
    if (!userName || !comment) {
      return res.status(400).json({ error: 'Name and review comment are required' });
    }

    const newReview = await dbAdapter.createReview({
      blogId: req.params.id,
      userName: userName.trim(),
      userEmail: (userEmail || '').trim(),
      rating: Math.min(5, Math.max(1, parseInt(rating, 10) || 5)),
      comment: comment.trim()
    });

    res.status(201).json({ success: true, review: newReview });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: 'Failed to post review' });
  }
});

// Get all reviews across all blogs (Admin only)
app.get('/api/admin/reviews', adminAuthMiddleware, async (req, res) => {
  try {
    const reviews = await dbAdapter.getAllReviews();
    res.json({ reviews });
  } catch (err) {
    console.error('Error fetching admin reviews:', err);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

// Admin reply to review (Admin only)
app.put('/api/admin/reviews/:id/reply', adminAuthMiddleware, async (req, res) => {
  try {
    const { reply } = req.body;
    const review = await dbAdapter.replyReview(req.params.id, reply);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ success: true, review });
  } catch (err) {
    console.error('Error replying to review:', err);
    res.status(500).json({ error: 'Failed to submit reply' });
  }
});

// Delete review (Admin only)
app.delete('/api/admin/reviews/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const success = await dbAdapter.deleteReview(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ----------------------------------------------------
// CONTACT MESSAGES ENDPOINTS
// ----------------------------------------------------
// User submit message to admin (Public)
app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const newMessage = await dbAdapter.createMessage({
      name: name.trim(),
      email: email.trim(),
      subject: (subject || 'General Inquiry').trim(),
      message: message.trim()
    });

    res.status(201).json({ success: true, message: 'Message sent successfully to Insight Hub team!', data: newMessage });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get all messages (Admin only)
app.get('/api/admin/messages', adminAuthMiddleware, async (req, res) => {
  try {
    const messages = await dbAdapter.getAllMessages();
    res.json({ messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// Mark message as read / toggle (Admin only)
app.put('/api/admin/messages/:id/read', adminAuthMiddleware, async (req, res) => {
  try {
    const msg = await dbAdapter.toggleMessageRead(req.params.id, req.body.read);
    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ success: true, message: msg });
  } catch (err) {
    console.error('Error updating message:', err);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Delete message (Admin only)
app.delete('/api/admin/messages/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const success = await dbAdapter.deleteMessage(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// ----------------------------------------------------
// ADMIN ADVANCED ACTIONS & BLOG MANAGEMENT
// ----------------------------------------------------
// Toggle Featured status of a blog
app.put('/api/admin/blogs/:id/toggle-featured', adminAuthMiddleware, async (req, res) => {
  try {
    const result = await dbAdapter.getBlogByIdOrSlug(req.params.id);
    if (!result || !result.blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const updated = await dbAdapter.updateBlog(req.params.id, {
      featured: !result.blog.featured
    });

    res.json({
      success: true,
      blog: updated,
      message: `Article ${updated.featured ? 'marked as Featured' : 'unmarked from Featured'}`
    });
  } catch (err) {
    console.error('Error toggling featured:', err);
    res.status(500).json({ error: 'Failed to update article status' });
  }
});

// Duplicate an article
app.post('/api/admin/blogs/:id/duplicate', adminAuthMiddleware, async (req, res) => {
  try {
    const result = await dbAdapter.getBlogByIdOrSlug(req.params.id);
    if (!result || !result.blog) {
      return res.status(404).json({ error: 'Original blog not found' });
    }

    const original = result.blog;
    const duplicatedBlog = await dbAdapter.createBlog({
      title: `${original.title} (Copy)`,
      slug: `${original.slug}-copy-${Date.now().toString(36)}`,
      category: original.category,
      categoryId: original.categoryId,
      excerpt: original.excerpt,
      content: original.content,
      author: original.author,
      coverImage: original.coverImage,
      readTime: original.readTime,
      tags: original.tags,
      featured: false
    });

    res.status(201).json({ success: true, blog: duplicatedBlog, message: 'Article duplicated successfully' });
  } catch (err) {
    console.error('Error duplicating blog:', err);
    res.status(500).json({ error: 'Failed to duplicate article' });
  }
});

// ----------------------------------------------------
// SETTINGS ENDPOINTS
// ----------------------------------------------------
// Public read site settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await dbAdapter.getSettings();
    res.json({ settings });
  } catch (err) {
    console.error('Error loading settings:', err);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// Admin update site settings
app.put('/api/admin/settings', adminAuthMiddleware, async (req, res) => {
  try {
    const { siteName, tagline, contactEmail, youtubeUrl, announcementBanner, showBanner, accentTheme } = req.body;
    const payload = {};
    if (siteName !== undefined) payload.siteName = siteName.trim();
    if (tagline !== undefined) payload.tagline = tagline.trim();
    if (contactEmail !== undefined) payload.contactEmail = contactEmail.trim();
    if (youtubeUrl !== undefined) payload.youtubeUrl = youtubeUrl.trim();
    if (announcementBanner !== undefined) payload.announcementBanner = announcementBanner.trim();
    if (showBanner !== undefined) payload.showBanner = Boolean(showBanner);
    if (accentTheme !== undefined) payload.accentTheme = accentTheme.trim();

    const updated = await dbAdapter.updateSettings(payload);
    res.json({ success: true, settings: updated, message: 'System settings saved successfully' });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ----------------------------------------------------
// FULL DATABASE BACKUP & EXPORT
// ----------------------------------------------------
app.get('/api/admin/export', adminAuthMiddleware, async (req, res) => {
  try {
    const data = await dbAdapter.exportAllData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=insight-hub-backup-${Date.now()}.json`);
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error exporting database:', err);
    res.status(500).json({ error: 'Failed to export database' });
  }
});

// ----------------------------------------------------
// ADMIN STATS & ANALYTICS ENDPOINT
// ----------------------------------------------------
app.get('/api/admin/stats', adminAuthMiddleware, async (req, res) => {
  try {
    const stats = await dbAdapter.getStats();
    res.json(stats);
  } catch (err) {
    console.error('Error generating stats:', err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// ----------------------------------------------------
// HTML ROUTES
// ----------------------------------------------------
// Secret Admin Route (No link on website, accessed directly via /admin)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin.html'));
});

// Fallback to SPA index
app.use((req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Start Server in local Node.js environment
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`✨ THE INSIGHT HUB IS LIVE!`);
    console.log(`💻 Local (PC):    http://localhost:${PORT}`);
    
    // Find Local Network IP
    const nets = os.networkInterfaces();
    const networkIps = [];
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          networkIps.push(net.address);
        }
      }
    }

    networkIps.forEach(ip => {
      console.log(`📱 Mobile (Phone): http://${ip}:${PORT}`);
      console.log(`🔒 Secret Admin:  http://${ip}:${PORT}/admin`);
    });
    console.log(`======================================================\n`);
  });
}

module.exports = app;
