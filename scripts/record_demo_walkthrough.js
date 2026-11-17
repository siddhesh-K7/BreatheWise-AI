/**
 * @fileoverview Automated 1080p demo walkthrough video recorder using Playwright + Edge + FFmpeg.
 */

const { chromium } = require('@playwright/test');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LIVE_URL = process.env.APP_URL || 'https://airwise-urban-air-quality-assistant.vercel.app';
const BASE_DIR = path.resolve(__dirname, '..');
const RECORDINGS_DIR = path.join(BASE_DIR, 'recordings');
const RAW_DIR = path.join(BASE_DIR, 'recordings_raw');
const FINAL_MP4 = path.join(RECORDINGS_DIR, 'airwise_demo_walkthrough_1080p.mp4');

[RECORDINGS_DIR, RAW_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function smoothScroll(page, targetY, durationMs = 1500) {
  const steps = 30;
  const stepDelay = durationMs / steps;
  const currentY = await page.evaluate(() => window.scrollY);
  const diff = targetY - currentY;

  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    // Ease in-out
    const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
    await page.evaluate((y) => window.scrollTo(0, y), currentY + diff * ease);
    await sleep(stepDelay);
  }
}

(async () => {
  console.log('Launching browser to record walkthrough video on:', LIVE_URL);

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: RAW_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  try {
    // 1. Initial Page Load & Hero Inspection
    console.log('Navigating to AirWise dashboard...');
    await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2500);

    // 2. Explore Delhi Preset (Default)
    console.log('Focusing Delhi preset telemetry and cards...');
    await sleep(2000);
    await smoothScroll(page, 350, 1500);
    await sleep(2000);

    // 3. City Search Bar Interaction
    console.log('Interacting with City Search autocomplete...');
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.click();
      await sleep(800);
      await searchInput.fill('Lucknow');
      await sleep(1500); // Wait for debounce and Open-Meteo geocoding results
      const candidate = page.locator('button:has-text("Lucknow")').first();
      if (await candidate.isVisible()) {
        await candidate.click();
        await sleep(2500);
      }
    }

    // 4. Switch back to Delhi preset
    console.log('Switching to Delhi NCR preset...');
    const delhiBtn = page.locator('button:has-text("Delhi NCR")').first();
    if (await delhiBtn.isVisible()) {
      await delhiBtn.click();
      await sleep(2500);
    }

    // 5. Inversion & Station Cross-Check inspection
    await smoothScroll(page, 600, 1200);
    await sleep(2500);

    // 6. Fill Household Profile Form
    console.log('Configuring household profile form...');
    await smoothScroll(page, 950, 1500);
    await sleep(1500);

    // Toggle children checkbox if present
    const childrenBox = page.locator('input[type="checkbox"]').first();
    if (await childrenBox.isVisible()) {
      await childrenBox.check();
      await sleep(800);
    }

    // Click Generate Protection Plan button
    console.log('Generating AI action plan...');
    const generateBtn = page.locator('button:has-text("Generate Plan"), button:has-text("Synthesize")').first();
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await sleep(5000); // Wait for plan synthesis and render
    }

    // 7. Scroll through Generated Plan
    console.log('Reviewing generated action plan...');
    await smoothScroll(page, 1500, 2000);
    await sleep(3500);

    // 8. What-If Exposure Simulator
    console.log('Interacting with What-If simulator...');
    await smoothScroll(page, 2200, 1500);
    await sleep(2000);

    // Toggle simulator radio/buttons if present
    const simulatorBtn = page.locator('button:has-text("Metro"), button:has-text("EV")').first();
    if (await simulatorBtn.isVisible()) {
      await simulatorBtn.click();
      await sleep(2000);
    }

    // 9. Streaming Conversational Chat
    console.log('Testing streaming chat advisor...');
    await smoothScroll(page, 2800, 1500);
    await sleep(2000);

    const chatInput = page.locator('input[placeholder*="Ask"], input[placeholder*="question"]');
    if (await chatInput.isVisible()) {
      await chatInput.click();
      await sleep(500);
      await chatInput.fill('What morning precautions should my child take?');
      await sleep(1000);
      const sendBtn = page.locator('button[type="submit"]:has-text("Send"), button:has-text("Ask")').first();
      if (await sendBtn.isVisible()) {
        await sendBtn.click();
        await sleep(5000); // Watch tokens stream
      }
    }

    // 10. Multi-Language Switch (Tamil, then Hindi, then English)
    console.log('Testing language switcher...');
    await smoothScroll(page, 0, 1500);
    await sleep(1500);

    const tamilBtn = page.locator('button:has-text("தமிழ்")').first();
    if (await tamilBtn.isVisible()) {
      await tamilBtn.click();
      await sleep(3000);
    }

    const hindiBtn = page.locator('button:has-text("हिन्दी")').first();
    if (await hindiBtn.isVisible()) {
      await hindiBtn.click();
      await sleep(3000);
    }

    const enBtn = page.locator('button:has-text("English")').first();
    if (await enBtn.isVisible()) {
      await enBtn.click();
      await sleep(2000);
    }

    // 11. Keyboard Navigation Demonstration (SkipLink)
    console.log('Demonstrating keyboard navigation and focus rings...');
    await page.keyboard.press('Tab');
    await sleep(800);
    await page.keyboard.press('Tab');
    await sleep(800);
    await page.keyboard.press('Tab');
    await sleep(1200);

    // 12. Final overview scroll to Community Card & Footer
    console.log('Scrolling to Community Card and Footer attributions...');
    await smoothScroll(page, 3400, 2000);
    await sleep(3000);

    console.log('Walkthrough sequence completed successfully.');
  } catch (err) {
    console.error('Walkthrough error:', err);
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();

    if (video) {
      const rawPath = await video.path();
      console.log('Raw video recorded to:', rawPath);

      console.log('Transcoding to 1080p H.264 MP4 with FFmpeg...');
      const ffmpegCmd = `ffmpeg -y -i "${rawPath}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart -r 30 -crf 20 "${FINAL_MP4}"`;
      execSync(ffmpegCmd, { stdio: 'inherit' });
      console.log('Final walkthrough video generated at:', FINAL_MP4);

      // Clean up raw directory
      try {
        fs.rmSync(RAW_DIR, { recursive: true, force: true });
      } catch {}
    }
  }
})();
