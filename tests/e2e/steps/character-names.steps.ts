import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { getGameState } from '@tests/e2e/fixtures';

const { Then } = createBdd();

// Hero card names
Then('each hero card should have a name', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.heroBar?.cards, 'Hero cards should exist').toBeDefined();
  for (const card of state.heroBar?.cards || []) {
    expect(card.name, 'Each card should have a name property').toBeDefined();
    expect(typeof card.name, 'Card name should be a string').toBe('string');
  }
});

Then('hero card names should not be empty', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.heroBar?.cards, 'Hero cards should exist').toBeDefined();
  for (const card of state.heroBar?.cards || []) {
    expect(card.name, 'Card name should not be empty').not.toBe('');
    expect(card.name.length, 'Card name should have length > 0').toBeGreaterThan(0);
  }
});

Then('the hero card names should be Warrior, Mage, Rogue, Cleric', async ({ page }) => {
  const state = await getGameState(page);
  const expectedNames = ['Warrior', 'Mage', 'Rogue', 'Cleric'];
  expect(state.heroBar?.cards, 'Hero cards should exist').toBeDefined();
  const cards = state.heroBar?.cards || [];
  expect(cards.length, 'Should have 4 hero cards').toBe(4);

  for (let i = 0; i < expectedNames.length; i++) {
    expect(cards[i].name, `Hero ${i} should be named ${expectedNames[i]}`).toBe(expectedNames[i]);
  }
});

// Selected hero panel name display
Then('the selected hero panel should show a hero name', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.selectedHeroPanel?.heroName, 'Panel should have a hero name').toBeDefined();
  expect(state.selectedHeroPanel?.heroName).not.toBeNull();
  expect(typeof state.selectedHeroPanel?.heroName, 'Hero name should be a string').toBe('string');
  expect(
    state.selectedHeroPanel?.heroName?.length,
    'Hero name should not be empty'
  ).toBeGreaterThan(0);
});

Then(
  'the selected hero panel hero name should match the first hero card name',
  async ({ page }) => {
    const state = await getGameState(page);
    const firstCardName = state.heroBar?.cards?.[0]?.name;
    const panelHeroName = state.selectedHeroPanel?.heroName;

    expect(firstCardName, 'First hero card should have a name').toBeDefined();
    expect(panelHeroName, 'Panel should show a hero name').toBeDefined();
    expect(panelHeroName, 'Panel hero name should match first card name').toBe(firstCardName);
  }
);
