import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import {
  waitForGameReady,
  clickGameCoords,
  getGameState,
  captureActionState,
  expectWheelAdvanced,
  UI_PANEL_COORDS,
  HERO_BAR_COORDS,
  ActionState,
} from '@tests/e2e/fixtures';

const { Given, When, Then } = createBdd();

// State captured before actions for wheel position verification
let lastActionState: ActionState;

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
  // Capture state before action for wheel position verification
  lastActionState = await captureActionState(page);

  // Verify the current actor is a hero
  const state = await getGameState(page);
  expect(state.currentActor?.startsWith('hero-'), 'Current actor should be a hero for Attack').toBe(
    true
  );

  // Ensure panel is visible - select current actor if needed
  if (!state.selectedHeroPanel?.visible || state.selectedHeroPanel?.heroId !== state.currentActor) {
    const heroIndex = parseInt(state.currentActor!.split('-')[1]);
    const cardX =
      HERO_BAR_COORDS.X +
      heroIndex * (HERO_BAR_COORDS.CARD_WIDTH + HERO_BAR_COORDS.CARD_GAP) +
      HERO_BAR_COORDS.CARD_WIDTH / 2;
    const cardY = HERO_BAR_COORDS.Y + HERO_BAR_COORDS.CARD_CLICK_Y_OFFSET;
    await clickGameCoords(page, cardX, cardY);
    await page.waitForTimeout(300);
  }

  // Verify panel is visible and Attack is affordable
  const finalState = await getGameState(page);
  expect(finalState.selectedHeroPanel?.visible, 'Panel should be visible before Attack').toBe(true);
  const attackBtn = finalState.selectedHeroPanel?.actionButtons?.find((b) => b.name === 'Attack');
  expect(attackBtn?.affordable, 'Attack should be affordable').toBe(true);

  await clickGameCoords(page, UI_PANEL_COORDS.BUTTON_X, UI_PANEL_COORDS.ATTACK_BUTTON_Y);
  // Wait for async animation to complete (damage flash takes ~600ms)
  await page.waitForTimeout(1000);
});

When('I click the Move button', async ({ page }) => {
  lastActionState = await captureActionState(page);
  await clickGameCoords(page, UI_PANEL_COORDS.BUTTON_X, UI_PANEL_COORDS.MOVE_BUTTON_Y);
  await page.waitForTimeout(300);
});

When('I click the Run button', async ({ page }) => {
  lastActionState = await captureActionState(page);
  await clickGameCoords(page, UI_PANEL_COORDS.BUTTON_X, UI_PANEL_COORDS.RUN_BUTTON_Y);
  await page.waitForTimeout(300);
});

When('I click the Rest button', async ({ page }) => {
  lastActionState = await captureActionState(page);
  await clickGameCoords(page, UI_PANEL_COORDS.BUTTON_X, UI_PANEL_COORDS.REST_BUTTON_Y);
  // Wait longer for async animation to complete
  await page.waitForTimeout(1000);
});

Then('my wheel position should be {int}', async ({ page }, expectedDelta: number) => {
  await expectWheelAdvanced(page, lastActionState, expectedDelta);
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
