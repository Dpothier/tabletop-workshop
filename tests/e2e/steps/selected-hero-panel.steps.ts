import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  getGameState,
  clickGameCoords,
  getCharacterPosition,
  clickGridTile,
  UI_PANEL_COORDS,
} from '@tests/e2e/fixtures';

const { Given, When, Then } = createBdd();

/**
 * Click on a specific tab in the Selected Hero Panel
 */
async function clickTab(page: Page, tab: 'movement' | 'attacks' | 'others'): Promise<void> {
  const tabX =
    tab === 'movement'
      ? UI_PANEL_COORDS.MOVEMENT_TAB_X
      : tab === 'attacks'
        ? UI_PANEL_COORDS.ATTACKS_TAB_X
        : UI_PANEL_COORDS.OTHERS_TAB_X;
  await clickGameCoords(page, tabX, UI_PANEL_COORDS.TAB_Y);
  await page.waitForTimeout(200);
}

/**
 * Click the Rest button (in Others tab, first button in single-button row)
 */
async function clickRestButton(page: Page): Promise<void> {
  // Click Others tab first
  await clickTab(page, 'others');
  // Rest is centered (single button in row) at center of panel
  const restX = UI_PANEL_COORDS.PANEL_X + UI_PANEL_COORDS.PANEL_WIDTH / 2;
  await clickGameCoords(page, restX, UI_PANEL_COORDS.BUTTON_ROW_Y);
}

// Panel visibility
Then('the panel should show the selected hero ID', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.selectedHeroPanel?.heroId, 'Panel should show hero ID').toBeDefined();
  expect(state.selectedHeroPanel?.heroId).toMatch(/^hero-/);
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
      // Click Rest button (will click Others tab first)
      await clickRestButton(page);
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
  await clickRestButton(page);
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
      // Click Rest button (will click Others tab first)
      await clickRestButton(page);
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
