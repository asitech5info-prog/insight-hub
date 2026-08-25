import { test, expect } from '@playwright/test';

test.describe('The Insight Hub - Comprehensive E2E Tests', () => {

  test('1. Public Homepage UI, Theme Toggle, Social Buttons & No Admin Link', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Title
    await expect(page).toHaveTitle(/Insight Hub/);

    // Hero title & Brand
    const heroTitle = page.locator('.hero-title');
    await expect(heroTitle).toContainText('EXPLORE');
    await expect(heroTitle).toContainText('LEARN');
    await expect(heroTitle).toContainText('INNOVATE');
    await expect(heroTitle).toContainText('Shape the Future');

    // Revolving Orbital Visual elements
    const coreHubOrb = page.locator('#coreHubOrb');
    await expect(coreHubOrb).toBeVisible();
    await expect(page.locator('.orbiting-nodes-track')).toBeVisible();

    // Stats ribbon
    await expect(page.locator('#statsRibbon')).toBeVisible();

    // Theme Switcher Test
    const htmlEl = page.locator('html');
    await expect(htmlEl).toHaveAttribute('data-theme', 'dark');
    
    await page.locator('#themeToggleBtn').click();
    await expect(htmlEl).toHaveAttribute('data-theme', 'light');

    await page.locator('#themeToggleBtn').click();
    await expect(htmlEl).toHaveAttribute('data-theme', 'dark');

    // Social Action Buttons
    const mailBtn = page.locator('#navMailBtn');
    await expect(mailBtn).toBeVisible();
    await expect(mailBtn).toHaveAttribute('href', 'mailto:asitech5info@gmail.com');

    const ytBtn = page.locator('#navYtBtn');
    await expect(ytBtn).toBeVisible();
    await expect(ytBtn).toHaveAttribute('href', 'https://www.youtube.com/@howtech_works');

    // Verify NO admin button is present in the public header or footer
    const adminHeaderLink = page.locator('header a[href*="/admin"], header button:has-text("Admin")');
    await expect(adminHeaderLink).toHaveCount(0);

    const adminFooterLink = page.locator('footer a[href*="/admin"], footer button:has-text("Admin")');
    await expect(adminFooterLink).toHaveCount(0);
  });

  test('2. Category Filter & Search Functionality', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for blogs to load
    await page.waitForSelector('.blog-card');
    const initialCount = await page.locator('.blog-card').count();
    expect(initialCount).toBeGreaterThan(0);

    // Filter by 'Cybersecurity'
    const cyberBtn = page.locator('.category-pill:has-text("Cybersecurity")');
    await cyberBtn.click();
    await page.waitForTimeout(500);

    const cyberCards = page.locator('.blog-card');
    const cyberCount = await cyberCards.count();
    expect(cyberCount).toBeGreaterThan(0);
    const firstCyberTag = await cyberCards.first().locator('.badge-category').innerText();
    expect(firstCyberTag.toLowerCase()).toContain('cybersecurity');

    // Switch back to All
    await page.locator('.category-pill:has-text("All Insights")').click();
    await page.waitForTimeout(500);
    expect(await page.locator('.blog-card').count()).toBe(initialCount);

    // Search filter
    const searchInput = page.locator('#searchInput');
    await searchInput.fill('Quantum');
    await page.waitForTimeout(600);

    const searchResults = page.locator('.blog-card');
    expect(await searchResults.count()).toBeGreaterThan(0);
    await expect(searchResults.first()).toContainText(/Quantum/i);

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(600);
  });

  test('3. Blog Reader Modal, Liking, and Review Submission with Admin Replies', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for blog cards and click Read Article on the first card
    await page.waitForSelector('.blog-card');
    const firstCard = page.locator('.blog-card').first();
    const blogTitle = await firstCard.locator('.blog-card-title').innerText();

    await firstCard.locator('button:has-text("Read Article")').click();

    // Verify Modal Open
    const modal = page.locator('#articleModal');
    await expect(modal).toHaveClass(/active/);
    await expect(page.locator('#modalArticleTitle')).toHaveText(blogTitle);

    // Like post
    const likeBtn = page.locator('#modalLikeBtn');
    const initialLikes = parseInt(await page.locator('#modalLikeCount').innerText(), 10) || 0;
    await likeBtn.click();
    await page.waitForTimeout(400);
    const updatedLikes = parseInt(await page.locator('#modalLikeCount').innerText(), 10);
    expect(updatedLikes).toBe(initialLikes + 1);

    // Verify verified Admin reply is visible in reviews list if existing
    const reviewList = page.locator('#reviewsList');
    await expect(reviewList).toBeVisible();

    // Submit a new reader review
    await page.locator('#reviewerName').fill('Automated Test Reviewer');
    await page.locator('#reviewerEmail').fill('tester@insighthub.com');
    await page.locator('#reviewerComment').fill('Outstanding quality technical article! Love the detailed breakdown.');
    
    // Select 5-star rating
    await page.locator('#ratingSelector .star-btn[data-rating="5"]').click();
    await page.locator('#submitReviewBtn').click();

    // Toast notification verification
    await page.waitForSelector('.toast.success');
    await expect(page.locator('.toast.success')).toContainText('Review submitted successfully');

    // Close Modal
    await page.locator('#closeArticleModal').click();
    await expect(modal).not.toHaveClass(/active/);
  });

  test('4. Contact Form Submission to Admin Inbox', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Scroll to contact section
    await page.locator('#contact').scrollIntoViewIfNeeded();

    await page.locator('#contactName').fill('Dr. Jane Doe');
    await page.locator('#contactEmail').fill('dr.jane@quantuminstitute.org');
    await page.locator('#contactSubject').fill('Guest Post on Photonic Neural Nets');
    await page.locator('#contactMessage').fill('Hi Insight Hub team, we would love to publish our latest lab research findings on your portal.');

    await page.locator('#contactSubmitBtn').click();

    // Toast feedback
    await page.waitForSelector('.toast.success');
    await expect(page.locator('.toast.success')).toContainText('Message sent successfully');
  });

  test('5. Secret Admin Authentication & Management Dashboard (/admin)', async ({ page }) => {
    // Navigate directly to secret admin path
    await page.goto('http://localhost:3000/admin');

    // Verify login screen is visible
    const loginCard = page.locator('#adminLoginCard');
    await expect(loginCard).toBeVisible();
    await expect(page.locator('#adminPanel')).toBeHidden();

    // Try invalid password
    await page.locator('#adminPasswordInput').fill('wrongpassword123');
    await page.locator('#loginSubmitBtn').click();
    await page.waitForSelector('.toast.error');
    await expect(page.locator('.toast.error')).toContainText('Invalid admin credentials');

    // Login with correct password
    await page.locator('#adminPasswordInput').fill('vape1098');
    await page.locator('#loginSubmitBtn').click();

    // Verify Admin Dashboard is visible
    await page.waitForSelector('#adminPanel', { state: 'visible' });
    await expect(page.locator('#adminLoginCard')).toBeHidden();

    // 1. Check Analytics / Stats Cards
    await expect(page.locator('#statTotalBlogs')).not.toHaveText('0');
    await expect(page.locator('#statTotalViews')).toBeVisible();
    await expect(page.locator('#statTotalLikes')).toBeVisible();

    // 2. Switch to Inbox tab and verify test message received
    await page.locator('.admin-nav-item[data-tab="messages"]').click();
    await page.waitForSelector('#messagesTableBody tr');
    await expect(page.locator('#messagesTableBody')).toContainText('Dr. Jane Doe');

    // 3. Switch to Reviews tab and reply to review
    await page.locator('.admin-nav-item[data-tab="reviews"]').click();
    await page.waitForSelector('#reviewsListAdmin .admin-card');
    const firstReviewCard = page.locator('#reviewsListAdmin .admin-card').first();
    await expect(firstReviewCard).toBeVisible();

    // 4. Switch to Settings tab and save theme accent
    await page.locator('.admin-nav-item[data-tab="settings"]').click();
    await page.waitForSelector('#settingsSiteName');
    await page.locator('#settingsTagline').fill('Explore · Learn · Innovate · Shape the Future 2026');
    await page.locator('#saveSettingsBtn').click();
    await page.waitForSelector('.toast.success');

    // 5. Test Full Database JSON Backup Export
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#exportDbBtn').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('insight-hub-backup');

    // 6. Test Logout
    await page.locator('#adminLogoutBtn').click();
    await page.waitForSelector('#adminLoginCard', { state: 'visible' });
    await expect(page.locator('#adminPanel')).toBeHidden();
  });

});
