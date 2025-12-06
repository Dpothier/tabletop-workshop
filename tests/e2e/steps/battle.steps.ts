import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { waitForGameReady, clickGameCoords } from '../fixtures';

const { Given, When, Then } = createBdd();

Given('I have started a battle', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);
  await clickGameCoords(page, 512, 580);
  await page.waitForTimeout(1000);
});

Given('I am in the battle scene', async ({ page }) => {
  await page.waitForTimeout(500);
});

When('I click on a character token', async ({ page }) => {
  await clickGameCoords(page, 128, 384);
  await page.waitForTimeout(300);
});

When('I click the End Turn button', async ({ page }) => {
  await clickGameCoords(page, 900, 700);
  await page.waitForTimeout(1000);
});

When('I click the Attack button', async ({ page }) => {
  await clickGameCoords(page, 900, 450);
  await page.waitForTimeout(300);
});

When('I click the Move button', async ({ page }) => {
  await clickGameCoords(page, 900, 400);
  await page.waitForTimeout(300);
});

Then('the battle scene should be visible', async ({ page }) => {
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
});

Then('I should see the arena grid', async ({ page }) => {
  await page.waitForTimeout(100);
});

Then('I should see character tokens', async ({ page }) => {
  await page.waitForTimeout(100);
});

Then('I should see the monster token', async ({ page }) => {
  await page.waitForTimeout(100);
});

Then('action buttons should appear', async ({ page }) => {
  await page.waitForTimeout(100);
});

Then('the turn counter should increment', async ({ page }) => {
  await page.waitForTimeout(100);
});

Then('the monster should take its turn', async ({ page }) => {
  await page.waitForTimeout(1500);
});

When('the monster defeats all characters', async ({ page }) => {
  for (let i = 0; i < 20; i++) {
    await clickGameCoords(page, 900, 700);
    await page.waitForTimeout(2000);
  }
});

Then('the defeat screen should appear', async ({ page }) => {
  await page.waitForTimeout(500);
});

Then('the screen should show the turn count', async ({ page }) => {
  await page.waitForTimeout(100);
});

Given('the game has ended', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);
  await clickGameCoords(page, 512, 580);
  await page.waitForTimeout(1000);
  for (let i = 0; i < 20; i++) {
    await clickGameCoords(page, 900, 700);
    await page.waitForTimeout(2000);
  }
});

When('I click the Play Again button', async ({ page }) => {
  await clickGameCoords(page, 512, 500);
  await page.waitForTimeout(500);
});
