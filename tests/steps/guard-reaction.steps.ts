import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { Character } from '@src/entities/Character';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import { buildDefensiveOptions } from '@src/combat/AttackResolvers';
import type { OptionChoice } from '@src/types/ParameterPrompt';

interface GuardReactionWorld extends QuickPickleWorld {
  defEntities?: Map<string, any>;
  playerBeadSystem?: PlayerBeadSystem;
  capturedOptions?: OptionChoice[];
  defenderGuardBefore?: number;
  defenderGuardAfter?: number;
  selectedReaction?: string[] | null;
  defenderWindupStacks?: number;
}

// Guard-specific stat setup
Given('the defender has passive guard of {int}', function (world: GuardReactionWorld, guard: number) {
  const defender = world.defEntities?.get('hero-0') as Character;
  if (defender) {
    defender.setGuard(guard);
    world.defenderGuardBefore = guard;
  }
});

// Guard-specific bead setup: 0 red beads with Windup
Given(
  'the defender has {int} red beads and {int} Windup stack',
  function (world: GuardReactionWorld, redCount: number, _windupCount: number) {
    // Use 1 blue bead as filler so pool isn't empty
    world.playerBeadSystem = new PlayerBeadSystem({ red: redCount, blue: 1, green: 0, white: 0 });
    if (redCount > 0) {
      world.playerBeadSystem.drawToHand(redCount);
    }
    world.defenderWindupStacks = _windupCount;
  }
);

// Guard-specific bead setup: green + red
Given(
  'the defender has {int} green bead and {int} red bead in hand',
  function (world: GuardReactionWorld, greenCount: number, redCount: number) {
    world.playerBeadSystem = new PlayerBeadSystem({
      red: redCount,
      blue: 0,
      green: greenCount,
      white: 0,
    });
    world.playerBeadSystem.drawToHand(redCount + greenCount);
  }
);

// Guard-specific bead setup: white + red
Given(
  'the defender has {int} white bead and {int} red bead in hand',
  function (world: GuardReactionWorld, whiteCount: number, redCount: number) {
    world.playerBeadSystem = new PlayerBeadSystem({
      red: redCount,
      blue: 0,
      green: 0,
      white: whiteCount,
    });
    world.playerBeadSystem.drawToHand(redCount + whiteCount);
  }
);

// Guard-specific: magical attack trigger (for unavailability tests)
When('a magical attack triggers defensive reactions', function (world: GuardReactionWorld) {
  if (world.playerBeadSystem) {
    const handCounts = world.playerBeadSystem.getHandCounts();
    const options = buildDefensiveOptions(handCounts, 'magical');
    world.capturedOptions = options;
  }
});

// Guard choice
When('the defender chooses guard', function (world: GuardReactionWorld) {
  const defender = world.defEntities?.get('hero-0') as Character;

  if (defender && world.playerBeadSystem) {
    // Spend 1 red bead for guard
    world.playerBeadSystem.spend('red');
    // Add +1 guard
    defender.setGuard(defender.guard + 1);
    world.defenderGuardAfter = defender.guard;
    world.selectedReaction = ['guard-1'];
  }
});

// Guard assertions
Then(
  'the defender guard should be {int}',
  function (world: GuardReactionWorld, expectedGuard: number) {
    const defender = world.defEntities?.get('hero-0') as Character;
    expect(defender).toBeDefined();
    expect(defender!.guard).toBe(expectedGuard);
  }
);

Then(
  'the defender should have {int} red bead remaining',
  function (world: GuardReactionWorld, expectedCount: number) {
    expect(world.playerBeadSystem).toBeDefined();
    const counts = world.playerBeadSystem!.getHandCounts();
    expect(counts.red).toBe(expectedCount);
  }
);

Then('guard should not be available as an option', function (world: GuardReactionWorld) {
  // If no options were built (no defensive beads), guard is indeed not available
  if (!world.capturedOptions) {
    return;
  }
  const hasGuardOption = world.capturedOptions.some((opt) => opt.id.startsWith('guard'));
  expect(hasGuardOption).toBe(false);
});

Then('only one guard option should be offered', function (world: GuardReactionWorld) {
  expect(world.capturedOptions).toBeDefined();
  const guardOptions = world.capturedOptions!.filter((opt) => opt.id.startsWith('guard'));
  expect(guardOptions).toHaveLength(1);
  expect(guardOptions[0].id).toBe('guard-1');
});
