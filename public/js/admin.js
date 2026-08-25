/**
 * The Insight Hub - Enterprise Command Center Controller
 */

// State
let authToken = localStorage.getItem('insight_hub_admin_token') || '';
let currentTab = 'overview';
let adminBlogs = [];
let adminReviews = [];
let adminMessages = [];
let adminStatsData = null;
let activeViewingMessageId = null;

// DOM Elements
const loginOverlay = document.getElementById('loginOverlay');
const adminApp = document.getElementById('adminApp');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const adminThemeToggleBtn = document.getElementById('adminThemeToggleBtn');
const adminThemeIcon = document.getElementById('adminThemeIcon');
const blogEditorModalOverlay = document.getElementById('blogEditorModalOverlay');
const blogEditorForm = document.getElementById('blogEditorForm');
const reviewReplyModalOverlay = document.getElementById('reviewReplyModalOverlay');
const reviewReplyForm = document.getElementById('reviewReplyForm');
const messageViewModalOverlay = document.getElementById('messageViewModalOverlay');
const adminToastContainer = document.getElementById('adminToastContainer');
const adminSettingsForm = document.getElementById('adminSettingsForm');

// ----------------------------------------------------
// INITIALIZATION & AUTHENTICATION
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initAdminTheme();
  setupAdminEventListeners();
  checkAuth();
});

function initAdminTheme() {
  const savedTheme = localStorage.getItem('insight_hub_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (adminThemeIcon) {
    adminThemeIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
  }
}

function toggleAdminTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('insight_hub_theme', newTheme);
  if (adminThemeIcon) {
    adminThemeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
  }
}

async function checkAuth() {
  if (!authToken) {
    showLoginOverlay();
    return;
  }

  try {
    const res = await fetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();

    if (data.authenticated) {
      hideLoginOverlay();
      loadAllAdminData();
    } else {
      authToken = '';
      localStorage.removeItem('insight_hub_admin_token');
      showLoginOverlay();
    }
  } catch (err) {
    console.error('Auth verification error:', err);
    showLoginOverlay();
  }
}

function showLoginOverlay() {
  if (loginOverlay) loginOverlay.style.display = 'flex';
  if (adminApp) adminApp.style.display = 'none';
}

function hideLoginOverlay() {
  if (loginOverlay) loginOverlay.style.display = 'none';
  if (adminApp) adminApp.style.display = 'block';
}

// ----------------------------------------------------
// EVENT LISTENERS
// ----------------------------------------------------
function setupAdminEventListeners() {
  // Login Form Submission
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = adminPasswordInput.value;
      const submitBtn = document.getElementById('loginSubmitBtn');

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying...</span>';

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          authToken = data.token;
          localStorage.setItem('insight_hub_admin_token', authToken);
          showAdminToast('Access granted. Welcome Admin!', 'success');
          hideLoginOverlay();
          loadAllAdminData();
        } else {
          showAdminToast(data.error || 'Invalid admin password.', 'error');
          adminPasswordInput.value = '';
          adminPasswordInput.focus();
        }
      } catch (err) {
        console.error('Login error:', err);
        showAdminToast('Connection error. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Unlock Admin Center</span><span>⚡</span>';
      }
    });
  }

  // Toggle Password Visibility
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = adminPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      adminPasswordInput.setAttribute('type', type);
      togglePasswordBtn.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }

  // Logout
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async () => {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      }
      authToken = '';
      localStorage.removeItem('insight_hub_admin_token');
      showLoginOverlay();
      showAdminToast('Logged out securely.', 'info');
    });
  }

  // Theme
  if (adminThemeToggleBtn) {
    adminThemeToggleBtn.addEventListener('click', toggleAdminTheme);
  }

  // Tab Navigation
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchAdminTab(tabId);
    });
  });

  // Blog Search & Category Filter
  const adminBlogSearch = document.getElementById('adminBlogSearch');
  const adminCategoryFilter = document.getElementById('adminCategoryFilter');
  if (adminBlogSearch || adminCategoryFilter) {
    const handleFilterBlogs = () => {
      const query = (adminBlogSearch ? adminBlogSearch.value : '').toLowerCase().trim();
      const cat = adminCategoryFilter ? adminCategoryFilter.value : 'all';

      const filtered = adminBlogs.filter(b => {
        const matchesQuery = !query || b.title.toLowerCase().includes(query) || (b.tags && b.tags.some(t => t.toLowerCase().includes(query)));
        const matchesCat = cat === 'all' || b.category === cat;
        return matchesQuery && matchesCat;
      });
      renderAdminBlogsTable(filtered);
    };

    if (adminBlogSearch) adminBlogSearch.addEventListener('input', handleFilterBlogs);
    if (adminCategoryFilter) adminCategoryFilter.addEventListener('change', handleFilterBlogs);
  }

  // Review Rating Filter & Search
  const adminReviewRatingFilter = document.getElementById('adminReviewRatingFilter');
  const adminReviewSearch = document.getElementById('adminReviewSearch');
  if (adminReviewRatingFilter || adminReviewSearch) {
    const handleFilterReviews = () => {
      const rating = adminReviewRatingFilter ? adminReviewRatingFilter.value : 'all';
      const search = (adminReviewSearch ? adminReviewSearch.value : '').toLowerCase().trim();

      const filtered = adminReviews.filter(r => {
        const matchesRating = rating === 'all' || String(r.rating) === rating;
        const matchesSearch = !search || r.userName.toLowerCase().includes(search) || r.comment.toLowerCase().includes(search);
        return matchesRating && matchesSearch;
      });
      renderAdminReviewsTable(filtered);
    };

    if (adminReviewRatingFilter) adminReviewRatingFilter.addEventListener('change', handleFilterReviews);
    if (adminReviewSearch) adminReviewSearch.addEventListener('input', handleFilterReviews);
  }

  // Message Status Filter & Search
  const adminMessageStatusFilter = document.getElementById('adminMessageStatusFilter');
  const adminMessageSearch = document.getElementById('adminMessageSearch');
  if (adminMessageStatusFilter || adminMessageSearch) {
    const handleFilterMessages = () => {
      const status = adminMessageStatusFilter ? adminMessageStatusFilter.value : 'all';
      const search = (adminMessageSearch ? adminMessageSearch.value : '').toLowerCase().trim();

      const filtered = adminMessages.filter(m => {
        const matchesStatus = status === 'all' || (status === 'unread' && !m.read) || (status === 'read' && m.read);
        const matchesSearch = !search || m.name.toLowerCase().includes(search) || m.subject.toLowerCase().includes(search) || m.email.toLowerCase().includes(search);
        return matchesStatus && matchesSearch;
      });
      renderAdminMessagesTable(filtered);
    };

    if (adminMessageStatusFilter) adminMessageStatusFilter.addEventListener('change', handleFilterMessages);
    if (adminMessageSearch) adminMessageSearch.addEventListener('input', handleFilterMessages);
  }

  // Blog Editor Form
  if (blogEditorForm) {
    blogEditorForm.addEventListener('submit', handleSaveBlog);
  }

  // Review Reply Form
  if (reviewReplyForm) {
    reviewReplyForm.addEventListener('submit', handleSaveReviewReply);
  }

  // Settings Form
  if (adminSettingsForm) {
    adminSettingsForm.addEventListener('submit', handleSaveSettings);
  }

  // Delete message inside view modal
  const deleteCurrentMsgBtn = document.getElementById('deleteCurrentMsgBtn');
  if (deleteCurrentMsgBtn) {
    deleteCurrentMsgBtn.addEventListener('click', () => {
      if (activeViewingMessageId) {
        deleteMessage(activeViewingMessageId);
        closeMessageViewModal();
      }
    });
  }
}

function switchAdminTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  const activePanel = document.getElementById(`tab-${tabId}`);
  if (activePanel) {
    activePanel.classList.add('active');
  }
}

// ----------------------------------------------------
// LOAD ALL ADMIN DATA
// ----------------------------------------------------
async function loadAllAdminData() {
  await Promise.all([
    loadAdminStats(),
    loadAdminBlogs(),
    loadAdminReviews(),
    loadAdminMessages(),
    loadAdminSettings()
  ]);
}

// ----------------------------------------------------
// 1. STATS & ANALYTICS
// ----------------------------------------------------
async function loadAdminStats() {
  try {
    const res = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error('Failed to load stats');

    const data = await res.json();
    adminStatsData = data;

    document.getElementById('kpiBlogs').textContent = data.totalBlogs || 0;
    document.getElementById('kpiViews').textContent = (data.totalViews || 0).toLocaleString();
    document.getElementById('kpiReviews').textContent = data.totalReviews || 0;
    document.getElementById('kpiMessages').textContent = data.totalMessages || 0;

    const featuredSub = document.getElementById('kpiFeaturedSub');
    if (featuredSub) {
      featuredSub.textContent = `⭐ ${data.featuredCount || 0} Featured Articles`;
    }

    const avgRatingSub = document.getElementById('kpiAvgRating');
    if (avgRatingSub) {
      avgRatingSub.textContent = `Avg: ${data.avgRating || 5.0} ★ (${data.totalReviews} total ratings)`;
    }

    const unreadBadge = document.getElementById('unreadMessagesBadge');
    if (unreadBadge) {
      if (data.unreadMessages > 0) {
        unreadBadge.textContent = data.unreadMessages;
        unreadBadge.style.display = 'inline-block';
        document.getElementById('kpiUnreadMessages').textContent = `${data.unreadMessages} new unread inquiries!`;
      } else {
        unreadBadge.style.display = 'none';
        document.getElementById('kpiUnreadMessages').textContent = 'All inquiries responded';
      }
    }

    renderCategoryAnalytics(data.categoryCounts || {}, data.totalBlogs || 1);
    renderRatingAnalytics(data.ratingDistribution || {}, data.totalReviews || 1);
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

function renderCategoryAnalytics(counts, total) {
  const container = document.getElementById('categoryDistributionBars');
  if (!container) return;

  const entries = Object.entries(counts);
  if (entries.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size:0.9rem;">No articles in categories yet.</p>`;
    return;
  }

  container.innerHTML = entries.map(([category, count]) => {
    const pct = Math.round((count / (total || 1)) * 100);
    return `
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.35rem;">
          <span style="font-weight: 600;">${escapeHtml(category)}</span>
          <span style="color: var(--lime-light); font-weight: 700;">${count} articles (${pct}%)</span>
        </div>
        <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
          <div style="height: 100%; width: ${pct}%; background: var(--gradient-brand); border-radius: 4px;"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRatingAnalytics(distribution, total) {
  const container = document.getElementById('ratingDistributionBars');
  if (!container) return;

  const stars = [5, 4, 3, 2, 1];
  container.innerHTML = stars.map(star => {
    const count = distribution[star] || 0;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `
      <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem;">
        <span style="color: var(--yellow-neon); font-weight: 700; width: 45px;">${star} ★</span>
        <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
          <div style="height: 100%; width: ${pct}%; background: var(--gradient-emerald-yellow); border-radius: 4px;"></div>
        </div>
        <span style="color: var(--text-secondary); width: 35px; text-align: right; font-size: 0.8rem;">${count}</span>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------
// 2. BLOG MANAGEMENT & ACTIONS
// ----------------------------------------------------
async function loadAdminBlogs() {
  try {
    const res = await fetch('/api/blogs');
    const data = await res.json();

    adminBlogs = data.blogs || [];

    const badge = document.getElementById('blogsCountBadge');
    if (badge) badge.textContent = adminBlogs.length;

    renderAdminBlogsTable(adminBlogs);
  } catch (err) {
    console.error('Error loading admin blogs:', err);
  }
}

function renderAdminBlogsTable(blogs) {
  const tbody = document.getElementById('adminBlogsTableBody');
  if (!tbody) return;

  if (blogs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">
          No articles found matching filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = blogs.map(blog => {
    const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <tr>
        <td>
          <img class="table-thumb" src="${blog.coverImage}" alt="${escapeHtml(blog.title)}">
        </td>
        <td>
          <div style="font-weight: 700; max-width: 260px;">${escapeHtml(blog.title)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">By ${escapeHtml(blog.author?.name || 'Admin')} · ⏱️ ${escapeHtml(blog.readTime || '5 min read')}</div>
        </td>
        <td>
          <span class="card-category-badge" style="position:static; display:inline-block;">${escapeHtml(blog.category)}</span>
        </td>
        <td>
          ${blog.featured 
            ? '<span style="background:rgba(234,179,8,0.15); color:var(--yellow-neon); border:1px solid rgba(234,179,8,0.4); padding:0.2rem 0.6rem; border-radius:99px; font-size:0.75rem; font-weight:700;">⭐ Featured</span>'
            : '<span style="background:rgba(16,185,129,0.12); color:var(--lime-light); border:1px solid rgba(16,185,129,0.3); padding:0.2rem 0.6rem; border-radius:99px; font-size:0.75rem; font-weight:600;">🟢 Standard</span>'}
        </td>
        <td>
          <div style="font-size:0.82rem; line-height: 1.4;">
            <div>👁️ ${blog.views || 0} views</div>
            <div style="color:var(--text-secondary);">❤️ ${blog.likes || 0} · ⭐ ${blog.avgRating || 5.0}</div>
          </div>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${formattedDate}</td>
        <td>
          <div class="btn-action-group">
            <button class="btn-sm btn-sm-edit" onclick="openEditBlogModal('${blog.id}')" title="Edit Article">
              <span>✏️ Edit</span>
            </button>
            <button class="btn-sm" style="background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.35); color:var(--yellow-neon);" onclick="toggleFeaturedBlog('${blog.id}')" title="Toggle Featured">
              <span>${blog.featured ? '★ Star' : '☆ Pin'}</span>
            </button>
            <button class="btn-sm" style="background:rgba(255,255,255,0.06); border:1px solid var(--border-subtle);" onclick="duplicateBlog('${blog.id}')" title="Duplicate Article">
              <span>📋</span>
            </button>
            <button class="btn-sm btn-sm-delete" onclick="deleteBlog('${blog.id}')" title="Delete Article">
              <span>🗑️</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function toggleFeaturedBlog(blogId) {
  try {
    const res = await fetch(`/api/admin/blogs/${blogId}/toggle-featured`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle featured status');

    showAdminToast(data.message || 'Featured status updated!', 'success');
    loadAllAdminData();
  } catch (err) {
    console.error('Error toggling featured:', err);
    showAdminToast(err.message, 'error');
  }
}

async function duplicateBlog(blogId) {
  try {
    const res = await fetch(`/api/admin/blogs/${blogId}/duplicate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to duplicate article');

    showAdminToast('Article duplicated as new copy!', 'success');
    loadAllAdminData();
  } catch (err) {
    console.error('Error duplicating blog:', err);
    showAdminToast(err.message, 'error');
  }
}

function openCreateBlogModal() {
  blogEditorForm.reset();
  document.getElementById('blogEditorId').value = '';
  document.getElementById('blogEditorModalTitle').textContent = 'Create New Tech Article';
  document.getElementById('blogFormAuthorName').value = 'Insight Hub Team';
  document.getElementById('blogFormReadTime').value = '5 min read';
  document.getElementById('blogFormCoverImage').value = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80';

  blogEditorModalOverlay.classList.add('active');
}

function openEditBlogModal(blogId) {
  const blog = adminBlogs.find(b => b.id === blogId);
  if (!blog) return;

  document.getElementById('blogEditorId').value = blog.id;
  document.getElementById('blogEditorModalTitle').textContent = 'Edit Tech Article';
  document.getElementById('blogFormTitle').value = blog.title;
  document.getElementById('blogFormCategory').value = blog.category;
  document.getElementById('blogFormReadTime').value = blog.readTime || '5 min read';
  document.getElementById('blogFormCoverImage').value = blog.coverImage;
  document.getElementById('blogFormExcerpt').value = blog.excerpt;
  document.getElementById('blogFormContent').value = blog.content;
  document.getElementById('blogFormAuthorName').value = blog.author?.name || 'Admin';
  document.getElementById('blogFormTags').value = (blog.tags || []).join(', ');

  blogEditorModalOverlay.classList.add('active');
}

function closeBlogEditorModal() {
  blogEditorModalOverlay.classList.remove('active');
}

function setCoverPreset(type) {
  const coverInput = document.getElementById('blogFormCoverImage');
  if (type === 'ai') {
    coverInput.value = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80';
  } else if (type === 'cyber') {
    coverInput.value = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80';
  } else if (type === 'code') {
    coverInput.value = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80';
  }
}

async function handleSaveBlog(e) {
  e.preventDefault();

  const id = document.getElementById('blogEditorId').value;
  const title = document.getElementById('blogFormTitle').value.trim();
  const category = document.getElementById('blogFormCategory').value;
  const readTime = document.getElementById('blogFormReadTime').value.trim() || '5 min read';
  const coverImage = document.getElementById('blogFormCoverImage').value.trim();
  const excerpt = document.getElementById('blogFormExcerpt').value.trim();
  const content = document.getElementById('blogFormContent').value.trim();
  const authorName = document.getElementById('blogFormAuthorName').value.trim() || 'Admin';
  const tags = document.getElementById('blogFormTags').value.trim();

  const isEditing = Boolean(id);
  const url = isEditing ? `/api/blogs/${id}` : '/api/blogs';
  const method = isEditing ? 'PUT' : 'POST';

  const saveBtn = document.getElementById('saveBlogBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span>Saving...</span>';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title,
        category,
        readTime,
        coverImage,
        excerpt,
        content,
        authorName,
        tags
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save blog');

    showAdminToast(isEditing ? 'Article updated successfully!' : 'New article published!', 'success');
    closeBlogEditorModal();
    loadAllAdminData();
  } catch (err) {
    console.error('Error saving blog:', err);
    showAdminToast(err.message || 'Error saving article.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span>Save Article</span><span>💾</span>';
  }
}

async function deleteBlog(blogId) {
  if (!confirm('Are you sure you want to delete this blog post and all its reviews? This action cannot be undone.')) {
    return;
  }

  try {
    const res = await fetch(`/api/blogs/${blogId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete blog');

    showAdminToast('Article deleted successfully.', 'info');
    loadAllAdminData();
  } catch (err) {
    console.error('Error deleting blog:', err);
    showAdminToast(err.message || 'Failed to delete article.', 'error');
  }
}

// ----------------------------------------------------
// 3. REVIEW MODERATION & REPLIES
// ----------------------------------------------------
async function loadAdminReviews() {
  try {
    const res = await fetch('/api/admin/reviews', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();

    adminReviews = data.reviews || [];

    const badge = document.getElementById('reviewsCountBadge');
    if (badge) badge.textContent = adminReviews.length;

    renderAdminReviewsTable(adminReviews);
  } catch (err) {
    console.error('Error loading reviews:', err);
  }
}

function renderAdminReviewsTable(reviews) {
  const tbody = document.getElementById('adminReviewsTableBody');
  if (!tbody) return;

  if (reviews.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">
          No reader reviews matching filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = reviews.map(rev => {
    const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
    const hasReply = Boolean(rev.adminReply);

    return `
      <tr>
        <td>
          <div style="font-weight: 600; font-size: 0.85rem; max-width: 200px;">${escapeHtml(rev.blogTitle)}</div>
        </td>
        <td>
          <div style="font-weight: 700;">${escapeHtml(rev.userName)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(rev.userEmail || 'No email')}</div>
        </td>
        <td>
          <span style="color: var(--yellow-neon); font-weight:700;">${stars}</span>
        </td>
        <td>
          <div style="max-width: 260px; font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(rev.comment)}</div>
        </td>
        <td>
          ${hasReply
            ? `<span style="color:var(--lime-light); font-size:0.8rem; font-weight:700;">✓ Replied</span>`
            : `<span style="color:var(--text-muted); font-size:0.8rem;">⏳ Pending</span>`
          }
        </td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${formattedDate}</td>
        <td>
          <div class="btn-action-group">
            <button class="btn-sm btn-sm-reply" onclick="openReviewReplyModal('${rev.id}')">
              <span>${hasReply ? 'Edit Reply' : '💬 Reply'}</span>
            </button>
            <button class="btn-sm btn-sm-delete" onclick="deleteReview('${rev.id}')">
              <span>🗑️</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openReviewReplyModal(reviewId) {
  const rev = adminReviews.find(r => r.id === reviewId);
  if (!rev) return;

  document.getElementById('replyReviewId').value = rev.id;
  document.getElementById('modalReviewerName').textContent = rev.userName;
  document.getElementById('modalReviewRating').textContent = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
  document.getElementById('modalReviewComment').textContent = rev.comment;
  document.getElementById('adminReplyText').value = rev.adminReply || 'Thank you for your review! We appreciate your insights.';

  reviewReplyModalOverlay.classList.add('active');
}

function closeReviewReplyModal() {
  reviewReplyModalOverlay.classList.remove('active');
}

async function handleSaveReviewReply(e) {
  e.preventDefault();

  const reviewId = document.getElementById('replyReviewId').value;
  const reply = document.getElementById('adminReplyText').value.trim();

  try {
    const res = await fetch(`/api/admin/reviews/${reviewId}/reply`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ reply })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save reply');

    showAdminToast('Official response published to article!', 'success');
    closeReviewReplyModal();
    loadAdminReviews();
  } catch (err) {
    console.error('Error saving review reply:', err);
    showAdminToast(err.message || 'Error saving reply.', 'error');
  }
}

async function deleteReview(reviewId) {
  if (!confirm('Are you sure you want to permanently delete this review?')) return;

  try {
    const res = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete review');

    showAdminToast('Review deleted.', 'info');
    loadAllAdminData();
  } catch (err) {
    console.error('Error deleting review:', err);
    showAdminToast(err.message || 'Failed to delete review.', 'error');
  }
}

// ----------------------------------------------------
// 4. CONTACT INQUIRIES & CRM
// ----------------------------------------------------
async function loadAdminMessages() {
  try {
    const res = await fetch('/api/admin/messages', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();

    adminMessages = data.messages || [];

    renderAdminMessagesTable(adminMessages);
    renderOverviewRecentMessages(adminMessages.slice(0, 5));
  } catch (err) {
    console.error('Error loading messages:', err);
  }
}

function renderAdminMessagesTable(messages) {
  const tbody = document.getElementById('adminMessagesTableBody');
  if (!tbody) return;

  if (messages.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">
          No contact inquiries found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = messages.map(msg => {
    const formattedDate = new Date(msg.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <tr style="${!msg.read ? 'font-weight: 600; background: rgba(16, 185, 129, 0.05);' : ''}">
        <td>
          ${!msg.read ? '<span class="unread-dot" style="background:var(--lime-light); box-shadow: 0 0 8px var(--lime-light);"></span><span style="color:var(--lime-light); font-size:0.78rem;">NEW</span>' : '<span style="color:var(--text-muted); font-size:0.78rem;">READ</span>'}
        </td>
        <td>
          <div>${escapeHtml(msg.name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(msg.email)}</div>
        </td>
        <td>
          <div style="max-width: 200px;">${escapeHtml(msg.subject)}</div>
        </td>
        <td>
          <div style="max-width: 280px; font-size: 0.85rem; color: var(--text-secondary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
            ${escapeHtml(msg.message)}
          </div>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${formattedDate}</td>
        <td>
          <div class="btn-action-group">
            <button class="btn-sm btn-sm-edit" onclick="openMessageView('${msg.id}')">
              <span>👁️ View</span>
            </button>
            <button class="btn-sm btn-sm-delete" onclick="deleteMessage('${msg.id}')">
              <span>🗑️</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderOverviewRecentMessages(messages) {
  const container = document.getElementById('overviewRecentMessages');
  if (!container) return;

  if (messages.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No messages yet.</p>`;
    return;
  }

  container.innerHTML = messages.map(msg => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-subtle); cursor: pointer;" onclick="openMessageView('${msg.id}')">
      <div>
        <div style="font-weight: 700; font-size: 0.9rem;">
          ${!msg.read ? '🟢 ' : ''}${escapeHtml(msg.name)} 
          <span style="font-weight:400; color:var(--text-muted); font-size:0.8rem;">- ${escapeHtml(msg.subject)}</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(msg.message.substring(0, 70))}...</div>
      </div>
      <span style="font-size: 0.75rem; color: var(--text-muted);">${new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
    </div>
  `).join('');
}

async function openMessageView(msgId) {
  const msg = adminMessages.find(m => m.id === msgId);
  if (!msg) return;

  activeViewingMessageId = msg.id;

  document.getElementById('viewMsgSubject').textContent = msg.subject;
  document.getElementById('viewMsgSender').textContent = msg.name;
  document.getElementById('viewMsgEmail').textContent = msg.email;
  document.getElementById('viewMsgDate').textContent = new Date(msg.createdAt).toLocaleString();
  document.getElementById('viewMsgBody').textContent = msg.message;

  const mailtoBtn = document.getElementById('replyViaEmailBtn');
  mailtoBtn.href = `mailto:${encodeURIComponent(msg.email)}?subject=${encodeURIComponent('Re: ' + msg.subject + ' [Insight Hub]')}`;

  messageViewModalOverlay.classList.add('active');

  // Mark as read in backend
  if (!msg.read) {
    msg.read = true;
    try {
      await fetch(`/api/admin/messages/${msg.id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ read: true })
      });
      loadAdminStats();
      renderAdminMessagesTable(adminMessages);
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }
}

function closeMessageViewModal() {
  messageViewModalOverlay.classList.remove('active');
  activeViewingMessageId = null;
}

async function deleteMessage(msgId) {
  if (!confirm('Delete this message from your inbox?')) return;

  try {
    const res = await fetch(`/api/admin/messages/${msgId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete message');

    showAdminToast('Message deleted.', 'info');
    loadAllAdminData();
  } catch (err) {
    console.error('Error deleting message:', err);
    showAdminToast(err.message || 'Failed to delete message.', 'error');
  }
}

// ----------------------------------------------------
// 5. SITE SETTINGS & BACKUP HUB
// ----------------------------------------------------
async function loadAdminSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    const s = data.settings || {};

    if (document.getElementById('settingSiteName')) document.getElementById('settingSiteName').value = s.siteName || 'Insight Hub';
    if (document.getElementById('settingTagline')) document.getElementById('settingTagline').value = s.tagline || '';
    if (document.getElementById('settingContactEmail')) document.getElementById('settingContactEmail').value = s.contactEmail || 'asitech5info@gmail.com';
    if (document.getElementById('settingYoutubeUrl')) document.getElementById('settingYoutubeUrl').value = s.youtubeUrl || 'https://www.youtube.com/@howtech_works';
    if (document.getElementById('settingAnnouncementBanner')) document.getElementById('settingAnnouncementBanner').value = s.announcementBanner || '';
  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

async function handleSaveSettings(e) {
  e.preventDefault();

  const siteName = document.getElementById('settingSiteName').value.trim();
  const tagline = document.getElementById('settingTagline').value.trim();
  const contactEmail = document.getElementById('settingContactEmail').value.trim();
  const youtubeUrl = document.getElementById('settingYoutubeUrl').value.trim();
  const announcementBanner = document.getElementById('settingAnnouncementBanner').value.trim();

  const btn = document.getElementById('saveSettingsBtn');
  btn.disabled = true;
  btn.innerHTML = '<span>Saving...</span>';

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        siteName,
        tagline,
        contactEmail,
        youtubeUrl,
        announcementBanner
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save settings');

    showAdminToast('Website configuration saved successfully!', 'success');
  } catch (err) {
    console.error('Error saving settings:', err);
    showAdminToast(err.message || 'Error saving settings.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Save Configuration</span><span>💾</span>';
  }
}

// ----------------------------------------------------
// TOAST NOTIFICATIONS
// ----------------------------------------------------
function showAdminToast(message, type = 'info') {
  if (!adminToastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  adminToastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Utility: Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Expose globals for inline onclicks
window.switchAdminTab = switchAdminTab;
window.openCreateBlogModal = openCreateBlogModal;
window.openEditBlogModal = openEditBlogModal;
window.closeBlogEditorModal = closeBlogEditorModal;
window.setCoverPreset = setCoverPreset;
window.deleteBlog = deleteBlog;
window.toggleFeaturedBlog = toggleFeaturedBlog;
window.duplicateBlog = duplicateBlog;
window.openReviewReplyModal = openReviewReplyModal;
window.closeReviewReplyModal = closeReviewReplyModal;
window.deleteReview = deleteReview;
window.openMessageView = openMessageView;
window.closeMessageViewModal = closeMessageViewModal;
window.deleteMessage = deleteMessage;
