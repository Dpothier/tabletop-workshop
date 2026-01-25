import { Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { OptionPrompt } from '@src/types/ParameterPrompt';

/**
 * Additional assertion steps for defensive reaction prompt tests.
 * These steps verify the prompt content contains attack stats.
 *
 * The background setup steps (monster, player, beads) and the
 * "monster attacks with power X, agility Y" step are provided
 * by defensive-reactions.steps.ts.
 */

interface DefensiveReactionPromptWorld extends QuickPickleWorld {
  capturedPrompts?: OptionPrompt[];
  lastAttackPower?: number;
  lastAttackAgility?: number;
}

// Assertion steps for prompt content verification
// Note: "the player should be prompted for defensive reactions" is provided by defensive-reactions.steps.ts

Then(
  'the defensive reaction prompt should contain the attack power value {string}',
  function (world: DefensiveReactionPromptWorld, powerValue: string) {
    expect(world.capturedPrompts).toBeDefined();
    expect(world.capturedPrompts!.length).toBeGreaterThan(0);

    const prompt = world.capturedPrompts![0];
    // Attack stats are now in the subtitle field
    expect(prompt.subtitle).toContain(`Power ${powerValue}`);
  }
);

Then(
  'the defensive reaction prompt should contain the attack agility value {string}',
  function (world: DefensiveReactionPromptWorld, agilityValue: string) {
    expect(world.capturedPrompts).toBeDefined();
    expect(world.capturedPrompts!.length).toBeGreaterThan(0);

    const prompt = world.capturedPrompts![0];
    // Attack stats are now in the subtitle field
    expect(prompt.subtitle).toContain(`Agility ${agilityValue}`);
  }
);

Then(
  'the defensive reaction prompt should contain {string} and {string}',
  function (world: DefensiveReactionPromptWorld, powerText: string, agilityText: string) {
    expect(world.capturedPrompts).toBeDefined();
    expect(world.capturedPrompts!.length).toBeGreaterThan(0);

    const prompt = world.capturedPrompts![0];
    // Attack stats are now in the subtitle field
    expect(prompt.subtitle).toContain(powerText);
    expect(prompt.subtitle).toContain(agilityText);
  }
);
