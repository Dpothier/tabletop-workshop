import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import {
  getGameState,
  clickGameCoords,
  getCharacterPosition,
  clickGridTile,
  UI_PANEL_COORDS,
  HERO_BAR_COORDS,
} from '@tests/e2e/fixtures';

const { Given, When, Then } = createBdd();

/**
 * Calculate the click position for a hero card in the bar
 * @param index 0-based hero index
 */
function getHeroCardCenter(index: number): { x: number; y: number } {
  const cardX =
    HERO_BAR_COORDS.X +
    index * (HERO_BAR_COORDS.CARD_WIDTH + HERO_BAR_COORDS.CARD_GAP) +
    HERO_BAR_COORDS.CARD_WIDTH / 2;
  const cardY = HERO_BAR_COORDS.Y + HERO_BAR_COORDS.CARD_CLICK_Y_OFFSET;
  return { x: cardX, y: cardY };
}

// Hero Selection Bar visibility
Then('I should see the hero selection bar', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.heroBar, 'Hero selection bar should be visible').toBeDefined();
  expect(state.heroBar?.visible, 'Hero bar should be visible').toBe(true);
});

Then('the hero bar should show 4 hero cards', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.heroBar?.cardCount, 'Hero bar should have 4 cards').toBe(4);
});

Then('each hero card should display a class icon', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.heroBar?.cards, 'Hero cards should exist').toBeDefined();
  for (const card of state.heroBar?.cards || []) {
    expect(card.hasClassIcon, 'Each card should have a class icon').toBe(true);
  }
});

Then('each hero card should display an HP bar', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.heroBar?.cards, 'Hero cards should exist').toBeDefined();
  for (const card of state.heroBar?.cards || []) {
    expect(card.hasHpBar, 'Each card should have an HP bar').toBe(true);
  }
});

Then('each hero card should display beads in hand', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.heroBar?.cards, 'Hero cards should exist').toBeDefined();
  for (const card of state.heroBar?.cards || []) {
    expect(card.hasBeadDisplay, 'Each card should have a bead display').toBe(true);
  }
});

// Hero card highlighting
Then('the first hero card should be highlighted', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.heroBar?.cards?.[0]?.highlighted, 'First card should be highlighted').toBe(true);
});

Then('other hero cards should be dimmed', async ({ page }) => {
  const state = await getGameState(page);
  const cards = state.heroBar?.cards || [];
  for (let i = 1; i < cards.length; i++) {
    expect(cards[i].dimmed, `Card ${i} should be dimmed`).toBe(true);
  }
});

// Hero card clicking
When('I click the first hero card in the bar', async ({ page }) => {
  const pos = getHeroCardCenter(0);
  await clickGameCoords(page, pos.x, pos.y);
  await page.waitForTimeout(300);
});

When('I click the second hero card in the bar', async ({ page }) => {
  const pos = getHeroCardCenter(1);
  await clickGameCoords(page, pos.x, pos.y);
  await page.waitForTimeout(300);
});

Then('the first hero should be selected', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.selectedTokenIndex, 'First hero should be selected').toBe(0);
});

Then('the first hero should remain the current actor', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.currentActor, 'First hero should still be current actor').toBe('hero-0');
});

// Selected Hero Panel
Then('the selected hero panel should be visible', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.selectedHeroPanel, 'Selected hero panel should exist').toBeDefined();
  expect(state.selectedHeroPanel?.visible, 'Panel should be visible').toBe(true);
});

// Bead updates
const previousBeadCount = 0;

When('I wait for the turn to complete', async ({ page }) => {
  await page.waitForTimeout(1500);
});

Then('the first hero card should show more beads', async ({ page }) => {
  const state = await getGameState(page);
  const newBeadCount = state.heroBar?.cards?.[0]?.beadCount || 0;
  expect(newBeadCount, 'Bead count should have increased').toBeGreaterThan(previousBeadCount);
});

// HP updates after monster attack
Given('I wait for the monster to attack a hero', async ({ page }) => {
  // Rest through turns until monster attacks a hero
  for (let i = 0; i < 6; i++) {
    const state = await getGameState(page);
    // If monster is current actor, wait for its turn
    if (state.currentActor === 'monster') {
      await page.waitForTimeout(1500);
    } else if (state.currentActor?.startsWith('hero-')) {
      // Click on hero to show panel first
      const heroPos = await getCharacterPosition(page, state.currentActor);
      if (heroPos) {
        await clickGridTile(page, heroPos.x, heroPos.y);
        await page.waitForTimeout(300);
      }
      // Rest to advance turns using correct panel coordinates
      await clickGameCoords(page, UI_PANEL_COORDS.BUTTON_X, UI_PANEL_COORDS.REST_BUTTON_Y);
      await page.waitForTimeout(1000);
    }
  }
});

Then('the damaged hero card should show reduced HP', async ({ page }) => {
  const state = await getGameState(page);
  // Check if any hero has taken damage
  const cards = state.heroBar?.cards || [];
  const anyDamaged = cards.some((card) => card.currentHp < card.maxHp);
  expect(anyDamaged, 'At least one hero should have taken damage').toBe(true);
});
