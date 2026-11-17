/**
 * @fileoverview Automated 1080p demo walkthrough video recorder using Playwright + Edge + FFmpeg.
 * Generates an English-only, clear, well-paced walkthrough with visible cursor animations.
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

/**
 * Smooth ease-in-out scrolling helper.
 */
async function smoothScroll(page, targetY, durationMs = 1800) {
  const steps = 36;
  const stepDelay = durationMs / steps;
  const currentY = await page.evaluate(() => window.scrollY);
  const diff = targetY - currentY;

  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
    await page.evaluate((y) => window.scrollTo(0, y), currentY + diff * ease);
    await sleep(stepDelay);
  }
  await sleep(400);
}

/**
 * Smoothly move mouse from current position to a target element and hover.
 */
async function smoothMoveTo(page, locator, durationMs = 700) {
  const box = await locator.boundingBox();
  if (!box) return;

  const targetX = box.x + box.width / 2;
  const targetY = box.y + box.height / 2;

  // Perform smooth move
  const steps = 18;
  const stepDelay = durationMs / steps;

  for (let i = 1; i <= steps; i++) {
    // Current viewport mouse position estimation
    await page.mouse.move(targetX, targetY, { steps: 2 });
    await sleep(stepDelay / 2);
  }
  await sleep(250);
}

/**
 * Types character by character with human-like cadence.
 */
async function humanType(locator, text, delayMs = 45) {
  await locator.focus();
  for (const char of text) {
    await locator.pressSequentially(char, { delay: delayMs });
  }
  await sleep(400);
}

(async () => {
  console.log('Launching Edge browser in 1920x1080 to record walkthrough on:', LIVE_URL);

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

  // Inject visible custom pointer for clear visual tracking
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      const cursor = document.createElement('div');
      cursor.id = 'demo-cursor';
      cursor.style.position = 'fixed';
      cursor.style.width = '26px';
      cursor.style.height = '26px';
      cursor.style.borderRadius = '50%';
      cursor.style.border = '2.5px solid #10b981';
      cursor.style.backgroundColor = 'rgba(16, 185, 129, 0.35)';
      cursor.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.6)';
      cursor.style.pointerEvents = 'none';
      cursor.style.zIndex = '999999';
      cursor.style.transition = 'transform 0.1s ease-out, background-color 0.15s ease, border-color 0.15s ease';
      cursor.style.transform = 'translate(-50%, -50%)';
      cursor.style.left = '960px';
      cursor.style.top = '540px';
      document.body.appendChild(cursor);

      window.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      });
      window.addEventListener('mousedown', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(0.7)';
        cursor.style.backgroundColor = 'rgba(239, 68, 68, 0.7)';
        cursor.style.borderColor = '#ef4444';
      });
      window.addEventListener('mouseup', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.backgroundColor = 'rgba(16, 185, 129, 0.35)';
        cursor.style.borderColor = '#10b981';
      });
    });
  });

  try {
    // ----------------------------------------------------
    // SCENE 1: HERO & DASHBOARD LANDING (0:00 - 0:12)
    // ----------------------------------------------------
    console.log('[1/8] Loading AirWise live dashboard in English...');
    await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 35000 });
    await sleep(2500);

    const logo = page.locator('text=AirWise').first();
    if (await logo.isVisible()) {
      await smoothMoveTo(page, logo, 600);
      await sleep(1500);
    }

    // ----------------------------------------------------
    // SCENE 2: CITY PRESETS & AUTOCOMPLETE SEARCH (0:12 - 0:35)
    // ----------------------------------------------------
    console.log('[2/8] Demonstrating City Presets & India Geocoding Autocomplete...');
    const lucknowBtn = page.locator('button:has-text("Lucknow")').first();
    if (await lucknowBtn.isVisible()) {
      await smoothMoveTo(page, lucknowBtn, 700);
      await sleep(500);
      await lucknowBtn.click();
      console.log('Switched to Lucknow preset');
      await sleep(3000); // Telemetry loads
    }

    // City search autocomplete demonstration
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await smoothMoveTo(page, searchInput, 700);
      await searchInput.click();
      await sleep(600);
      await humanType(searchInput, 'Kolkata', 60);
      await sleep(1800); // Debounce and geocoding response

      const kolkataOption = page.locator('button:has-text("Kolkata")').first();
      if (await kolkataOption.isVisible()) {
        await smoothMoveTo(page, kolkataOption, 600);
        await sleep(500);
        await kolkataOption.click();
        console.log('Selected Kolkata from autocomplete');
        await sleep(3000);
      }
    }

    // Switch back to Delhi NCR (primary winter hotspot)
    const delhiBtn = page.locator('button:has-text("Delhi NCR")').first();
    if (await delhiBtn.isVisible()) {
      await smoothMoveTo(page, delhiBtn, 600);
      await sleep(400);
      await delhiBtn.click();
      console.log('Switched back to Delhi NCR hotspot');
      await sleep(2500);
    }

    // ----------------------------------------------------
    // SCENE 3: INVERSION DYNAMICS & SENSOR CROSS-CHECK (0:35 - 0:58)
    // ----------------------------------------------------
    console.log('[3/8] Inspecting Inversion dynamics, NASA FIRMS, and WAQI Cross-Check...');
    await smoothScroll(page, 450, 1600);
    await sleep(1200);

    const aqiReading = page.locator('text=Unhealthy').first();
    if (await aqiReading.isVisible()) {
      await smoothMoveTo(page, aqiReading, 700);
      await sleep(1800);
    }

    const inversionCard = page.locator('text=Atmospheric Inversion').first();
    if (await inversionCard.isVisible()) {
      await smoothMoveTo(page, inversionCard, 800);
      await sleep(2000);
    }

    const fireCount = page.locator('text=Active Thermal').first();
    if (await fireCount.isVisible()) {
      await smoothMoveTo(page, fireCount, 600);
      await sleep(2000);
    }

    const stationCard = page.locator('text=Sensor Telemetry Cross-Check').first();
    if (await stationCard.isVisible()) {
      await smoothMoveTo(page, stationCard, 700);
      await sleep(2500);
    }

    // ----------------------------------------------------
    // SCENE 4: HOUSEHOLD PROFILE FORM CONFIGURATION (0:58 - 1:24)
    // ----------------------------------------------------
    console.log('[4/8] Configuring Household Profile Form...');
    await smoothScroll(page, 1050, 1800);
    await sleep(1200);

    // Toggle Children
    const childrenCheckbox = page.locator('label:has-text("Children") input[type="checkbox"]').first();
    if (await childrenCheckbox.isVisible()) {
      await smoothMoveTo(page, childrenCheckbox, 600);
      await sleep(400);
      await childrenCheckbox.check();
      await sleep(800);
    }

    // Toggle Respiratory Sensitivity
    const sensitivityCheckbox = page.locator('label:has-text("Respiratory") input[type="checkbox"]').first();
    if (await sensitivityCheckbox.isVisible()) {
      await smoothMoveTo(page, sensitivityCheckbox, 600);
      await sleep(400);
      await sensitivityCheckbox.check();
      await sleep(800);
    }

    // Select Commute Mode
    const commuteSelect = page.locator('select#commute-select').first();
    if (await commuteSelect.isVisible()) {
      await smoothMoveTo(page, commuteSelect, 600);
      await sleep(400);
      await commuteSelect.selectOption('two-wheeler');
      await sleep(1000);
    }

    // Adjust Commute Distance Slider
    const commuteSlider = page.locator('input#commute-km').first();
    if (await commuteSlider.isVisible()) {
      await smoothMoveTo(page, commuteSlider, 500);
      await sleep(300);
      await commuteSlider.fill('16');
      await sleep(800);
    }

    // Select Cooking Fuel (Biomass to demonstrate clean fuel mitigation)
    const fuelSelect = page.locator('select#fuel-select').first();
    if (await fuelSelect.isVisible()) {
      await smoothMoveTo(page, fuelSelect, 600);
      await sleep(400);
      await fuelSelect.selectOption('biomass-firewood');
      await sleep(1000);
    }

    // Click Generate Low-Emission Plan
    const generateBtn = page.locator('button[type="submit"]:has-text("Generate")').first();
    if (await generateBtn.isVisible()) {
      await smoothMoveTo(page, generateBtn, 800);
      await sleep(600);
      await generateBtn.click();
      console.log('Submitted profile form. Awaiting Gemini structured action plan...');
      await sleep(5500); // Wait for real AI synthesis and render
    }

    // ----------------------------------------------------
    // SCENE 5: AI ACTION PLAN & INTERACTIVE TABS (1:24 - 2:00)
    // ----------------------------------------------------
    console.log('[5/8] Exploring Generated AI Action Plan and Tabs...');
    await smoothScroll(page, 1550, 1800);
    await sleep(2000);

    // Hover over Quantified Impact Badges
    const impactBadges = page.locator('text=Cigarettes Equiv').first();
    if (await impactBadges.isVisible()) {
      await smoothMoveTo(page, impactBadges, 800);
      await sleep(2500);
    }

    // Tab 1: Diurnal Routines
    const routinesTab = page.locator('button:has-text("Diurnal Routines")').first();
    if (await routinesTab.isVisible()) {
      await smoothMoveTo(page, routinesTab, 600);
      await sleep(2000);
    }

    // Tab 2: Indoor Hacks
    const hacksTab = page.locator('button:has-text("Indoor Hacks")').first();
    if (await hacksTab.isVisible()) {
      await smoothMoveTo(page, hacksTab, 600);
      await hacksTab.click();
      console.log('Switched to Indoor Hacks tab (Ranked Free / Under 500 / Over 500)');
      await sleep(3500);
    }

    // Tab 3: Sustainable Alternatives
    const sustainableTab = page.locator('button:has-text("Sustainable Alternatives")').first();
    if (await sustainableTab.isVisible()) {
      await smoothMoveTo(page, sustainableTab, 600);
      await sustainableTab.click();
      console.log('Switched to Sustainable Alternatives tab');
      await sleep(3500);
    }

    // Tab 4: Health Guidance
    const healthTab = page.locator('button:has-text("Health Guidance")').first();
    if (await healthTab.isVisible()) {
      await smoothMoveTo(page, healthTab, 600);
      await healthTab.click();
      console.log('Switched to Health Guidance tab');
      await sleep(3500);
    }

    // ----------------------------------------------------
    // SCENE 6: CLIENT-SIDE WHAT-IF SIMULATOR (2:00 - 2:22)
    // ----------------------------------------------------
    console.log('[6/8] Interacting with What-If Exposure Simulator...');
    await smoothScroll(page, 2250, 1800);
    await sleep(1500);

    // Toggle 1: HEPA Air Purifier
    const purifierToggle = page.locator('button:has-text("HEPA Air Purifier")').first();
    if (await purifierToggle.isVisible()) {
      await smoothMoveTo(page, purifierToggle, 700);
      await sleep(500);
      await purifierToggle.click();
      console.log('Toggled HEPA Air Purifier ON');
      await sleep(2200);
    }

    // Toggle 2: Shift to Metro Rail
    const metroToggle = page.locator('button:has-text("Shift to Metro Rail")').first();
    if (await metroToggle.isVisible()) {
      await smoothMoveTo(page, metroToggle, 700);
      await sleep(500);
      await metroToggle.click();
      console.log('Toggled Shift to Metro Rail ON');
      await sleep(2200);
    }

    // Toggle 3: Weatherize & Seal
    const sealToggle = page.locator('button:has-text("Weatherize & Seal")').first();
    if (await sealToggle.isVisible()) {
      await smoothMoveTo(page, sealToggle, 700);
      await sleep(500);
      await sealToggle.click();
      console.log('Toggled Weatherize & Seal ON');
      await sleep(2500);
    }

    // ----------------------------------------------------
    // SCENE 7: GROUNDED STREAMING AI CHAT ADVISOR (2:22 - 2:50)
    // ----------------------------------------------------
    console.log('[7/8] Demonstrating Live Grounded Streaming AI Chat...');
    await smoothScroll(page, 3150, 1800);
    await sleep(1500);

    const chatInput = page.locator('input[aria-label="Chat query input"], input[placeholder*="Ask"]').first();
    if (await chatInput.isVisible()) {
      await smoothMoveTo(page, chatInput, 600);
      await chatInput.click();
      await sleep(400);
      await humanType(chatInput, 'What precautions should my child take during morning peak smog?', 45);
      await sleep(800);

      // Submit chat by pressing Enter to guarantee form-specific dispatch
      console.log('Submitting chat query via Enter key...');
      await chatInput.press('Enter');
      console.log('Sent chat query. Streaming live tokens from Gemini...');
      // Allow live tokens to stream progressively on screen
      await sleep(15000);
    }

    // ----------------------------------------------------
    // SCENE 8: COMMUNITY CARD, A11Y & FOOTER (2:50 - 3:05)
    // ----------------------------------------------------
    console.log('[8/8] Community Action Card, Accessibility and Attributions...');
    const shareBtn = page.locator('button:has-text("Share Notice")').first();
    if (await shareBtn.isVisible()) {
      await smoothMoveTo(page, shareBtn, 600);
      await sleep(400);
      await shareBtn.click();
      console.log('Clicked Share Community Notice');
      await sleep(2000);
    }

    // Scroll down to Footer
    await smoothScroll(page, 4000, 1800);
    await sleep(1500);

    // Keyboard navigation demonstration (visible focus rings)
    console.log('Demonstrating keyboard focus rings...');
    await page.keyboard.press('Tab');
    await sleep(700);
    await page.keyboard.press('Tab');
    await sleep(700);
    await page.keyboard.press('Tab');
    await sleep(1500);

    console.log('Demo walkthrough completed cleanly!');
  } catch (err) {
    console.error('Walkthrough recording error:', err);
  } finally {
    const video = page.video();
    try {
      await page.close();
    } catch {}
    try {
      await context.close();
    } catch {}
    try {
      await browser.close();
    } catch {}

    if (video) {
      const rawPath = await video.path();
      console.log('Raw video recorded at:', rawPath);

      console.log('Encoding to 1080p H.264 MP4 with FFmpeg at 30fps...');
      const ffmpegCmd = `ffmpeg -y -i "${rawPath}" -c:v libx264 -preset fast -pix_fmt yuv420p -movflags +faststart -r 30 -crf 22 "${FINAL_MP4}"`;
      execSync(ffmpegCmd, { stdio: 'inherit' });
      console.log('Final 1080p walkthrough video saved at:', FINAL_MP4);

      // Clean up raw recording directory
      try {
        fs.rmSync(RAW_DIR, { recursive: true, force: true });
      } catch {}
    }
  }
})();
