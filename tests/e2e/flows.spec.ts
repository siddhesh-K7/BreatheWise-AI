import { test, expect } from '@playwright/test';

test.describe('AirWise End-to-End User Journeys', () => {
  test('User selects metropolitan preset and inspects live telemetry', async ({ page }) => {
    await page.goto('/');

    // Verify Brand Title & Presets
    await expect(page.locator('h1')).toContainText('Urban Air Quality');
    await expect(page.getByText('Delhi NCR')).toBeVisible();

    // Click Chennai preset
    await page.getByRole('button', { name: 'Chennai' }).click();

    // Verify overview updates
    await expect(page.locator('#aqi-overview-heading')).toContainText('Chennai');
    await expect(page.getByText('PM2.5')).toBeVisible();
    await expect(page.getByText('US AQI')).toBeVisible();
  });

  test('User configures profile and generates customized action plan', async ({ page }) => {
    await page.goto('/');

    // Fill profile toggles
    await page.getByLabel('Children under 12').check();

    // Click Generate Plan
    const generateBtn = page.getByRole('button', { name: /Generate AI Smog Action Plan/i });
    await generateBtn.click();

    // Verify Action Plan renders with tabs
    await expect(page.locator('#action-plan-heading')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Personalized Smog Action Plan')).toBeVisible();

    // Switch to Indoor Hacks tab
    await page.getByRole('tab', { name: /Indoor IAQ Hacks/i }).click();
    await expect(page.getByText(/Microfiber/i).or(page.getByText(/HEPA/i))).toBeVisible();
  });

  test('User interacts with What-If Exposure Simulator', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#simulator-heading')).toBeVisible();

    // Toggle HEPA Purifier
    const purifierToggle = page.getByRole('button', { name: /HEPA Air Purifier/i });
    await purifierToggle.click();

    // Toggle Metro Rail
    const metroToggle = page.getByRole('button', { name: /Shift to Metro Rail/i });
    await metroToggle.click();

    // Verify impact metrics are active
    await expect(page.getByText('Cigarettes Equiv. Avoided / Day')).toBeVisible();
    await expect(page.getByText('PM2.5 Exposure Reduction')).toBeVisible();
  });
});
