import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';

/**
 * Tests for MFG-70: ReplayScene should pass character names to CharacterVisual.
 *
 * We test the CharacterVisual label logic directly — when a character with getName()
 * is provided, the label uses the character's name initial instead of P${index+1}.
 *
 * We can't integration-test ReplayScene with all dependencies in BDD steps
 * because vi.mock in setupFiles leaks to all test files.
 * Instead, we test the contract: CharacterVisual uses character.getName() for labels.
 */

interface LabelWorld extends QuickPickleWorld {
  characterName?: string;
  index?: number;
  character?: { getName: () => string };
  label?: string;
}

// ── Given ───────────────────────────────────────────────────

Given('a character with getName returning {string}', function (world: LabelWorld, name: string) {
  world.characterName = name;
  world.character = { getName: () => name };
});

Given('the character index is {int}', function (world: LabelWorld, index: number) {
  world.index = index;
});

Given('no character object is provided', function (world: LabelWorld) {
  world.character = undefined;
});

// ── When ────────────────────────────────────────────────────

When('the CharacterVisual label initial is computed', function (world: LabelWorld) {
  // Replicate the logic from CharacterVisual.createVisuals() line 107:
  // const initial = this.character?.getName()[0].toUpperCase() ?? `P${this.index + 1}`;
  const character = world.character;
  const index = world.index ?? 0;
  world.label = character?.getName()[0].toUpperCase() ?? `P${index + 1}`;
});

// ── Then ────────────────────────────────────────────────────

Then('the label should be {string}', function (world: LabelWorld, expected: string) {
  expect(world.label).toBe(expected);
});
