import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { clickGameCoords } from '@tests/e2e/fixtures';

const { Then, When } = createBdd();

// Character Slots coordinates - 4 slots of 180w x 100h, 16px gap, centered on 1024px canvas
// Slot centers X: [218, 414, 610, 806]
// Slot centers Y: 470
const SLOT_COORDS = {
  SLOT_X: [218, 414, 610, 806],
  SLOT_Y: 470,
  // Slot dimensions for reference
  SLOT_WIDTH: 180,
  SLOT_HEIGHT: 100,
  SLOT_GAP: 16,
} as const;

/**
 * Interface for character slot state
 */
interface CharacterSlot {
  id: string | null;
  name: string | null;
  attributes: {
    str: number;
    dex: number;
    mnd: number;
    spr: number;
  } | null;
  weapon: string | null;
}

/**
 * Interface for character slots state
 */
interface CharacterSlotsState {
  slots: (CharacterSlot | null)[];
  canStartBattle: boolean;
}

/**
 * Get the character slots state from the game
 */
async function getCharacterSlotsState(page: any): Promise<CharacterSlotsState | null> {
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
          attributes: {
            str: number;
            dex: number;
            mnd: number;
            spr: number;
          };
          weapon: string;
        } | null)[];
        canStartBattle: boolean;
      };
    };

    return menuScene.characterSlotsState ?? null;
  });
}

Then('I should see 4 character slots', async ({ page }) => {
  const slotsState = await getCharacterSlotsState(page);
  expect(slotsState).not.toBeNull();
  expect(slotsState?.slots.length).toBe(4);
});

Then('slot {int} should display {string}', async ({ page }, slotNumber: number, expectedName: string) => {
  const slotsState = await getCharacterSlotsState(page);
  expect(slotsState).not.toBeNull();

  const slotIndex = slotNumber - 1;
  expect(slotIndex).toBeGreaterThanOrEqual(0);
  expect(slotIndex).toBeLessThan(4);

  const slot = slotsState!.slots[slotIndex];
  expect(slot).not.toBeNull();
  expect(slot?.name).toBe(expectedName);
});

Then('slot {int} should show the letter {string}', async ({ page }, slotNumber: number, expectedLetter: string) => {
  const slotsState = await getCharacterSlotsState(page);
  expect(slotsState).not.toBeNull();

  const slotIndex = slotNumber - 1;
  expect(slotIndex).toBeGreaterThanOrEqual(0);
  expect(slotIndex).toBeLessThan(4);

  const slot = slotsState!.slots[slotIndex];
  expect(slot).not.toBeNull();
  expect(slot?.name?.[0]).toBe(expectedLetter);
});

Then(
  'slot {int} should show attributes {string}',
  async ({ page }, slotNumber: number, expectedAttributes: string) => {
    const slotsState = await getCharacterSlotsState(page);
    expect(slotsState).not.toBeNull();

    const slotIndex = slotNumber - 1;
    expect(slotIndex).toBeGreaterThanOrEqual(0);
    expect(slotIndex).toBeLessThan(4);

    const slot = slotsState!.slots[slotIndex];
    expect(slot).not.toBeNull();
    expect(slot?.attributes).not.toBeNull();

    // Parse expected format: "S:5 D:2 M:1 R:1"
    const parts = expectedAttributes.split(' ');
    const expectedMap: Record<string, number> = {};
    for (const part of parts) {
      const [key, value] = part.split(':');
      expectedMap[key] = parseInt(value, 10);
    }

    const attrs = slot!.attributes!;
    expect(attrs.str).toBe(expectedMap['S']);
    expect(attrs.dex).toBe(expectedMap['D']);
    expect(attrs.mnd).toBe(expectedMap['M']);
    expect(attrs.spr).toBe(expectedMap['R']);
  }
);

When('I click character slot {int}', async ({ page }, slotNumber: number) => {
  expect(slotNumber).toBeGreaterThanOrEqual(1);
  expect(slotNumber).toBeLessThanOrEqual(4);

  const slotIndex = slotNumber - 1;
  const slotX = SLOT_COORDS.SLOT_X[slotIndex];
  const slotY = SLOT_COORDS.SLOT_Y;

  await clickGameCoords(page, slotX, slotY);
  await page.waitForTimeout(200);
});

Then('slot {int} should be empty', async ({ page }, slotNumber: number) => {
  const slotsState = await getCharacterSlotsState(page);
  expect(slotsState).not.toBeNull();

  const slotIndex = slotNumber - 1;
  expect(slotIndex).toBeGreaterThanOrEqual(0);
  expect(slotIndex).toBeLessThan(4);

  const slot = slotsState!.slots[slotIndex];
  expect(slot).toBeNull();
});

Then('the Start Battle button should be disabled', async ({ page }) => {
  const slotsState = await getCharacterSlotsState(page);
  expect(slotsState).not.toBeNull();
  expect(slotsState?.canStartBattle).toBe(false);
});

Then('the Start Battle button should be enabled', async ({ page }) => {
  const slotsState = await getCharacterSlotsState(page);
  expect(slotsState).not.toBeNull();
  expect(slotsState?.canStartBattle).toBe(true);
});
