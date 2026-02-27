import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { clickGameCoords } from '@tests/e2e/fixtures';

const { Given, When, Then } = createBdd();

// Character Selection Popup coordinates
// Popup bounds: 500w × 450h, centered at (512, 384), so top-left=(262, 159), bottom-right=(762, 609)
const POPUP_COORDS = {
  // Popup area (center)
  CENTER_X: 512,
  CENTER_Y: 384,
  WIDTH: 500,
  HEIGHT: 450,

  // X close button: top-right of popup, around (740, 180), clickable area ~30x30
  CLOSE_BUTTON_X: 740,
  CLOSE_BUTTON_Y: 180,

  // Character list: starts at y ≈ 230, each row 50px tall, centered at x=512
  // Row 1 (Warrior): y=250
  // Row 2 (Mage): y=300
  // Row 3 (Rogue): y=350
  // Row 4 (Cleric): y=400
  CHARACTER_LIST: {
    WARRIOR_Y: 250,
    MAGE_Y: 300,
    ROGUE_Y: 350,
    CLERIC_Y: 400,
    CENTER_X: 512,
  },

  // Remove button: y ≈ 530, x=420
  REMOVE_BUTTON_X: 420,
  REMOVE_BUTTON_Y: 530,

  // Create New button: y ≈ 530, x=600
  CREATE_NEW_BUTTON_X: 600,
  CREATE_NEW_BUTTON_Y: 530,

  // Click outside popup to close: at (100, 100) which is outside the popup bounds
  OUTSIDE_X: 100,
  OUTSIDE_Y: 100,

  // Pagination controls: between character list and action buttons
  // Container coords (prev: -100,90, text: 0,90, next: 100,90) → screen coords
  PAGINATION: {
    PREV_X: 412,
    PREV_Y: 474,
    TEXT_X: 512,
    TEXT_Y: 474,
    NEXT_X: 612,
    NEXT_Y: 474,
  },
} as const;

/**
 * Interface for character popup state
 */
interface CharacterPopupState {
  visible: boolean;
  slotIndex: number;
  characters: Array<{
    id: string;
    name: string;
    attributes: { str: number; dex: number; mnd: number; spr: number };
    weapon: string;
    isDefault: boolean;
    available: boolean;
  }>;
  hasRemoveButton: boolean;
  currentPage: number;
  totalPages: number;
  visibleCount: number;
}

/**
 * Get the character popup state from the game
 */
async function getCharacterPopupState(page: Page): Promise<CharacterPopupState | null> {
  return await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    if (!game) return null;

    const activeScene = game.scene.scenes.find((s: any) => s.sys.isActive());
    if (!activeScene) return null;

    const menuScene = activeScene as {
      characterPopupState?: CharacterPopupState;
    };

    return menuScene.characterPopupState ?? null;
  });
}

/**
 * Get character slot state for assertion
 */
async function getCharacterSlotsState(page: Page) {
  return await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    if (!game) return null;

    const activeScene = game.scene.scenes.find((s: any) => s.sys.isActive());
    if (!activeScene) return null;

    const menuScene = activeScene as {
      characterSlotsState?: {
        slots: ({
          id: string;
          name: string;
          attributes: { str: number; dex: number; mnd: number; spr: number };
          weapon: string;
        } | null)[];
        canStartBattle: boolean;
      };
    };

    return menuScene.characterSlotsState ?? null;
  });
}

/**
 * Helper: Get popup row Y coordinate by character name
 */
function getCharacterRowY(characterName: string): number {
  const name = characterName.toLowerCase();
  if (name === 'warrior') return POPUP_COORDS.CHARACTER_LIST.WARRIOR_Y;
  if (name === 'mage') return POPUP_COORDS.CHARACTER_LIST.MAGE_Y;
  if (name === 'rogue') return POPUP_COORDS.CHARACTER_LIST.ROGUE_Y;
  if (name === 'cleric') return POPUP_COORDS.CHARACTER_LIST.CLERIC_Y;
  throw new Error(`Unknown character: ${characterName}`);
}

// ============================================================================
// Given Steps - Setup
// ============================================================================

Given('there are {int} custom characters in storage', async ({ page }, count: number) => {
  const characters = [];
  // Always include the 4 defaults
  const defaults = [
    { id: 'default-warrior', name: 'Warrior', attributes: { str: 5, dex: 2, mnd: 1, spr: 1 }, weapon: 'sword', isDefault: true, createdAt: 0, updatedAt: 0 },
    { id: 'default-mage', name: 'Mage', attributes: { str: 1, dex: 1, mnd: 5, spr: 2 }, weapon: 'staff', isDefault: true, createdAt: 0, updatedAt: 0 },
    { id: 'default-rogue', name: 'Rogue', attributes: { str: 2, dex: 5, mnd: 2, spr: 1 }, weapon: 'dagger', isDefault: true, createdAt: 0, updatedAt: 0 },
    { id: 'default-cleric', name: 'Cleric', attributes: { str: 2, dex: 2, mnd: 3, spr: 3 }, weapon: 'mace', isDefault: true, createdAt: 0, updatedAt: 0 },
  ];
  characters.push(...defaults);
  // Add custom characters
  for (let i = 0; i < count; i++) {
    characters.push({
      id: `custom-${i}`,
      name: `Custom Hero ${i + 1}`,
      attributes: { str: 3, dex: 3, mnd: 2, spr: 2 },
      weapon: 'sword',
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  await page.evaluate((chars) => {
    localStorage.setItem('tabletop_characters', JSON.stringify(chars));
  }, characters);
  // Reload page to pick up new characters
  await page.reload();
  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForTimeout(500);
});

// ============================================================================
// When Steps - Actions
// ============================================================================

When('I click the {string} character in the popup', async ({ page }, characterName: string) => {
  const popupState = await getCharacterPopupState(page);
  expect(popupState).not.toBeNull();
  expect(popupState?.visible).toBe(true);

  const y = getCharacterRowY(characterName);
  const x = POPUP_COORDS.CHARACTER_LIST.CENTER_X;

  await clickGameCoords(page, x, y);
  await page.waitForTimeout(200);
});

When('I click the Remove button in the popup', async ({ page }) => {
  const popupState = await getCharacterPopupState(page);
  expect(popupState).not.toBeNull();
  expect(popupState?.visible).toBe(true);
  expect(popupState?.hasRemoveButton).toBe(true);

  await clickGameCoords(page, POPUP_COORDS.REMOVE_BUTTON_X, POPUP_COORDS.REMOVE_BUTTON_Y);
  await page.waitForTimeout(200);
});

When('I click the close button in the popup', async ({ page }) => {
  const popupState = await getCharacterPopupState(page);
  expect(popupState).not.toBeNull();
  expect(popupState?.visible).toBe(true);

  await clickGameCoords(page, POPUP_COORDS.CLOSE_BUTTON_X, POPUP_COORDS.CLOSE_BUTTON_Y);
  await page.waitForTimeout(200);
});

When('I click outside the popup', async ({ page }) => {
  const popupState = await getCharacterPopupState(page);
  expect(popupState).not.toBeNull();
  expect(popupState?.visible).toBe(true);

  await clickGameCoords(page, POPUP_COORDS.OUTSIDE_X, POPUP_COORDS.OUTSIDE_Y);
  await page.waitForTimeout(200);
});

When('I click the {string} button in the popup', async ({ page }, buttonName: string) => {
  const popupState = await getCharacterPopupState(page);
  expect(popupState).not.toBeNull();
  expect(popupState?.visible).toBe(true);

  if (buttonName === 'Create New') {
    await clickGameCoords(page, POPUP_COORDS.CREATE_NEW_BUTTON_X, POPUP_COORDS.CREATE_NEW_BUTTON_Y);
  } else {
    throw new Error(`Unknown button: ${buttonName}`);
  }

  await page.waitForTimeout(500);
});

When('I click the Next page button in the popup', async ({ page }) => {
  await clickGameCoords(page, POPUP_COORDS.PAGINATION.NEXT_X, POPUP_COORDS.PAGINATION.NEXT_Y);
  await page.waitForTimeout(200);
});

When('I click the Prev page button in the popup', async ({ page }) => {
  await clickGameCoords(page, POPUP_COORDS.PAGINATION.PREV_X, POPUP_COORDS.PAGINATION.PREV_Y);
  await page.waitForTimeout(200);
});

When('I click the first character on the current page', async ({ page }) => {
  // First character row is always at the same Y position (row 1 = 250)
  await clickGameCoords(page, POPUP_COORDS.CHARACTER_LIST.CENTER_X, POPUP_COORDS.CHARACTER_LIST.WARRIOR_Y);
  await page.waitForTimeout(200);
});

// ============================================================================
// Then Steps - Assertions
// ============================================================================

Then('the character selection popup should be visible', async ({ page }) => {
  const popupState = await getCharacterPopupState(page);
  expect(popupState).not.toBeNull();
  expect(popupState?.visible).toBe(true);
});

Then('the popup should be visible', async ({ page }) => {
  const popupState = await getCharacterPopupState(page);
  expect(popupState).not.toBeNull();
  expect(popupState?.visible).toBe(true);
});

Then('the popup should close', async ({ page }) => {
  await page.waitForTimeout(300);
  const popupState = await getCharacterPopupState(page);
  expect(popupState).toBeNull();
});

Then('the popup should display the character list', async ({ page }) => {
  const popupState = await getCharacterPopupState(page);
  expect(popupState).not.toBeNull();
  expect(popupState?.characters).toBeDefined();
  expect(Array.isArray(popupState?.characters)).toBe(true);
  expect(popupState?.characters.length).toBeGreaterThan(0);
});

Then('the popup should not show a Remove button', async ({ page }) => {
  const popupState = await getCharacterPopupState(page);
  expect(popupState).not.toBeNull();
  expect(popupState?.hasRemoveButton).toBe(false);
});

Then('the popup should display the Remove button', async ({ page }) => {
  const popupState = await getCharacterPopupState(page);
  expect(popupState).not.toBeNull();
  expect(popupState?.hasRemoveButton).toBe(true);
});

Then('the character {string} should be unavailable \\(grayed out\\) in the popup', async ({ page }, characterName: string) => {
  const popupState = await getCharacterPopupState(page);
  expect(popupState).not.toBeNull();

  const character = popupState?.characters.find(
    (c) => c.name.toLowerCase() === characterName.toLowerCase()
  );
  expect(character).toBeDefined();
  expect(character?.available).toBe(false);
});

Then('slot {int} should still display {string}', async ({ page }, slotNumber: number, expectedName: string) => {
  const slotsState = await getCharacterSlotsState(page);
  expect(slotsState).not.toBeNull();

  const slotIndex = slotNumber - 1;
  expect(slotIndex).toBeGreaterThanOrEqual(0);
  expect(slotIndex).toBeLessThan(4);

  const slot = slotsState!.slots[slotIndex];
  expect(slot).not.toBeNull();
  expect(slot?.name).toBe(expectedName);
});

Then('the popup should show pagination controls', async ({ page }) => {
  const popupState = await getCharacterPopupState(page);
  expect(popupState).not.toBeNull();
  expect(popupState!.totalPages).toBeGreaterThan(1);
});

Then('the popup should not show pagination controls', async ({ page }) => {
  const popupState = await getCharacterPopupState(page);
  expect(popupState).not.toBeNull();
  expect(popupState!.totalPages).toBeLessThanOrEqual(1);
});

Then('the popup should display {string}', async ({ page }, pageText: string) => {
  const popupState = await getCharacterPopupState(page);
  expect(popupState).not.toBeNull();
  // pageText is like "Page 1/3" — extract page number and total
  const match = pageText.match(/Page (\d+)\/(\d+)/);
  expect(match).not.toBeNull();
  const expectedPage = parseInt(match![1]);
  const expectedTotal = parseInt(match![2]);
  // State uses 0-indexed currentPage
  expect(popupState!.currentPage + 1).toBe(expectedPage);
  expect(popupState!.totalPages).toBe(expectedTotal);
});

Then('the popup should display {int} characters on the current page', async ({ page }, expectedCount: number) => {
  const popupState = await getCharacterPopupState(page);
  expect(popupState).not.toBeNull();
  expect(popupState!.visibleCount).toBe(expectedCount);
});

Then('slot {int} should not be empty', async ({ page }, slotNumber: number) => {
  const slotsState = await getCharacterSlotsState(page);
  expect(slotsState).not.toBeNull();
  const slotIndex = slotNumber - 1;
  expect(slotsState!.slots[slotIndex]).not.toBeNull();
});
