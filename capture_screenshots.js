const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/User/.gemini/antigravity-ide/brain/6be6f766-9069-460c-bcd0-37f242bfc842';

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Homepage Dark Mode Hero & Orbit
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'homepage_dark.png'), fullPage: false });

  // 2. Full page with Blogs and Categories
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'blogs_grid.png'), fullPage: false });

  // 3. Blog Reader Modal with Reviews
  await page.locator('.blog-card').first().locator('.card-title').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'blog_reader_modal.png'), fullPage: false });
  await page.locator('#modalCloseBtn').click();
  await page.waitForTimeout(400);

  // 4. Light Mode Toggle
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('#themeToggleBtn').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'homepage_light.png'), fullPage: false });

  // 5. Admin Login Screen
  await page.goto('http://localhost:3000/admin');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_login.png'), fullPage: false });

  // 6. Admin Dashboard Logged In
  await page.fill('#adminPasswordInput', 'vape1098');
  await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login')),
    page.locator('#loginSubmitBtn').click()
  ]);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_dashboard.png'), fullPage: false });

  // 7. Admin Blog Management Tab
  await page.locator('button[data-tab="blogs"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_blogs.png'), fullPage: false });

  // 8. Admin Reviews Moderation Tab
  await page.locator('button[data-tab="reviews"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_reviews.png'), fullPage: false });

  // 9. Mobile Viewport Check (375x812)
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_hero.png'), fullPage: false });

  // 10. Mobile Menu Drawer
  await page.locator('#hamburgerBtn').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_menu.png'), fullPage: false });

  await browser.close();
  console.log('✅ All screenshots saved successfully!');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
