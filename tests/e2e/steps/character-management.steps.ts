import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { clickGameCoords } from '@tests/e2e/fixtures';

const { When, Then } = createBdd();

// Character Management Panel coordinates
// Panel: 600x550, centered at (512, 384)
const MANAGEMENT_COORDS = {
  // Panel area (center)
  CENTER_X: 512,
  CENTER_Y: 384,
  WIDTH: 600,
  HEIGHT: 550,

  // Close button (X): top-right corner of panel, approximately (790, 131)
  CLOSE_BUTTON_X: 790,
  CLOSE_BUTTON_Y: 131,

  // Character rows: 4 items per page, row height 60px
  // Row 1: y = 229
  // Row 2: y = 289
  // Row 3: y = 349
  // Row 4: y = 409
  CHARACTER_ROWS: {
    ROW_1_Y: 229,
    ROW_2_Y: 289,
    ROW_3_Y: 349,
    ROW_4_Y: 409,
    CENTER_X: 512,
  },

  // Edit and Delete buttons per row
  // Edit button: right side at offset +170 from center = 682
  // Delete button: right side at offset +220 from center = 732
  EDIT_BUTTON_X: 682,
  DELETE_BUTTON_X: 732,

  // Manage Characters button on menu: centerX=512, Y=700
  MANAGE_BUTTON_X: 512,
  MANAGE_BUTTON_Y: 700,

  // Bottom buttons: y=594 or y=624
  // Export button: x=332, y=594
  // Import button: x=692, y=594
  // Close button (alt): x=512, y=624
  EXPORT_BUTTON_X: 332,
  EXPORT_BUTTON_Y: 594,
  IMPORT_BUTTON_X: 692,
  IMPORT_BUTTON_Y: 594,
  CLOSE_BUTTON_ALT_X: 512,
  CLOSE_BUTTON_ALT_Y: 624,
} as const;

/**
 * Interface for character management panel state
 */
interface CharacterManagementState {
  visible: boolean;
  characters: Array<{
    id: string;
    name: string;
    attributes: { str: number; dex: number; mnd: number; spr: number };
    weapon: string;
    isDefault: boolean;
    hasEditButton: boolean;
    hasDeleteButton: boolean;
    deleteDisabled: boolean;
  }>;
  currentPage: number;
  totalPages: number;
  confirmingDeleteId: string | null;
}

/**
 * Get the character management panel state from the game
 */
async function getCharacterManagementState(page: Page): Promise<CharacterManagementState | null> {
  return await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    if (!game) return null;

    const activeScene = game.scene.scenes.find((s: any) => s.sys.isActive());
    if (!activeScene) return null;

    const menuScene = activeScene as {
      characterManagementState?: CharacterManagementState;
    };

    return menuScene.characterManagementState ?? null;
  });
}

/**
 * Poll until the character management panel becomes visible.
 */
async function waitForManagementPanelVisible(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game?.scene?.scenes?.find((s: any) => s.sys.isActive());
      return (scene as any)?.characterManagementState?.visible === true;
    },
    undefined,
    { timeout: 5000 }
  );
}

/**
 * Helper: Get character row Y coordinate by position (1-4)
 */
function getCharacterRowY(position: number): number {
  switch (position) {
    case 1:
      return MANAGEMENT_COORDS.CHARACTER_ROWS.ROW_1_Y;
    case 2:
      return MANAGEMENT_COORDS.CHARACTER_ROWS.ROW_2_Y;
    case 3:
      return MANAGEMENT_COORDS.CHARACTER_ROWS.ROW_3_Y;
    case 4:
      return MANAGEMENT_COORDS.CHARACTER_ROWS.ROW_4_Y;
    default:
      throw new Error(`Invalid row position: ${position}`);
  }
}

/**
 * Helper: Get the page number (0-indexed) and row position (1-4) for a character by index
 */
function getPageAndRow(index: number): { page: number; row: number } {
  const page = Math.floor(index / 4);
  const row = (index % 4) + 1;
  return { page, row };
}

/**
 * Helper: Navigate to the correct page for a character in the management panel
 */
async function navigateToPage(page: Page, targetPage: number, currentPage: number): Promise<void> {
  // Pagination Next button at container (100, 110) → screen (612, 494)
  const NEXT_X = 612;
  const NEXT_Y = 494;
  while (currentPage < targetPage) {
    await clickGameCoords(page, NEXT_X, NEXT_Y);
    await page.waitForTimeout(200);
    currentPage++;
  }
}

// ============================================================================
// When Steps - Actions
// ============================================================================

When('I click the {string} button', async ({ page }, buttonName: string) => {
  if (buttonName === 'Manage Characters') {
    await clickGameCoords(
      page,
      MANAGEMENT_COORDS.MANAGE_BUTTON_X,
      MANAGEMENT_COORDS.MANAGE_BUTTON_Y
    );
    await page.waitForTimeout(300);
  } else {
    throw new Error(`Unknown button: ${buttonName}`);
  }
});

When('I click the Delete button for the custom character', async ({ page }) => {
  await waitForManagementPanelVisible(page);
  const state = await getCharacterManagementState(page);
  expect(state).not.toBeNull();
  expect(state?.visible).toBe(true);

  // Find the first custom character (non-default)
  const customIndex = state!.characters.findIndex((c) => !c.isDefault);
  expect(customIndex).toBeGreaterThanOrEqual(0);

  // Navigate to the correct page
  const { page: targetPage, row } = getPageAndRow(customIndex);
  await navigateToPage(page, targetPage, state!.currentPage);

  const y = getCharacterRowY(row);
  await clickGameCoords(page, MANAGEMENT_COORDS.DELETE_BUTTON_X, y);
  await page.waitForTimeout(200);
});

When('I confirm the deletion', async ({ page }) => {
  await waitForManagementPanelVisible(page);
  const state = await getCharacterManagementState(page);
  expect(state).not.toBeNull();
  expect(state?.confirmingDeleteId).not.toBeNull();

  // Find the row that's confirming deletion
  const confirmingIndex = state!.characters.findIndex((c) => c.id === state!.confirmingDeleteId);
  expect(confirmingIndex).toBeGreaterThanOrEqual(0);

  const { row } = getPageAndRow(confirmingIndex);
  const y = getCharacterRowY(row);

  // Yes button is at the Edit button position
  await clickGameCoords(page, MANAGEMENT_COORDS.EDIT_BUTTON_X, y);
  await page.waitForTimeout(300);
});

When('I cancel the deletion', async ({ page }) => {
  const state = await getCharacterManagementState(page);
  expect(state).not.toBeNull();
  expect(state?.confirmingDeleteId).not.toBeNull();

  // Find the row that's confirming deletion
  const confirmingIndex = state!.characters.findIndex((c) => c.id === state!.confirmingDeleteId);
  expect(confirmingIndex).toBeGreaterThanOrEqual(0);

  const { row } = getPageAndRow(confirmingIndex);
  const y = getCharacterRowY(row);

  // No button is at the Delete button position
  await clickGameCoords(page, MANAGEMENT_COORDS.DELETE_BUTTON_X, y);
  await page.waitForTimeout(200);
});

When('I click the Edit button for the custom character', async ({ page }) => {
  const state = await getCharacterManagementState(page);
  expect(state).not.toBeNull();
  expect(state?.visible).toBe(true);

  // Find the first custom character (non-default)
  const customIndex = state!.characters.findIndex((c) => !c.isDefault);
  expect(customIndex).toBeGreaterThanOrEqual(0);

  // Navigate to the correct page
  const { page: targetPage, row } = getPageAndRow(customIndex);
  await navigateToPage(page, targetPage, state!.currentPage);

  const y = getCharacterRowY(row);
  await clickGameCoords(page, MANAGEMENT_COORDS.EDIT_BUTTON_X, y);
  await page.waitForTimeout(500);
});

// ============================================================================
// Then Steps - Assertions
// ============================================================================

Then('I should see a {string} button', async ({ page }, buttonName: string) => {
  if (buttonName === 'Manage Characters') {
    // Check if the button is visible on the menu
    const state = await page.evaluate(() => {
      const game = window.__PHASER_GAME__;
      if (!game) return null;

      const activeScene = game.scene.scenes.find((s: any) => s.sys.isActive());
      if (!activeScene) return null;

      const menuScene = activeScene as {
        hasManageCharactersButton?: boolean;
      };

      return menuScene.hasManageCharactersButton ?? null;
    });

    expect(state).toBe(true);
  } else {
    throw new Error(`Unknown button: ${buttonName}`);
  }
});

Then('the character management panel should be visible', async ({ page }) => {
  const state = await getCharacterManagementState(page);
  expect(state).not.toBeNull();
  expect(state?.visible).toBe(true);
});

Then('the panel should display all characters', async ({ page }) => {
  const state = await getCharacterManagementState(page);
  expect(state).not.toBeNull();
  expect(state?.characters).toBeDefined();
  expect(Array.isArray(state?.characters)).toBe(true);
  expect(state?.characters.length).toBeGreaterThan(0);
});

Then('the panel should show character names and attributes', async ({ page }) => {
  const state = await getCharacterManagementState(page);
  expect(state).not.toBeNull();
  expect(state?.characters.length).toBeGreaterThan(0);

  // Check that each character has required fields
  for (const character of state?.characters || []) {
    expect(character.name).toBeDefined();
    expect(typeof character.name).toBe('string');
    expect(character.attributes).toBeDefined();
    expect(character.attributes.str).toBeDefined();
    expect(character.attributes.dex).toBeDefined();
    expect(character.attributes.mnd).toBeDefined();
    expect(character.attributes.spr).toBeDefined();
  }
});

Then('the panel should show character weapons', async ({ page }) => {
  const state = await getCharacterManagementState(page);
  expect(state).not.toBeNull();
  expect(state?.characters.length).toBeGreaterThan(0);

  // Check that each character has a weapon
  for (const character of state?.characters || []) {
    expect(character.weapon).toBeDefined();
    expect(typeof character.weapon).toBe('string');
  }
});

Then('default characters should not have Edit or Delete buttons', async ({ page }) => {
  const state = await getCharacterManagementState(page);
  expect(state).not.toBeNull();

  // Find all default characters
  const defaultCharacters = state?.characters.filter((c) => c.isDefault) || [];
  expect(defaultCharacters.length).toBeGreaterThan(0);

  // Check that none have Edit or Delete buttons
  for (const character of defaultCharacters) {
    expect(character.hasEditButton).toBe(false);
    expect(character.hasDeleteButton).toBe(false);
  }
});

Then('custom characters should have Edit and Delete buttons', async ({ page }) => {
  const state = await getCharacterManagementState(page);
  expect(state).not.toBeNull();

  // Find all custom characters
  const customCharacters = state?.characters.filter((c) => !c.isDefault) || [];
  expect(customCharacters.length).toBeGreaterThan(0);

  // Check that all have Edit and Delete buttons
  for (const character of customCharacters) {
    expect(character.hasEditButton).toBe(true);
    expect(character.hasDeleteButton).toBe(true);
  }
});

Then('the Delete button should be disabled for characters in the party', async ({ page }) => {
  const state = await getCharacterManagementState(page);
  expect(state).not.toBeNull();

  // Get characters that are in the party (from character slots)
  const partyCharacterIds = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    if (!game) return [];

    const activeScene = game.scene.scenes.find((s: any) => s.sys.isActive());
    if (!activeScene) return [];

    const menuScene = activeScene as {
      characterSlotsState?: {
        slots: ({ id: string } | null)[];
      };
    };

    const slots = menuScene.characterSlotsState?.slots || [];
    return slots.filter((slot) => slot !== null).map((slot) => (slot as { id: string }).id);
  });

  expect(partyCharacterIds.length).toBeGreaterThan(0);

  // Check that characters in party have Delete button disabled
  for (const partyId of partyCharacterIds) {
    const character = state?.characters.find((c) => c.id === partyId);
    if (character && !character.isDefault) {
      expect(character.deleteDisabled).toBe(true);
    }
  }
});

Then('I should see a delete confirmation message', async ({ page }) => {
  const state = await getCharacterManagementState(page);
  expect(state).not.toBeNull();
  expect(state?.confirmingDeleteId).not.toBeNull();
});

Then('the custom character should be removed from the list', async ({ page }) => {
  const state = await getCharacterManagementState(page);
  expect(state).not.toBeNull();

  // Confirming delete ID should be null (deletion complete)
  expect(state?.confirmingDeleteId).toBeNull();

  // The custom character should no longer be in the list
  const customCharacters = state?.characters.filter((c) => !c.isDefault) || [];
  expect(customCharacters.length).toBe(0);
});

Then('the custom character should still be in the list', async ({ page }) => {
  const state = await getCharacterManagementState(page);
  expect(state).not.toBeNull();

  // Confirming delete ID should be null (deletion cancelled)
  expect(state?.confirmingDeleteId).toBeNull();

  // The custom character should still be in the list
  const customCharacters = state?.characters.filter((c) => !c.isDefault) || [];
  expect(customCharacters.length).toBeGreaterThan(0);
});

Then('I should be on the character creation scene', async ({ page }) => {
  await page.waitForTimeout(300);

  const currentScene = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    if (!game) return null;

    const activeScene = game.scene.scenes.find((s: any) => s.sys.isActive());
    if (!activeScene) return null;

    return activeScene.sys.settings.key;
  });

  expect(currentScene).toBe('CharacterCreationScene');
});

Then('the character name should be pre-filled', async ({ page }) => {
  // The name input should have a value from the edited character
  const nameInputValue = await page.evaluate(() => {
    const input = document.getElementById('character-name') as HTMLInputElement;
    return input ? input.value : null;
  });

  expect(nameInputValue).not.toBeNull();
  expect(typeof nameInputValue).toBe('string');
  expect(nameInputValue!.length).toBeGreaterThan(0);
});
