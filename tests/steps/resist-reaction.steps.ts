import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid } from '@src/state/BattleGrid';
import { Character } from '@src/entities/Character';
import { MonsterEntity } from '@src/entities/MonsterEntity';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import { buildDefensiveOptions } from '@src/combat/AttackResolvers';
import type { OptionChoice } from '@src/types/ParameterPrompt';

interface ResistReactionWorld extends QuickPickleWorld {
  grid?: BattleGrid;
  defEntities?: Map<string, Character | MonsterEntity>;
  playerBeadSystem?: PlayerBeadSystem;
  capturedOptions?: OptionChoice[];
  currentAttackType?: 'melee' | 'ranged' | 'magical';
  defenderWardBefore?: number;
  defenderWardAfter?: number;
  selectedReaction?: string[] | null;
}

// Background steps

Given(
  'a magical caster {string} at position {int},{int}',
  function (world: ResistReactionWorld, casterId: string, x: number, y: number) {
    if (!world.grid) {
      world.grid = new BattleGrid(9, 9);
    }
    if (!world.defEntities) {
      world.defEntities = new Map();
    }

    const caster = new MonsterEntity(casterId, 10, world.grid);
    world.grid.register(casterId, x, y);
    world.defEntities.set(casterId, caster);
    world.currentAttackType = 'magical';
  }
);

// Bead setup steps

Given(
  'the defender has {int} white bead in hand',
  function (world: ResistReactionWorld, count: number) {
    world.playerBeadSystem = new PlayerBeadSystem({ red: 0, blue: 0, green: 0, white: count });
    world.playerBeadSystem.drawToHand(count);
  }
);

Given(
  'the defender has {int} white beads in hand',
  function (world: ResistReactionWorld, count: number) {
    if (count === 0) {
      // Create with 1 red bead in bag only (not drawn) so pool isn't empty
      world.playerBeadSystem = new PlayerBeadSystem({ red: 1, blue: 0, green: 0, white: 0 });
    } else {
      world.playerBeadSystem = new PlayerBeadSystem({ red: 0, blue: 0, green: 0, white: count });
      world.playerBeadSystem.drawToHand(count);
    }
  }
);

Given(
  'the defender has {int} red bead and {int} white beads in hand',
  function (world: ResistReactionWorld, redCount: number, whiteCount: number) {
    world.playerBeadSystem = new PlayerBeadSystem({
      red: redCount,
      blue: 0,
      green: 0,
      white: whiteCount,
    });
    world.playerBeadSystem.drawToHand(redCount + whiteCount);
  }
);

Given(
  'the defender has {int} red bead and {int} white bead in hand',
  function (world: ResistReactionWorld, redCount: number, whiteCount: number) {
    world.playerBeadSystem = new PlayerBeadSystem({
      red: redCount,
      blue: 0,
      green: 0,
      white: whiteCount,
    });
    world.playerBeadSystem.drawToHand(redCount + whiteCount);
  }
);

Given('the defender has innate ward of {int}', function (world: ResistReactionWorld, ward: number) {
  const defender = world.defEntities?.get('hero-0') as Character;
  if (defender) {
    defender.setWard(ward);
    world.defenderWardBefore = ward;
  }
});

// Attack steps

When('the magical attack triggers defensive reactions', function (world: ResistReactionWorld) {
  world.currentAttackType = 'magical';
  const defender = world.defEntities?.get('hero-0') as Character;

  if (defender && world.playerBeadSystem) {
    world.defenderWardBefore = defender.getWard();

    const handCounts = world.playerBeadSystem.getHandCounts();
    const options = buildDefensiveOptions(handCounts, 'magical');
    world.capturedOptions = options;
  }
});

When('the defender chooses resist', function (world: ResistReactionWorld) {
  const defender = world.defEntities?.get('hero-0') as Character;

  if (defender && world.playerBeadSystem) {
    // Spend 1 white bead for resist
    world.playerBeadSystem.spend('white');
    // Add +1 ward
    defender.setWard(defender.getWard() + 1);
    world.defenderWardAfter = defender.getWard();
    world.selectedReaction = ['resist-1'];
  }
});

// Assertion steps

Then(
  'the defender ward should be {int}',
  function (world: ResistReactionWorld, expectedWard: number) {
    const defender = world.defEntities?.get('hero-0') as Character;
    expect(defender).toBeDefined();
    expect(defender!.getWard()).toBe(expectedWard);
  }
);

Then(
  'the defender should have {int} white bead remaining',
  function (world: ResistReactionWorld, expectedCount: number) {
    expect(world.playerBeadSystem).toBeDefined();
    const counts = world.playerBeadSystem!.getHandCounts();
    expect(counts.white).toBe(expectedCount);
  }
);

Then(
  'the defender should have {int} white beads remaining',
  function (world: ResistReactionWorld, expectedCount: number) {
    expect(world.playerBeadSystem).toBeDefined();
    const counts = world.playerBeadSystem!.getHandCounts();
    expect(counts.white).toBe(expectedCount);
  }
);

Then('resist should not be available as an option', function (world: ResistReactionWorld) {
  expect(world.capturedOptions).toBeDefined();
  const hasResistOption = world.capturedOptions!.some((opt) => opt.id.startsWith('resist'));
  expect(hasResistOption).toBe(false);
});

Then('only one resist option should be offered', function (world: ResistReactionWorld) {
  expect(world.capturedOptions).toBeDefined();
  const resistOptions = world.capturedOptions!.filter((opt) => opt.id.startsWith('resist'));
  expect(resistOptions).toHaveLength(1);
  expect(resistOptions[0].id).toBe('resist-1');
});
