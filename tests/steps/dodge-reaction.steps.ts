import { Given, When, Then } from 'quickpickle';
import { expect, vi } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid } from '@src/state/BattleGrid';
import { Character } from '@src/entities/Character';
import { MonsterEntity } from '@src/entities/MonsterEntity';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import { buildDefensiveOptions } from '@src/combat/AttackResolvers';
import type { OptionPrompt, OptionChoice } from '@src/types/ParameterPrompt';
import type { BattleAdapter } from '@src/types/BattleAdapter';

interface DodgeReactionWorld extends QuickPickleWorld {
  grid?: BattleGrid;
  defEntities?: Map<string, Character | MonsterEntity>;
  playerBeadSystem?: PlayerBeadSystem;
  battleAdapter?: BattleAdapter;
  capturedPrompts?: OptionPrompt[];
  selectedReaction?: string[] | null;
  defenderEvasionBefore?: number;
  defenderEvasionAfter?: number;
  defenderGuardBefore?: number;
  defenderGuardAfter?: number;
  defenderWindupStacks?: number;
  capturedOptions?: OptionChoice[];
  currentAttackType?: 'melee' | 'ranged' | 'magical';
}

// Background steps

Given(
  'a melee attacker {string} at position {int},{int}',
  function (world: DodgeReactionWorld, monsterId: string, x: number, y: number) {
    if (!world.grid) {
      world.grid = new BattleGrid(9, 9);
    }
    if (!world.defEntities) {
      world.defEntities = new Map();
    }

    const monster = new MonsterEntity(monsterId, 10, world.grid);
    world.grid.register(monsterId, x, y);
    world.defEntities.set(monsterId, monster);
    world.currentAttackType = 'melee';
  }
);

Given(
  'a defending character {string} at position {int},{int}',
  function (world: DodgeReactionWorld, characterId: string, x: number, y: number) {
    if (!world.grid) {
      world.grid = new BattleGrid(9, 9);
    }
    if (!world.defEntities) {
      world.defEntities = new Map();
    }

    const character = new Character(characterId, 10, world.grid, {
      getEntity: () => undefined,
    } as any);
    character.initializeBeadHand();
    world.grid.register(characterId, x, y);
    world.defEntities.set(characterId, character);

    world.playerBeadSystem = character.getBeadHand()!;
  }
);

// Bead setup steps

Given(
  'the defender has {int} green bead in hand',
  function (world: DodgeReactionWorld, count: number) {
    world.playerBeadSystem = new PlayerBeadSystem({ red: 0, blue: 0, green: count, white: 0 });
    world.playerBeadSystem.drawToHand(count);
  }
);

Given(
  'the defender has {int} green beads in hand',
  function (world: DodgeReactionWorld, count: number) {
    world.playerBeadSystem = new PlayerBeadSystem({ red: 0, blue: 0, green: count, white: 0 });
    world.playerBeadSystem.drawToHand(count);
  }
);

Given(
  'the defender has {int} red bead in hand',
  function (world: DodgeReactionWorld, count: number) {
    world.playerBeadSystem = new PlayerBeadSystem({ red: count, blue: 0, green: 0, white: 0 });
    world.playerBeadSystem.drawToHand(count);
  }
);

Given(
  'the defender has {int} red beads in hand',
  function (world: DodgeReactionWorld, count: number) {
    world.playerBeadSystem = new PlayerBeadSystem({ red: count, blue: 0, green: 0, white: 0 });
    world.playerBeadSystem.drawToHand(count);
  }
);

Given(
  'the defender has {int} red bead and {int} green beads in hand',
  function (world: DodgeReactionWorld, redCount: number, greenCount: number) {
    world.playerBeadSystem = new PlayerBeadSystem({
      red: redCount,
      blue: 0,
      green: greenCount,
      white: 0,
    });
    world.playerBeadSystem.drawToHand(redCount + greenCount);
  }
);

Given(
  'the defender has {int} red bead and {int} green bead in hand',
  function (world: DodgeReactionWorld, redCount: number, greenCount: number) {
    world.playerBeadSystem = new PlayerBeadSystem({
      red: redCount,
      blue: 0,
      green: greenCount,
      white: 0,
    });
    world.playerBeadSystem.drawToHand(redCount + greenCount);
  }
);

Given(
  'the defender has passive evasion of {int}',
  function (world: DodgeReactionWorld, evasion: number) {
    const defender = world.defEntities?.get('hero-0') as Character;
    if (defender) {
      defender.setEvasion(evasion);
      world.defenderEvasionBefore = evasion;
    }
  }
);

Given('the defender has {int} Windup stack', function (world: DodgeReactionWorld, count: number) {
  world.defenderWindupStacks = count;
  // Windup preparation stacks are stored on the character but cannot be used for bead costs
});

// Mock BattleAdapter

function createMockBattleAdapter(world: DodgeReactionWorld): BattleAdapter {
  if (!world.capturedPrompts) {
    world.capturedPrompts = [];
  }

  return {
    promptTile: vi.fn(async () => null),
    promptEntity: vi.fn(async () => null),
    promptOptions: vi.fn(async (prompt: OptionPrompt) => {
      world.capturedPrompts!.push(prompt);
      world.capturedOptions = prompt.options;
      return world.selectedReaction || null;
    }),
    animate: vi.fn(async () => {}),
    log: vi.fn(),
    showPlayerTurn: vi.fn(),
    awaitPlayerAction: vi.fn(async () => 'attack'),
    transition: vi.fn(),
    delay: vi.fn(async () => {}),
    notifyBeadsChanged: vi.fn(),
  };
}

// Attack steps

When('the melee attack triggers defensive reactions', function (world: DodgeReactionWorld) {
  world.currentAttackType = 'melee';
  world.battleAdapter = createMockBattleAdapter(world);
  const defender = world.defEntities?.get('hero-0') as Character;

  if (defender && world.playerBeadSystem) {
    world.defenderEvasionBefore = defender.evasion;
    world.defenderGuardBefore = defender.guard;

    const handCounts = world.playerBeadSystem.getHandCounts();
    if (handCounts.red > 0 || handCounts.green > 0) {
      // Call buildDefensiveOptions with 'melee' attack type
      const options = buildDefensiveOptions(handCounts, 'melee');
      world.capturedOptions = options;

      const prompt: OptionPrompt = {
        type: 'option',
        key: 'defensiveReaction',
        prompt: 'Incoming Attack! Boost your defenses?',
        subtitle: '⚔ Power 5    💨 Agility 2',
        optional: true,
        multiSelect: false,
        options,
      };

      world.capturedPrompts = [prompt];
    }
  }
});

When('a ranged attack triggers defensive reactions', function (world: DodgeReactionWorld) {
  world.currentAttackType = 'ranged';
  world.battleAdapter = createMockBattleAdapter(world);
  const defender = world.defEntities?.get('hero-0') as Character;

  if (defender && world.playerBeadSystem) {
    world.defenderEvasionBefore = defender.evasion;
    world.defenderGuardBefore = defender.guard;

    const handCounts = world.playerBeadSystem.getHandCounts();
    if (handCounts.red > 0 || handCounts.green > 0) {
      // Call buildDefensiveOptions with 'ranged' attack type
      const options = buildDefensiveOptions(handCounts, 'ranged');
      world.capturedOptions = options;

      const prompt: OptionPrompt = {
        type: 'option',
        key: 'defensiveReaction',
        prompt: 'Incoming Attack! Boost your defenses?',
        subtitle: '⚔ Power 5    💨 Agility 2',
        optional: true,
        multiSelect: false,
        options,
      };

      world.capturedPrompts = [prompt];
    }
  }
});

When('the defender chooses dodge', function (world: DodgeReactionWorld) {
  const defender = world.defEntities?.get('hero-0') as Character;

  if (defender && world.playerBeadSystem) {
    // Spend 1 green bead for dodge
    world.playerBeadSystem.spend('green');
    // Add +1 evasion
    defender.setEvasion(defender.evasion + 1);
    world.defenderEvasionAfter = defender.evasion;
    world.selectedReaction = ['dodge-1'];
  }
});

// Assertion steps

Then(
  'the defender evasion should be {int}',
  function (world: DodgeReactionWorld, expectedEvasion: number) {
    const defender = world.defEntities?.get('hero-0') as Character;
    expect(defender).toBeDefined();
    expect(defender!.evasion).toBe(expectedEvasion);
  }
);

Then(
  'the defender should have {int} green bead remaining',
  function (world: DodgeReactionWorld, expectedCount: number) {
    expect(world.playerBeadSystem).toBeDefined();
    const counts = world.playerBeadSystem!.getHandCounts();
    expect(counts.green).toBe(expectedCount);
  }
);

Then(
  'the defender should have {int} green beads remaining',
  function (world: DodgeReactionWorld, expectedCount: number) {
    expect(world.playerBeadSystem).toBeDefined();
    const counts = world.playerBeadSystem!.getHandCounts();
    expect(counts.green).toBe(expectedCount);
  }
);

Then('dodge should not be available as an option', function (world: DodgeReactionWorld) {
  expect(world.capturedOptions).toBeDefined();
  const hasDodgeOption = world.capturedOptions!.some((opt) => opt.id.startsWith('dodge'));
  expect(hasDodgeOption).toBe(false);
});

Then('only one dodge option should be offered', function (world: DodgeReactionWorld) {
  expect(world.capturedOptions).toBeDefined();
  const dodgeOptions = world.capturedOptions!.filter((opt) => opt.id.startsWith('dodge'));
  expect(dodgeOptions).toHaveLength(1);
  // Verify it's specifically dodge-1 (1 green bead)
  expect(dodgeOptions[0].id).toBe('dodge-1');
});
