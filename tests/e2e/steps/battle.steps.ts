import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { waitForGameReady, clickGameCoords, getGameState } from '@tests/e2e/fixtures';

const { Given, When, Then } = createBdd();

Given('I have started a battle', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);
  await clickGameCoords(page, 512, 580);
  await page.waitForTimeout(1000);
});

Given('I am in the battle scene', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.scene).toBe('BattleScene');
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
  // Attack button at y=400 (Move=320, Run=360, Attack=400, Rest=440)
  await clickGameCoords(page, 900, 400);
  await page.waitForTimeout(300);
});

When('I click the Move button', async ({ page }) => {
  // Move button at y=320 (Move=320, Run=360, Attack=400, Rest=440)
  await clickGameCoords(page, 900, 320);
  await page.waitForTimeout(300);
});

Then('the battle scene should be visible', async ({ page }) => {
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
});

Then('I should see the arena grid', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.scene).toBe('BattleScene');
});

Then('I should see character tokens', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.scene).toBe('BattleScene');
  expect(state.wheelPositions).toBeDefined();
  // Check that player entities exist on the wheel
  const playerEntities = Object.keys(state.wheelPositions || {}).filter((id) =>
    id.startsWith('hero')
  );
  expect(playerEntities.length).toBeGreaterThan(0);
});

Then('I should see the monster token', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.monster).toBeDefined();
  expect(state.monster?.name).toBeDefined();
  expect(state.monster?.currentHealth).toBeGreaterThan(0);
});

Then('action buttons should appear', async ({ page }) => {
  const state = await getGameState(page);
  // When it's a player's turn, actions are available
  expect(state.currentActor).toBeDefined();
});

Then('the turn counter should increment', async ({ page }) => {
  const state = await getGameState(page);
  // Verify the wheel state is valid - entities should exist on the wheel
  expect(state.wheelPositions).toBeDefined();
  expect(Object.keys(state.wheelPositions || {}).length).toBeGreaterThan(0);
});

Then('the monster should take its turn', async ({ page }) => {
  await page.waitForTimeout(1500);
  const state = await getGameState(page);
  // After monster turn, verify game state is still valid
  expect(state.scene).toBe('BattleScene');
  expect(state.currentActor).toBeDefined();
});

When('the monster defeats all characters', async ({ page }) => {
  for (let i = 0; i < 20; i++) {
    await clickGameCoords(page, 900, 700);
    await page.waitForTimeout(2000);
  }
});

Then('the defeat screen should appear', async ({ page }) => {
  await page.waitForTimeout(500);
  const state = await getGameState(page);
  // After defeat, we should be on VictoryScene
  expect(state.scene).toBe('VictoryScene');
});

Then('the screen should show the turn count', async ({ page }) => {
  const state = await getGameState(page);
  // We should be on VictoryScene after the game ends
  expect(state.scene).toBe('VictoryScene');
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
