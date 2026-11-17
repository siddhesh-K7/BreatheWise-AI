const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const LIVE_URL = process.env.APP_URL || 'https://airwise-urban-air-quality-assistant.vercel.app';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2, // 2x retina crispness for LinkedIn
  });

  const page = await context.newPage();

  console.log('Loading live AirWise app at:', LIVE_URL);
  await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 35000 });
  await sleep(2000);

  // ----------------------------------------------------
  // SCREENSHOT 1: Live Telemetry, Inversion & Station Cross-Check
  // ----------------------------------------------------
  console.log('[1/4] Capturing Live Telemetry & Inversion Dynamics...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '01_live_telemetry_inversion.png'),
    fullPage: false,
  });

  // ----------------------------------------------------
  // SCREENSHOT 2: Personalized Smog Action Plan (AI Generated)
  // ----------------------------------------------------
  console.log('[2/4] Generating & Capturing AI Personalized Action Plan...');
  const childrenCheckbox = page.locator('label:has-text("Children") input[type="checkbox"]').first();
  if (await childrenCheckbox.isVisible()) {
    await childrenCheckbox.check();
  }
  const sensitivityCheckbox = page.locator('label:has-text("Respiratory") input[type="checkbox"]').first();
  if (await sensitivityCheckbox.isVisible()) {
    await sensitivityCheckbox.check();
  }
  const commuteSelect = page.locator('select#commute-select').first();
  if (await commuteSelect.isVisible()) {
    await commuteSelect.selectOption('two-wheeler');
  }
  const generateBtn = page.locator('button[type="submit"]:has-text("Generate")').first();
  if (await generateBtn.isVisible()) {
    await generateBtn.click();
    await sleep(6500); // Wait for Gemini plan synthesis
  }

  // Scroll exactly to AI Action Plan section
  const planHeading = page.locator('text=Personalized Smog Action Plan').first();
  if (await planHeading.isVisible()) {
    await planHeading.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -20)); // slight padding
    await sleep(1500);
  }
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '02_personalized_ai_action_plan.png'),
    fullPage: false,
  });

  // ----------------------------------------------------
  // SCREENSHOT 3: Interactive What-If Exposure Simulator
  // ----------------------------------------------------
  console.log('[3/4] Activating & Capturing What-If Exposure Simulator...');
  const purifierToggle = page.locator('button:has-text("HEPA Air Purifier")').first();
  if (await purifierToggle.isVisible()) {
    await purifierToggle.click();
  }
  const metroToggle = page.locator('button:has-text("Shift to Metro Rail")').first();
  if (await metroToggle.isVisible()) {
    await metroToggle.click();
  }
  const sealToggle = page.locator('button:has-text("Weatherize & Seal")').first();
  if (await sealToggle.isVisible()) {
    await sealToggle.click();
  }
  await sleep(1500);

  // Scroll exactly to What-If simulator section
  const whatIfHeading = page.locator('text=What-If Exposure Simulator').first();
  if (await whatIfHeading.isVisible()) {
    await whatIfHeading.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -25));
    await sleep(1200);
  }
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '03_what_if_simulator.png'),
    fullPage: false,
  });

  // ----------------------------------------------------
  // SCREENSHOT 4: Grounded AI Smog Assistant & Community Bulletin
  // ----------------------------------------------------
  console.log('[4/4] Sending Chat Query & Capturing Grounded AI Advisor...');
  const chatInput = page.locator('input[aria-label="Chat query input"], input[placeholder*="Ask"]').first();
  if (await chatInput.isVisible()) {
    await chatInput.fill('What morning precautions should my child take during peak winter smog?');
    await chatInput.press('Enter');
    console.log('Awaiting streaming tokens from Gemini...');
    await sleep(9500);
  }

  // Scroll to capture Chat and Community Card together
  const chatHeading = page.locator('text=AI Smog Assistant').first();
  if (await chatHeading.isVisible()) {
    await chatHeading.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -25));
    await sleep(1200);
  }
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '04_grounded_ai_chat_assistant.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('All 4 LinkedIn screenshots captured successfully in:', OUTPUT_DIR);
})();
