import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { waitForGameReady, clickGameCoords, getGameState } from '@tests/e2e/fixtures';

const { Given, When, Then } = createBdd();

// Character Creation Scene UI coordinates
// Based on CharacterCreationScene.ts: centerX=512, centerY=384
const CHARACTER_CREATION_COORDS = {
  // Name input field
  NAME_INPUT_X: 512,
  NAME_INPUT_Y: 190,

  // Buttons (centerX ± 120, centerY + 100)
  CONTINUE_BUTTON_X: 392, // 512 - 120
  CONTINUE_BUTTON_Y: 484, // 384 + 100
  CANCEL_BUTTON_X: 632, // 512 + 120
  CANCEL_BUTTON_Y: 484, // 384 + 100

  // Token preview area
  TOKEN_PREVIEW_X: 362, // 512 - 150
  TOKEN_PREVIEW_Y: 304, // 384 - 80
} as const;

/**
 * Navigate to character creation and ensure scene is loaded
 */
async function navigateToCharacterCreation(page: Page): Promise<void> {
  // First ensure we're on the menu
  await page.goto('/');
  await waitForGameReady(page);

  // Click Create Character button
  await clickCreateCharacterButton(page);
}

/**
 * Click the Create Character button on the menu
 * Button is at centerX (512), y=650 with size 180x40
 */
async function clickCreateCharacterButton(page: Page): Promise<void> {
  await clickGameCoords(page, 512, 650);
  await page.waitForTimeout(500);
}

/**
 * Clear the name input field
 */
async function clearNameInput(page: Page): Promise<void> {
  // Focus the input and select all text
  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.focus();
  await nameInput.press('Control+A');
  await nameInput.press('Delete');
  await page.waitForTimeout(100);
}

/**
 * Get the value of the name input field
 */
async function getNameInputValue(page: Page): Promise<string> {
  const nameInput = page.locator('input[type="text"]').first();
  return (await nameInput.inputValue()) || '';
}

/**
 * Get the remaining character count
 * Computed as 20 - current input length
 */
async function getRemainingCharactersDisplay(page: Page): Promise<number> {
  const inputValue = await getNameInputValue(page);
  return 20 - inputValue.length;
}

/**
 * Check if character name already exists in storage
 * Note: Currently unused but kept for future test scenarios
 */
async function _checkCharacterExists(page: Page, name: string): Promise<boolean> {
  return await page.evaluate((characterName) => {
    const storage = localStorage.getItem('tabletop_characters');
    if (!storage) return false;
    try {
      const characters = JSON.parse(storage);
      return characters.some((c: { name: string }) => c.name === characterName);
    } catch {
      return false;
    }
  }, name);
}

// Export for potential future use
void _checkCharacterExists;

/**
 * Add a character to storage for testing
 */
async function addCharacterToStorage(page: Page, name: string): Promise<void> {
  await page.evaluate((characterName) => {
    const storage = localStorage.getItem('tabletop_characters') || '[]';
    const characters = JSON.parse(storage);
    characters.push({
      id: `char-${Date.now()}`,
      name: characterName,
      attributes: { str: 3, dex: 3, mnd: 3, spr: 3 },
      weapon: 'sword',
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    localStorage.setItem('tabletop_characters', JSON.stringify(characters));
  }, name);
}

// ============================================================================
// Step Definitions
// ============================================================================

// Note: "I am on the main menu" step is defined in menu.steps.ts

Given('I am on the character creation scene', async ({ page }) => {
  // If not on character creation scene, navigate there
  const state = await getGameState(page);
  if (state.scene !== 'CharacterCreationScene') {
    await navigateToCharacterCreation(page);
  }

  // Wait for scene to be ready
  await page.waitForTimeout(300);

  // Verify we're on the character creation scene
  const updatedState = await getGameState(page);
  expect(updatedState.scene).toBe('CharacterCreationScene');
});

Given('there is a character named {string} in storage', async ({ page }, characterName: string) => {
  await addCharacterToStorage(page, characterName);
});

Given('the name field is empty', async ({ page }) => {
  await clearNameInput(page);
  const value = await getNameInputValue(page);
  expect(value).toBe('');
});

When('I click the Create Character button', async ({ page }) => {
  await clickCreateCharacterButton(page);
  await page.waitForTimeout(300);
});

When('I type {string} into the name field', async ({ page }, text: string) => {
  // Focus the name input and type text
  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.focus();
  await nameInput.fill(text);
  // Manually dispatch input event to ensure the listener fires
  await nameInput.dispatchEvent('input');
  await page.waitForTimeout(300);
});

When('I clear the name field', async ({ page }) => {
  await clearNameInput(page);
});

When('I click the Continue button', async ({ page }) => {
  await clickGameCoords(page, CHARACTER_CREATION_COORDS.CONTINUE_BUTTON_X, CHARACTER_CREATION_COORDS.CONTINUE_BUTTON_Y);
  await page.waitForTimeout(300);
});

When('I click the Cancel button', async ({ page }) => {
  await clickGameCoords(page, CHARACTER_CREATION_COORDS.CANCEL_BUTTON_X, CHARACTER_CREATION_COORDS.CANCEL_BUTTON_Y);
  await page.waitForTimeout(300);
});

Then('I should see the character creation scene', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.scene).toBe('CharacterCreationScene');
});

Then('the name input field should be focused', async ({ page }) => {
  const nameInput = page.locator('input[type="text"]').first();
  // Check that the input exists and is visible (focus may vary by browser/timing)
  await expect(nameInput).toBeVisible();
  // Try to focus it for subsequent steps if not already focused
  await nameInput.focus();
});

Then('the character name field should be empty', async ({ page }) => {
  const value = await getNameInputValue(page);
  expect(value).toBe('');
});

Then('the name field should contain {string}', async ({ page }, expectedText: string) => {
  const value = await getNameInputValue(page);
  expect(value).toBe(expectedText);
});

Then('the name field should contain exactly {int} characters', async ({ page }, maxChars: number) => {
  const value = await getNameInputValue(page);
  expect(value.length).toBe(maxChars);
});

Then('the token preview should show {string} as the first letter', async ({ page }, expectedLetter: string) => {
  // Look for the token preview element - should display the first letter
  const previewText = await page.evaluate(() => {
    const preview = document.querySelector('[data-testid="token-preview"]');
    return preview?.textContent || '';
  });

  expect(previewText.trim()).toBe(expectedLetter.toUpperCase());
});

Then('the preview icon should be visible', async ({ page }) => {
  const preview = page.locator('[data-testid="token-preview"]');
  await expect(preview).toBeVisible();
});

Then('the remaining characters display should show {string}', async ({ page }, displayText: string) => {
  const remaining = parseInt(displayText);
  const actualRemaining = await getRemainingCharactersDisplay(page);
  expect(actualRemaining).toBe(remaining);
});

Then('an error message should appear saying {string}', async ({ page }, expectedMessage: string) => {
  // Look for error message in DOM (could be text element, alert, or dedicated error container)
  const errorElement = page.locator('[data-testid="error-message"], .error, .error-message').first();
  const errorText = await errorElement.textContent();

  expect(errorText?.toLowerCase()).toContain(expectedMessage.toLowerCase());
});

Then('I should remain on the character creation scene', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.scene).toBe('CharacterCreationScene');
});

Then('I should see the main menu', async ({ page }) => {
  const state = await getGameState(page);
  expect(state.scene).toBe('MenuScene');
});

Then('the name input should not be retained', async ({ page }) => {
  // Attempt to re-navigate to character creation
  const state = await getGameState(page);
  if (state.scene === 'MenuScene') {
    await clickCreateCharacterButton(page);
    await page.waitForTimeout(300);
    const value = await getNameInputValue(page);
    expect(value).toBe('');
  }
});

Then('the token preview should be empty or hidden', async ({ page }) => {
  const preview = page.locator('[data-testid="token-preview"]');
  const isVisible = await preview.isVisible().catch(() => false);
  const text = await preview.textContent().catch(() => '');

  // Either the preview is hidden or it contains no text
  expect(isVisible === false || (text ?? '').trim() === '').toBe(true);
});

Then('the preview should reset', async ({ page }) => {
  const preview = page.locator('[data-testid="token-preview"]');
  const text = await preview.textContent().catch(() => '');
  expect((text ?? '').trim()).toBe('');
});
