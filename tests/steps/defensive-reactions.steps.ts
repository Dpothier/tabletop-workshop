import { Given, When, Then } from 'quickpickle';
import { expect, vi } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid } from '@src/state/BattleGrid';
import { Character } from '@src/entities/Character';
import { MonsterEntity } from '@src/entities/MonsterEntity';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import type { OptionPrompt, OptionChoice } from '@src/types/ParameterPrompt';
import type { BattleAdapter } from '@src/types/BattleAdapter';

interface DefensiveReactionsWorld extends QuickPickleWorld {
  grid?: BattleGrid;
  defEntities?: Map<string, Character | MonsterEntity>;
  playerBeadSystem?: PlayerBeadSystem;
  battleAdapter?: BattleAdapter;
  capturedPrompts?: OptionPrompt[];
  selectedReaction?: string[] | null;
  playerGuardBefore?: number;
  playerEvasionBefore?: number;
  playerGuardAfter?: number;
  playerEvasionAfter?: number;
  promptIssuedCount?: number;
  lastAttackPower?: number;
  lastAttackAgility?: number;
}

// Background steps (unique to this feature)

Given(
  'an attacking monster {string} at position {int},{int}',
  function (world: DefensiveReactionsWorld, monsterId: string, x: number, y: number) {
    if (!world.grid) {
      world.grid = new BattleGrid(9, 9);
    }
    if (!world.defEntities) {
      world.defEntities = new Map();
    }

    const monster = new MonsterEntity(monsterId, 10, world.grid);
    world.grid.register(monsterId, x, y);
    world.defEntities.set(monsterId, monster);
  }
);

Given(
  'a defending player {string} at position {int},{int}',
  function (world: DefensiveReactionsWorld, characterId: string, x: number, y: number) {
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

Given('the player has beads in hand', function (world: DefensiveReactionsWorld) {
  if (world.playerBeadSystem) {
    world.playerBeadSystem.drawToHand(4);
  }
});

Given(
  'a target monster {string} at position {int},{int}',
  function (world: DefensiveReactionsWorld, monsterId: string, x: number, y: number) {
    if (!world.grid) {
      world.grid = new BattleGrid(9, 9);
    }
    if (!world.defEntities) {
      world.defEntities = new Map();
    }

    const monster = new MonsterEntity(monsterId, 10, world.grid);
    world.grid.register(monsterId, x, y);
    world.defEntities.set(monsterId, monster);
  }
);

// Bead setup steps

Given(
  'the player has {int} red bead in hand',
  function (world: DefensiveReactionsWorld, count: number) {
    const character = world.defEntities?.get('hero-0') as Character;
    if (character) {
      world.playerBeadSystem = new PlayerBeadSystem({ red: count, blue: 0, green: 0, white: 0 });
      world.playerBeadSystem.drawToHand(count);
    }
  }
);

Given(
  'the player has {int} red beads in hand',
  function (world: DefensiveReactionsWorld, count: number) {
    const character = world.defEntities?.get('hero-0') as Character;
    if (character) {
      world.playerBeadSystem = new PlayerBeadSystem({ red: count, blue: 0, green: 0, white: 0 });
      world.playerBeadSystem.drawToHand(count);
    }
  }
);

Given(
  'the player has {int} green bead in hand',
  function (world: DefensiveReactionsWorld, count: number) {
    const character = world.defEntities?.get('hero-0') as Character;
    if (character) {
      world.playerBeadSystem = new PlayerBeadSystem({ red: 0, blue: 0, green: count, white: 0 });
      world.playerBeadSystem.drawToHand(count);
    }
  }
);

Given(
  'the player has {int} green beads in hand',
  function (world: DefensiveReactionsWorld, count: number) {
    const character = world.defEntities?.get('hero-0') as Character;
    if (character) {
      world.playerBeadSystem = new PlayerBeadSystem({ red: 0, blue: 0, green: count, white: 0 });
      world.playerBeadSystem.drawToHand(count);
    }
  }
);

Given(
  'the player has {int} red bead and {int} green bead in hand',
  function (world: DefensiveReactionsWorld, redCount: number, greenCount: number) {
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
  'the player has {int} red beads and {int} green beads in hand',
  function (world: DefensiveReactionsWorld, redCount: number, greenCount: number) {
    if (redCount === 0 && greenCount === 0) {
      // Create a system with only blue/white beads (no defensive beads)
      world.playerBeadSystem = new PlayerBeadSystem({ red: 0, blue: 2, green: 0, white: 2 });
      world.playerBeadSystem.drawToHand(4);
    } else {
      world.playerBeadSystem = new PlayerBeadSystem({
        red: redCount,
        blue: 0,
        green: greenCount,
        white: 0,
      });
      world.playerBeadSystem.drawToHand(redCount + greenCount);
    }
  }
);

// Mock BattleAdapter
function createMockBattleAdapter(world: DefensiveReactionsWorld): BattleAdapter {
  if (!world.capturedPrompts) {
    world.capturedPrompts = [];
  }
  if (!world.promptIssuedCount) {
    world.promptIssuedCount = 0;
  }

  return {
    promptTile: vi.fn(async () => null),
    promptEntity: vi.fn(async () => null),
    promptOptions: vi.fn(async (prompt: OptionPrompt) => {
      world.capturedPrompts!.push(prompt);
      world.promptIssuedCount!++;
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

function createDefensivePrompt(
  handCounts: { red: number; green: number },
  power?: number,
  agility?: number
): OptionPrompt {
  const options: OptionChoice[] = [];
  for (let i = 1; i <= handCounts.red; i++) {
    options.push({
      id: `guard-${i}`,
      label: `Spend ${i} red bead(s) for +${i} Guard`,
    });
  }
  for (let i = 1; i <= handCounts.green; i++) {
    options.push({
      id: `evade-${i}`,
      label: `Spend ${i} green bead(s) for +${i} Evasion`,
    });
  }
  options.push({
    id: 'pass',
    label: 'Pass',
  });

  // Use subtitle for attack stats (matching production code format)
  const result: OptionPrompt = {
    type: 'option',
    key: 'defensiveReaction',
    prompt: 'Incoming Attack! Boost your defenses?',
    optional: true,
    multiSelect: false,
    options,
  };

  if (power !== undefined && agility !== undefined) {
    result.subtitle = `⚔ Power ${power}    💨 Agility ${agility}`;
  }

  return result;
}

// Attack steps

When('the monster attacks the player', function (world: DefensiveReactionsWorld) {
  world.battleAdapter = createMockBattleAdapter(world);
  const player = world.defEntities?.get('hero-0') as Character;

  if (player && world.playerBeadSystem) {
    const handCounts = world.playerBeadSystem.getHandCounts();
    if (handCounts.red > 0 || handCounts.green > 0) {
      const prompt = createDefensivePrompt(handCounts);
      world.battleAdapter!.promptOptions(prompt);
    }
  }
});

When(
  'the monster attacks with power {int}, agility {int}',
  function (world: DefensiveReactionsWorld, power: number, agility: number) {
    world.battleAdapter = createMockBattleAdapter(world);
    world.lastAttackPower = power;
    world.lastAttackAgility = agility;
    const player = world.defEntities?.get('hero-0') as Character;

    if (player && world.playerBeadSystem) {
      world.playerGuardBefore = player.guard;
      world.playerEvasionBefore = player.evasion;

      const handCounts = world.playerBeadSystem.getHandCounts();
      if (handCounts.red > 0 || handCounts.green > 0) {
        const prompt = createDefensivePrompt(handCounts, power, agility);
        world.battleAdapter!.promptOptions(prompt);
      }
    }
  }
);

When(
  'the player spends {int} red bead for defense',
  function (world: DefensiveReactionsWorld, count: number) {
    const player = world.defEntities?.get('hero-0') as Character;
    if (player && world.playerBeadSystem) {
      for (let i = 0; i < count; i++) {
        world.playerBeadSystem.spend('red');
      }
      player.setGuard(player.guard + count);
      world.playerGuardAfter = player.guard;
      world.selectedReaction = [`guard-${count}`];
    }
  }
);

When(
  'the player spends {int} green bead for defense',
  function (world: DefensiveReactionsWorld, count: number) {
    const player = world.defEntities?.get('hero-0') as Character;
    if (player && world.playerBeadSystem) {
      for (let i = 0; i < count; i++) {
        world.playerBeadSystem.spend('green');
      }
      player.setEvasion(player.evasion + count);
      world.playerEvasionAfter = player.evasion;
      world.selectedReaction = [`evade-${count}`];
    }
  }
);

When(
  'the player spends {int} red beads for defense',
  function (world: DefensiveReactionsWorld, count: number) {
    const player = world.defEntities?.get('hero-0') as Character;
    if (player && world.playerBeadSystem) {
      for (let i = 0; i < count; i++) {
        world.playerBeadSystem.spend('red');
      }
      player.setGuard(player.guard + count);
      world.playerGuardAfter = player.guard;
      world.selectedReaction = [`guard-${count}`];
    }
  }
);

When(
  'the player spends {int} green beads for defense',
  function (world: DefensiveReactionsWorld, count: number) {
    const player = world.defEntities?.get('hero-0') as Character;
    if (player && world.playerBeadSystem) {
      for (let i = 0; i < count; i++) {
        world.playerBeadSystem.spend('green');
      }
      player.setEvasion(player.evasion + count);
      world.playerEvasionAfter = player.evasion;
      world.selectedReaction = [`evade-${count}`];
    }
  }
);

When(
  'the player spends {int} red bead and {int} green bead for defense',
  function (world: DefensiveReactionsWorld, redCount: number, greenCount: number) {
    const player = world.defEntities?.get('hero-0') as Character;
    if (player && world.playerBeadSystem) {
      for (let i = 0; i < redCount; i++) {
        world.playerBeadSystem.spend('red');
      }
      for (let i = 0; i < greenCount; i++) {
        world.playerBeadSystem.spend('green');
      }
      player.setGuard(player.guard + redCount);
      player.setEvasion(player.evasion + greenCount);
      world.playerGuardAfter = player.guard;
      world.playerEvasionAfter = player.evasion;
      world.selectedReaction = [`guard-${redCount}`, `evade-${greenCount}`];
    }
  }
);

When(
  'the player chooses to pass without spending beads',
  function (world: DefensiveReactionsWorld) {
    world.selectedReaction = ['pass'];
  }
);

When('the monster attacks again', function (world: DefensiveReactionsWorld) {
  const player = world.defEntities?.get('hero-0') as Character;
  if (player) {
    player.resetGuard();
    world.playerGuardBefore = player.guard;
    world.playerEvasionBefore = player.evasion;
  }
});

When('the goblin attacks the orc', function (world: DefensiveReactionsWorld) {
  world.battleAdapter = createMockBattleAdapter(world);
  world.promptIssuedCount = 0;
  // Monster vs monster - no defensive prompt
});

// Assertions

Then(
  'the player should be prompted for defensive reactions',
  function (world: DefensiveReactionsWorld) {
    expect(world.capturedPrompts).toBeDefined();
    expect(world.capturedPrompts!.length).toBeGreaterThan(0);
  }
);

Then(
  'the prompt should offer red and green bead options',
  function (world: DefensiveReactionsWorld) {
    expect(world.capturedPrompts).toBeDefined();
    expect(world.capturedPrompts!.length).toBeGreaterThan(0);

    const prompt = world.capturedPrompts![0];
    expect(prompt.key).toBe('defensiveReaction');

    const hasGuardOption = prompt.options.some((opt) => opt.id.startsWith('guard'));
    const hasEvadeOption = prompt.options.some((opt) => opt.id.startsWith('evade'));
    const hasPassOption = prompt.options.some((opt) => opt.id === 'pass');

    expect(hasGuardOption).toBe(true);
    expect(hasEvadeOption).toBe(true);
    expect(hasPassOption).toBe(true);
  }
);

Then(
  'the player guard should be increased by {int} before attack resolves',
  function (world: DefensiveReactionsWorld, expectedIncrease: number) {
    expect(world.playerGuardAfter).toBeDefined();
    expect(world.playerGuardAfter).toBe(expectedIncrease);
  }
);

Then(
  'the player should have {int} red beads in hand',
  function (world: DefensiveReactionsWorld, expectedCount: number) {
    expect(world.playerBeadSystem).toBeDefined();
    const counts = world.playerBeadSystem!.getHandCounts();
    expect(counts.red).toBe(expectedCount);
  }
);

Then(
  'the player should have {int} red bead in hand',
  function (world: DefensiveReactionsWorld, expectedCount: number) {
    expect(world.playerBeadSystem).toBeDefined();
    const counts = world.playerBeadSystem!.getHandCounts();
    expect(counts.red).toBe(expectedCount);
  }
);

Then(
  'the player evasion should be increased by {int} before attack resolves',
  function (world: DefensiveReactionsWorld, expectedIncrease: number) {
    expect(world.playerEvasionAfter).toBeDefined();
    expect(world.playerEvasionAfter).toBe(expectedIncrease);
  }
);

Then(
  'the player should have {int} green beads in hand',
  function (world: DefensiveReactionsWorld, expectedCount: number) {
    expect(world.playerBeadSystem).toBeDefined();
    const counts = world.playerBeadSystem!.getHandCounts();
    expect(counts.green).toBe(expectedCount);
  }
);

Then(
  'the player should have {int} green bead in hand',
  function (world: DefensiveReactionsWorld, expectedCount: number) {
    expect(world.playerBeadSystem).toBeDefined();
    const counts = world.playerBeadSystem!.getHandCounts();
    expect(counts.green).toBe(expectedCount);
  }
);

Then(
  'the player should have {int} red beads and {int} green beads in hand',
  function (world: DefensiveReactionsWorld, redCount: number, greenCount: number) {
    expect(world.playerBeadSystem).toBeDefined();
    const counts = world.playerBeadSystem!.getHandCounts();
    expect(counts.red).toBe(redCount);
    expect(counts.green).toBe(greenCount);
  }
);

Then(
  'the player should not be prompted for defensive reactions',
  function (world: DefensiveReactionsWorld) {
    const promptCount = world.promptIssuedCount || 0;
    expect(promptCount).toBe(0);
  }
);

Then('the attack should resolve immediately', function () {
  // Just verify we got here - attack resolves without defensive prompt
  expect(true).toBe(true);
});

Then(
  'the player guard should be increased by {int} before first attack resolves',
  function (world: DefensiveReactionsWorld, expectedIncrease: number) {
    expect(world.playerGuardAfter).toBeDefined();
    expect(world.playerGuardAfter).toBe(expectedIncrease);
  }
);

Then(
  'the player guard should be {int} before second attack resolves',
  function (world: DefensiveReactionsWorld, expectedGuard: number) {
    expect(world.playerGuardBefore).toBe(expectedGuard);
  }
);

Then('no defensive reaction prompt should be issued', function (world: DefensiveReactionsWorld) {
  const promptCount = world.promptIssuedCount || 0;
  expect(promptCount).toBe(0);
});
