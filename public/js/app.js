/**
 * The Insight Hub - Public Frontend Controller
 */

// State
let allBlogs = [];
let activeCategory = 'all';
let searchQuery = '';
let currentSort = 'newest';
let currentActiveBlog = null;

// DOM Elements
const blogsGrid = document.getElementById('blogsGrid');
const categoryChips = document.getElementById('categoryChips');
const searchInput = document.getElementById('blogSearchInput');
const sortSelect = document.getElementById('sortSelect');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileDrawer = document.getElementById('mobileDrawer');
const readerModalOverlay = document.getElementById('readerModalOverlay');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const contactForm = document.getElementById('contactForm');
const toastContainer = document.getElementById('toastContainer');
const starPicker = document.getElementById('starPicker');
const selectedRatingInput = document.getElementById('selectedRating');
const submitReviewForm = document.getElementById('submitReviewForm');

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSplashScreen(); // Show welcome animation first
  setupEventListeners();
  initCategoryMouseSlider(); // Mouse-pointer auto-slide & drag for categories
  loadBlogs();
});

// ----------------------------------------------------
// CATEGORY MOUSE-POINTER AUTO-SLIDER & DRAG SCROLLER
// ----------------------------------------------------
function initCategoryMouseSlider() {
  const container = document.getElementById('categoryChips');
  if (!container) return;

  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let isHovering = false;
  let targetScroll = container.scrollLeft;
  let animationFrameId = null;

  // Smooth interpolation loop for ultra-fluid 60+ FPS motion
  function smoothScrollLoop() {
    if (isHovering && !isDown) {
      const current = container.scrollLeft;
      const diff = targetScroll - current;
      if (Math.abs(diff) > 0.5) {
        container.scrollLeft += diff * 0.12; // Smooth damping
      }
    }
    animationFrameId = requestAnimationFrame(smoothScrollLoop);
  }
  animationFrameId = requestAnimationFrame(smoothScrollLoop);

  // 1. Mouse Move Slide with Pointer
  container.addEventListener('mousemove', (e) => {
    if (isDown) return; // Prioritize drag if actively dragging
    isHovering = true;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left; // X position inside container
    const width = rect.width;
    const scrollWidth = container.scrollWidth - width;

    if (scrollWidth > 0) {
      // Calculate relative percentage (0 to 1) with slight edge buffer for comfort
      const ratio = Math.max(0, Math.min(1, (x - 20) / (width - 40)));
      targetScroll = ratio * scrollWidth;
    }
  });

  container.addEventListener('mouseleave', () => {
    isHovering = false;
    isDown = false;
  });

  container.addEventListener('mouseenter', () => {
    isHovering = true;
    targetScroll = container.scrollLeft;
  });

  // 2. Mouse Drag-to-Scroll Support
  container.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });

  window.addEventListener('mouseup', () => {
    isDown = false;
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.6; // Scroll speed factor
    container.scrollLeft = scrollLeft - walk;
    targetScroll = container.scrollLeft;
  });

  // 3. Mouse Wheel Tilt Horizontal Scroll (No shift needed)
  container.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      container.scrollLeft += e.deltaY * 0.8;
      targetScroll = container.scrollLeft;
    }
  }, { passive: false });
}

// ----------------------------------------------------
// 3D CARD INTERACTIVE TILT ANIMATION
// ----------------------------------------------------
function apply3DTiltToCards() {
  const cards = document.querySelectorAll('.blog-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
    });
  });
}

// ----------------------------------------------------
// SPLASH / INTRO WELCOME ANIMATION CONTROLLER
// ----------------------------------------------------
function initSplashScreen() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;

  const SPLASH_DURATION = 3300;
  const EXIT_DURATION = 700;

  setTimeout(() => {
    splash.classList.add('exit');

    setTimeout(() => {
      splash.remove();
      document.body.classList.add('page-loaded');
    }, EXIT_DURATION);

  }, SPLASH_DURATION);
}

// ----------------------------------------------------
// THEME SWITCHER (Dark & Light Mode)
// ----------------------------------------------------
function initTheme() {
  const savedTheme = localStorage.getItem('insight_hub_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('insight_hub_theme', newTheme);
  updateThemeIcon(newTheme);
  showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
}

// ----------------------------------------------------
// MOBILE MENU TOGGLING
// ----------------------------------------------------
function toggleMobileMenu() {
  const isOpen = mobileDrawer.classList.contains('open');
  if (isOpen) {
    mobileDrawer.classList.remove('open');
    hamburgerBtn.classList.remove('active');
  } else {
    mobileDrawer.classList.add('open');
    hamburgerBtn.classList.add('active');
  }
}

// ----------------------------------------------------
// EVENT LISTENERS
// ----------------------------------------------------
function setupEventListeners() {
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', toggleMobileMenu);
  }

  // Category Filter Chips
  if (categoryChips) {
    categoryChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.category-chip');
      if (!chip) return;

      document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.getAttribute('data-category');
      loadBlogs();
    });
  }

  // Search Input with Debounce
  let debounceTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        searchQuery = e.target.value.trim();
        loadBlogs();
      }, 250);
    });
  }

  // Quick nav search button
  const navSearchBtn = document.getElementById('navSearchBtn');
  if (navSearchBtn) {
    navSearchBtn.addEventListener('click', () => {
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      searchInput.focus();
    });
  }

  // Sort Selection
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      loadBlogs();
    });
  }

  // Modal Close
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeReaderModal);
  }

  if (readerModalOverlay) {
    readerModalOverlay.addEventListener('click', (e) => {
      if (e.target === readerModalOverlay) {
        closeReaderModal();
      }
    });
  }

  // Close modal on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && readerModalOverlay.classList.contains('active')) {
      closeReaderModal();
    }
  });

  // Star Rating Selector
  if (starPicker) {
    const stars = starPicker.querySelectorAll('.star-pick');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.getAttribute('data-rating'), 10);
        selectedRatingInput.value = rating;
        updateStarPicker(rating);
      });

      star.addEventListener('mouseenter', () => {
        const rating = parseInt(star.getAttribute('data-rating'), 10);
        highlightStars(rating);
      });
    });

    starPicker.addEventListener('mouseleave', () => {
      const current = parseInt(selectedRatingInput.value, 10);
      updateStarPicker(current);
    });
  }

  // Submit Review Form
  if (submitReviewForm) {
    submitReviewForm.addEventListener('submit', handleReviewSubmit);
  }

  // Contact Form
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }

  // Like button inside reader modal
  const readerLikeBtn = document.getElementById('readerLikeBtn');
  if (readerLikeBtn) {
    readerLikeBtn.addEventListener('click', handleReaderLike);
  }

  // Share button inside reader modal
  const readerShareBtn = document.getElementById('readerShareBtn');
  if (readerShareBtn) {
    readerShareBtn.addEventListener('click', handleShareArticle);
  }
}

function updateStarPicker(rating) {
  const stars = document.querySelectorAll('.star-pick');
  stars.forEach(star => {
    const starVal = parseInt(star.getAttribute('data-rating'), 10);
    if (starVal <= rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

function highlightStars(rating) {
  const stars = document.querySelectorAll('.star-pick');
  stars.forEach(star => {
    const starVal = parseInt(star.getAttribute('data-rating'), 10);
    if (starVal <= rating) {
      star.style.color = '#fbbf24';
    } else {
      star.style.color = 'var(--text-muted)';
    }
  });
}

// ----------------------------------------------------
// FETCH & RENDER BLOGS
// ----------------------------------------------------
async function loadBlogs() {
  try {
    blogsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem; animation: spin 1.5s linear infinite; display: inline-block;">✨</div>
        <p>Loading the latest tech insights...</p>
      </div>
    `;

    const params = new URLSearchParams();
    if (activeCategory && activeCategory !== 'all') {
      params.append('category', activeCategory);
    }
    if (searchQuery) {
      params.append('search', searchQuery);
    }
    if (currentSort) {
      params.append('sort', currentSort);
    }

    const response = await fetch(`/api/blogs?${params.toString()}`);
    const data = await response.json();

    allBlogs = data.blogs || [];

    // Update stats dynamically if available
    const statArticles = document.getElementById('statArticles');
    if (statArticles && allBlogs.length > 0) {
      statArticles.textContent = `${allBlogs.length * 20}+`;
    }

    renderBlogs(allBlogs);
  } catch (err) {
    console.error('Error loading blogs:', err);
    blogsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #ef4444;">
        <p>⚠️ Unable to load blogs right now. Please try again.</p>
      </div>
    `;
  }
}

function renderBlogs(blogs) {
  if (!blogs || blogs.length === 0) {
    blogsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
        <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem;">No matching articles found</h3>
        <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto 1.5rem auto;">
          Try searching with different keywords or selecting another category.
        </p>
        <button class="btn-primary" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  blogsGrid.innerHTML = blogs.map(blog => {
    const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <article class="blog-card" data-id="${blog.id}">
        <div class="card-image-wrap">
          <img class="card-img" src="${blog.coverImage}" alt="${escapeHtml(blog.title)}" loading="lazy">
          <span class="card-category-badge">${escapeHtml(blog.category)}</span>
          <span class="card-read-time">⏱️ ${escapeHtml(blog.readTime || '5 min read')}</span>
        </div>

        <div class="card-body">
          <h3 class="card-title" onclick="openBlogReader('${blog.id}')" style="cursor: pointer;">${escapeHtml(blog.title)}</h3>
          <p class="card-excerpt">${escapeHtml(blog.excerpt)}</p>

          <div class="card-meta-row">
            <div class="author-info">
              <img class="author-avatar" src="${blog.author.avatar}" alt="${escapeHtml(blog.author.name)}">
              <div>
                <div class="author-name">${escapeHtml(blog.author.name)}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${formattedDate}</div>
              </div>
            </div>

            <div class="card-ratings-views">
              <div class="star-rating-pill" title="${blog.avgRating} average rating from ${blog.reviewCount} reviews">
                <span>⭐</span>
                <span>${blog.avgRating}</span>
                <span style="font-size:0.75rem; color:var(--text-muted);">(${blog.reviewCount})</span>
              </div>
            </div>
          </div>

          <div class="card-actions-bar">
            <button class="btn-read-more" onclick="openBlogReader('${blog.id}')">
              <span>Read Insight</span>
              <span>→</span>
            </button>

            <button class="btn-like-heart" onclick="likeBlog('${blog.id}', event)">
              <span>❤️</span>
              <span id="card-like-${blog.id}">${blog.likes || 0}</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  apply3DTiltToCards();
}

function filterByCategory(categoryId) {
  activeCategory = categoryId;
  document.querySelectorAll('.category-chip').forEach(chip => {
    if (chip.getAttribute('data-category') === categoryId) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  const exploreSec = document.getElementById('explore');
  if (exploreSec) {
    exploreSec.scrollIntoView({ behavior: 'smooth' });
  }

  loadBlogs();
}

function resetFilters() {
  activeCategory = 'all';
  searchQuery = '';
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.category-chip[data-category="all"]').classList.add('active');
  loadBlogs();
}

// ----------------------------------------------------
// BLOG READER MODAL & REVIEWS
// ----------------------------------------------------
async function openBlogReader(idOrSlug) {
  try {
    const response = await fetch(`/api/blogs/${idOrSlug}`);
    if (!response.ok) throw new Error('Failed to fetch blog');

    const data = await response.json();
    currentActiveBlog = data.blog;
    const reviews = data.reviews || [];

    // Populate Reader Modal
    document.getElementById('readerCoverImg').src = currentActiveBlog.coverImage;
    document.getElementById('readerCoverImg').alt = currentActiveBlog.title;
    document.getElementById('readerCategory').textContent = currentActiveBlog.category;
    document.getElementById('readerReadTime').textContent = `⏱️ ${currentActiveBlog.readTime}`;
    document.getElementById('readerViewsCount').textContent = `👁️ ${currentActiveBlog.views} views`;
    document.getElementById('readerTitle').textContent = currentActiveBlog.title;
    document.getElementById('readerAuthorAvatar').src = currentActiveBlog.author.avatar;
    document.getElementById('readerAuthorName').textContent = currentActiveBlog.author.name;
    document.getElementById('readerAuthorRole').textContent = currentActiveBlog.author.role;
    document.getElementById('readerLikeCount').textContent = currentActiveBlog.likes;

    // Render formatted content
    document.getElementById('readerArticleBody').innerHTML = formatArticleContent(currentActiveBlog.content);

    // Render Reviews
    renderReviews(reviews, currentActiveBlog);

    // Reset review form
    submitReviewForm.reset();
    selectedRatingInput.value = '5';
    updateStarPicker(5);

    // Show modal
    readerModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  } catch (err) {
    console.error('Error opening blog reader:', err);
    showToast('Failed to open article details.', 'error');
  }
}

function closeReaderModal() {
  readerModalOverlay.classList.remove('active');
  document.body.style.overflow = 'auto';
  currentActiveBlog = null;
}

function formatArticleContent(content) {
  if (!content) return '';

  let html = content
    // Headings
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Blockquote
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    // Bold / Italic
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Code blocks
    .replace(/```([a-z]*)\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    // Unordered lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>');

  const paragraphs = html.split(/\n\n+/);
  return paragraphs.map(p => {
    if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<block') || p.startsWith('<li>')) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

function renderReviews(reviews, blog) {
  const reviewsSummaryText = document.getElementById('reviewsSummaryText');
  const reviewsList = document.getElementById('reviewsList');

  const count = reviews.length;
  const avg = blog.avgRating || '5.0';
  reviewsSummaryText.textContent = `⭐ Average Rating: ${avg} (${count} review${count === 1 ? '' : 's'})`;

  if (reviews.length === 0) {
    reviewsList.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: var(--radius-md);">
        <p>No reviews yet for this article. Be the first to share your feedback!</p>
      </div>
    `;
    return;
  }

  reviewsList.innerHTML = reviews.map(rev => {
    const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);

    let adminReplyHtml = '';
    if (rev.adminReply) {
      const replyDate = rev.replyDate
        ? new Date(rev.replyDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

      adminReplyHtml = `
        <div class="admin-reply-box">
          <div class="admin-reply-header">
            <span class="admin-badge-icon">✓</span>
            <span>Insight Hub Editorial Team Response</span>
            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:400; margin-left:auto;">${replyDate}</span>
          </div>
          <div class="admin-reply-text">${escapeHtml(rev.adminReply)}</div>
        </div>
      `;
    }

    return `
      <div class="review-item">
        <div class="review-item-header">
          <div>
            <span class="reviewer-name">${escapeHtml(rev.userName)}</span>
            <div class="review-stars">${stars}</div>
          </div>
          <span class="review-date">${formattedDate}</span>
        </div>
        <p class="review-comment">${escapeHtml(rev.comment)}</p>
        ${adminReplyHtml}
      </div>
    `;
  }).join('');
}

// Handle User Review Submit
async function handleReviewSubmit(e) {
  e.preventDefault();
  if (!currentActiveBlog) return;

  const userName = document.getElementById('reviewUserName').value.trim();
  const userEmail = document.getElementById('reviewUserEmail').value.trim();
  const rating = parseInt(selectedRatingInput.value, 10) || 5;
  const comment = document.getElementById('reviewComment').value.trim();

  if (!userName || !comment) {
    showToast('Please enter your name and review comment.', 'error');
    return;
  }

  const submitBtn = document.getElementById('reviewSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>Submitting...</span>';

  try {
    const response = await fetch(`/api/blogs/${currentActiveBlog.id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, userEmail, rating, comment })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to submit review');

    showToast('🎉 Thank you for your review! It has been posted.', 'success');

    await openBlogReader(currentActiveBlog.id);
    loadBlogs();
  } catch (err) {
    console.error('Error submitting review:', err);
    showToast(err.message || 'Error submitting review.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Post Review</span><span>⭐</span>';
  }
}

// ----------------------------------------------------
// LIKE ARTICLE
// ----------------------------------------------------
async function likeBlog(blogId, event) {
  if (event) event.stopPropagation();

  try {
    const response = await fetch(`/api/blogs/${blogId}/like`, { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      const cardCounter = document.getElementById(`card-like-${blogId}`);
      if (cardCounter) {
        cardCounter.textContent = data.likes;
      }

      if (currentActiveBlog && currentActiveBlog.id === blogId) {
        document.getElementById('readerLikeCount').textContent = data.likes;
      }

      showToast('Liked this insight! ❤️', 'success');
    }
  } catch (err) {
    console.error('Error liking blog:', err);
  }
}

async function handleReaderLike() {
  if (!currentActiveBlog) return;
  await likeBlog(currentActiveBlog.id);
}

function handleShareArticle() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.origin + '#' + (currentActiveBlog ? currentActiveBlog.slug : ''));
    showToast('Article link copied to clipboard! 📋', 'success');
  } else {
    showToast('Link ready to share!', 'info');
  }
}

// ----------------------------------------------------
// CONTACT FORM SUBMISSION
// ----------------------------------------------------
async function handleContactSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const subject = document.getElementById('contactSubject').value.trim();
  const message = document.getElementById('contactMessage').value.trim();

  if (!name || !email || !message) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  const submitBtn = document.getElementById('contactSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>Sending Message...</span>';

  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send message');

    showToast('✉️ Message sent to Insight Hub team! We will reply soon.', 'success');
    contactForm.reset();
  } catch (err) {
    console.error('Error sending message:', err);
    showToast(err.message || 'Error sending message. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Send Message to Admin</span><span>✉️</span>';
  }
}

// ----------------------------------------------------
// TOAST NOTIFICATIONS
// ----------------------------------------------------
function showToast(message, type = 'info') {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

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
window.filterByCategory = filterByCategory;
window.resetFilters = resetFilters;
window.openBlogReader = openBlogReader;
window.likeBlog = likeBlog;
window.toggleMobileMenu = toggleMobileMenu;
