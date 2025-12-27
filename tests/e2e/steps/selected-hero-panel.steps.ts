import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import {
  getGameState,
  clickGameCoords,
  getCharacterPosition,
  clickGridTile,
} from '@tests/e2e/fixtures';

const { Given, When, Then } = createBdd();

// Selected Hero Panel coordinates (from plan)
const PANEL_X = 600;
const PANEL_Y = 280;

// Action button positions within panel (relative to panel)
const ACTION_BUTTON_Y_OFFSET = 150; // Start of action buttons area
const ACTION_BUTTON_HEIGHT = 36;
const ACTION_BUTTON_GAP = 4;

/**
 * Get click position for an action button in the panel
 */
function getActionButtonCenter(actionIndex: number): { x: number; y: number } {
  const buttonY =
    PANEL_Y + ACTION_BUTTON_Y_OFFSET + actionIndex * (ACTION_BUTTON_HEIGHT + ACTION_BUTTON_GAP);
  return { x: PANEL_X + 112, y: buttonY }; // Center of panel width
}

// Panel visibility
Then('the panel should show the selected hero ID', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.selectedHeroPanel?.heroId, 'Panel should show hero ID').toBeDefined();
  expect(state.selectedHeroPanel?.heroId).toMatch(/^hero-/);
});

Then('the panel should show 4 inventory slots', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.selectedHeroPanel?.inventorySlots, 'Panel should have 4 inventory slots').toBe(4);
});

// Action button display
Then('the panel should show the Move action with cost {int}', async ({ page }, cost: number) => {
  const state = await getGameState(page);
  const moveAction = state.selectedHeroPanel?.actionButtons?.find((a) => a.name === 'Move');
  expect(moveAction, 'Move action should exist').toBeDefined();
  expect(moveAction?.cost, 'Move cost should match').toBe(cost);
});

Then('the panel should show the Run action with cost {int}', async ({ page }, cost: number) => {
  const state = await getGameState(page);
  const runAction = state.selectedHeroPanel?.actionButtons?.find((a) => a.name === 'Run');
  expect(runAction, 'Run action should exist').toBeDefined();
  expect(runAction?.cost, 'Run cost should match').toBe(cost);
});

Then('the panel should show the Attack action with cost {int}', async ({ page }, cost: number) => {
  const state = await getGameState(page);
  const attackAction = state.selectedHeroPanel?.actionButtons?.find((a) => a.name === 'Attack');
  expect(attackAction, 'Attack action should exist').toBeDefined();
  expect(attackAction?.cost, 'Attack cost should match').toBe(cost);
});

Then('the panel should show the Rest action with cost {int}', async ({ page }, cost: number) => {
  const state = await getGameState(page);
  const restAction = state.selectedHeroPanel?.actionButtons?.find((a) => a.name === 'Rest');
  expect(restAction, 'Rest action should exist').toBeDefined();
  expect(restAction?.cost, 'Rest cost should match').toBe(cost);
});

// Panel hidden during monster turn
Given('I wait until the monster is the current actor', async ({ page }) => {
  // Rest through turns until monster is current actor
  for (let i = 0; i < 8; i++) {
    const state = await getGameState(page);
    if (state.currentActor === 'monster') {
      break;
    }
    if (state.currentActor?.startsWith('hero-')) {
      // Click on hero to show panel first
      const heroPos = await getCharacterPosition(page, state.currentActor);
      if (heroPos) {
        await clickGridTile(page, heroPos.x, heroPos.y);
        await page.waitForTimeout(300);
      }
      // Click Rest button using correct panel coordinates
      const pos = getActionButtonCenter(3);
      await clickGameCoords(page, pos.x, pos.y);
      await page.waitForTimeout(1000);
    } else {
      await page.waitForTimeout(500);
    }
  }
});

Then('the selected hero panel should not be visible', async ({ page }) => {
  const state = await getGameState(page);
  // Panel must exist and be explicitly hidden (not just undefined)
  expect(state.selectedHeroPanel, 'Panel state should exist').toBeDefined();
  expect(state.selectedHeroPanel?.visible, 'Panel should be hidden').toBe(false);
});

// Panel update on hero change
When('I click the Rest button from panel', async ({ page }) => {
  // Rest button is at index 3 (Move=0, Run=1, Attack=2, Rest=3)
  const pos = getActionButtonCenter(3);
  await clickGameCoords(page, pos.x, pos.y);
  await page.waitForTimeout(500);
});

Given('the second hero becomes the current actor', async ({ page }) => {
  // Wait for turns to cycle until hero-1 is current actor
  for (let i = 0; i < 10; i++) {
    const state = await getGameState(page);
    if (state.currentActor === 'hero-1') {
      break;
    }
    // If it's a hero turn, rest to advance
    if (state.currentActor?.startsWith('hero-')) {
      // Click on hero to show panel first
      const heroPos = await getCharacterPosition(page, state.currentActor);
      if (heroPos) {
        await clickGridTile(page, heroPos.x, heroPos.y);
        await page.waitForTimeout(300);
      }
      // Click Rest button using correct panel coordinates
      const pos = getActionButtonCenter(3);
      await clickGameCoords(page, pos.x, pos.y);
      await page.waitForTimeout(1000);
    } else {
      // Monster turn, wait for it to complete
      await page.waitForTimeout(1500);
    }
  }
  const state = await getGameState(page);
  expect(state.currentActor, 'Second hero should be current actor').toBe('hero-1');
});

// Note: "I click the second hero card in the bar" step is defined in hero-selection-bar.steps.ts

Then('the panel should show the second hero ID', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.selectedHeroPanel?.heroId, 'Panel should show second hero ID').toBe('hero-1');
});
