import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { waitForGameReady, clickGameCoords } from '../fixtures';

const { Given, When, Then } = createBdd();

Given('I am on the main menu', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);
});

When('I click the next monster button', async ({ page }) => {
  await clickGameCoords(page, 660, 200);
  await page.waitForTimeout(200);
});

When('I click the previous monster button', async ({ page }) => {
  await clickGameCoords(page, 360, 200);
  await page.waitForTimeout(200);
});

When('I click the next arena button', async ({ page }) => {
  await clickGameCoords(page, 660, 340);
  await page.waitForTimeout(200);
});

When('I click the party size up button', async ({ page }) => {
  await clickGameCoords(page, 590, 480);
  await page.waitForTimeout(200);
});

When('I click the party size down button', async ({ page }) => {
  await clickGameCoords(page, 430, 480);
  await page.waitForTimeout(200);
});

When('I click the Start Battle button', async ({ page }) => {
  await clickGameCoords(page, 512, 580);
  await page.waitForTimeout(500);
});

Then('I should see the menu', async ({ page }) => {
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
});

Then('the monster selection should change', async ({ page }) => {
  await page.waitForTimeout(100);
});

Then('the arena selection should change', async ({ page }) => {
  await page.waitForTimeout(100);
});

Then('the party size should change', async ({ page }) => {
  await page.waitForTimeout(100);
});
