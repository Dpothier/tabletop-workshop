import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { waitForGameReady } from '@tests/e2e/fixtures';

const { Given, When, Then } = createBdd();

Given('I am on the game page', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);
});

Given('the game has loaded', async ({ page }) => {
  await waitForGameReady(page);
});

When('I take a screenshot', async ({ page }) => {
  await page.screenshot({ path: 'test-screenshot.png' });
});

Then('the canvas should be visible', async ({ page }) => {
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
});

Then('I should see the game title', async ({ page }) => {
  const title = page.locator('text=Tabletop Workshop');
  await expect(title).toBeVisible();
});
