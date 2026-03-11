import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import type { EffectResult, GameContext } from '@src/types/Effect';
import { CommandEffect } from '@src/effects/CommandEffect';

interface HornWorld extends QuickPickleWorld {
  // Unit test
  hornTestGrid?: BattleGrid;
  hornTestEntities?: Map<string, Entity>;
  hornTestBeadHands?: Map<string, PlayerBeadSystem>;
  hornTestGameContext?: GameContext;
  hornTestBearer?: Entity;
  hornTestBearerBeadHand?: PlayerBeadSystem;
  hornTestAllyBeadHands?: Map<string, PlayerBeadSystem>;
  hornTestCommandResult?: EffectResult;
  hornTestCommandCost?: { windup: number };

  // Integration test
  hornIntegrationGrid?: BattleGrid;
  hornIntegrationEntities?: Map<string, Entity>;
  hornIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  hornIntegrationGameContext?: GameContext;
  hornIntegrationBearer?: Entity;
  hornIntegrationBearerBeadHand?: PlayerBeadSystem;
  hornIntegrationAllyBeadHands?: Map<string, PlayerBeadSystem>;
  hornIntegrationCommandResult?: EffectResult;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a horn test grid of {int}x{int}',
  function (world: HornWorld, width: number, height: number) {
    world.hornTestGrid = new BattleGrid(width, height);
  }
);

Given('a horn test game context with the grid', function (world: HornWorld) {
  if (!world.hornTestGrid) {
    world.hornTestGrid = new BattleGrid(12, 12);
  }
  if (!world.hornTestEntities) {
    world.hornTestEntities = new Map();
  }
  if (!world.hornTestBeadHands) {
    world.hornTestBeadHands = new Map();
  }

  world.hornTestGameContext = {
    grid: world.hornTestGrid,
    actorId: 'horn-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.hornTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.hornTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a horn test bearer at position {int},{int} with {int} ponder stacks and bead hand',
  function (world: HornWorld, x: number, y: number, ponderStacks: number) {
    if (!world.hornTestGrid) {
      world.hornTestGrid = new BattleGrid(12, 12);
    }
    if (!world.hornTestEntities) {
      world.hornTestEntities = new Map();
    }
    if (!world.hornTestBeadHands) {
      world.hornTestBeadHands = new Map();
    }

    const bearerId = 'horn-test-bearer';
    world.hornTestBearer = new Entity(bearerId, 50, world.hornTestGrid);
    world.hornTestBearer.currentHealth = 50;
    if (ponderStacks > 0) {
      world.hornTestBearer.addStacks('ponder', ponderStacks);
    }
    world.hornTestEntities.set(bearerId, world.hornTestBearer);
    world.hornTestGrid.register(bearerId, x, y);

    // Set up bearer's bead hand with default beads available
    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red: 3, blue: 3, green: 3, white: 3 });
    world.hornTestBearerBeadHand = beadHand;
    world.hornTestBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a horn test bearer at position {int},{int} with {int} ponder stacks and bead hand having {int} red',
  function (world: HornWorld, x: number, y: number, ponderStacks: number, red: number) {
    if (!world.hornTestGrid) {
      world.hornTestGrid = new BattleGrid(12, 12);
    }
    if (!world.hornTestEntities) {
      world.hornTestEntities = new Map();
    }
    if (!world.hornTestBeadHands) {
      world.hornTestBeadHands = new Map();
    }

    const bearerId = 'horn-test-bearer';
    world.hornTestBearer = new Entity(bearerId, 50, world.hornTestGrid);
    world.hornTestBearer.currentHealth = 50;
    if (ponderStacks > 0) {
      world.hornTestBearer.addStacks('ponder', ponderStacks);
    }
    world.hornTestEntities.set(bearerId, world.hornTestBearer);
    world.hornTestGrid.register(bearerId, x, y);

    // Set up bearer's bead hand with specific beads
    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red, blue: 0, green: 0, white: 0 });
    world.hornTestBearerBeadHand = beadHand;
    world.hornTestBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a horn test bearer at position {int},{int} with {int} ponder stacks and bead hand having {int} red {int} blue',
  function (
    world: HornWorld,
    x: number,
    y: number,
    ponderStacks: number,
    red: number,
    blue: number
  ) {
    if (!world.hornTestGrid) {
      world.hornTestGrid = new BattleGrid(12, 12);
    }
    if (!world.hornTestEntities) {
      world.hornTestEntities = new Map();
    }
    if (!world.hornTestBeadHands) {
      world.hornTestBeadHands = new Map();
    }

    const bearerId = 'horn-test-bearer';
    world.hornTestBearer = new Entity(bearerId, 50, world.hornTestGrid);
    world.hornTestBearer.currentHealth = 50;
    if (ponderStacks > 0) {
      world.hornTestBearer.addStacks('ponder', ponderStacks);
    }
    world.hornTestEntities.set(bearerId, world.hornTestBearer);
    world.hornTestGrid.register(bearerId, x, y);

    // Set up bearer's bead hand with specific beads
    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red, blue, green: 0, white: 0 });
    world.hornTestBearerBeadHand = beadHand;
    world.hornTestBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a horn test ally {string} at position {int},{int} with bead hand',
  function (world: HornWorld, allyName: string, x: number, y: number) {
    if (!world.hornTestGrid) {
      world.hornTestGrid = new BattleGrid(12, 12);
    }
    if (!world.hornTestEntities) {
      world.hornTestEntities = new Map();
    }
    if (!world.hornTestBeadHands) {
      world.hornTestBeadHands = new Map();
    }

    const ally = new Entity(allyName, 30, world.hornTestGrid);
    ally.currentHealth = 30;
    world.hornTestEntities.set(allyName, ally);
    world.hornTestGrid.register(allyName, x, y);

    const beadHand = new PlayerBeadSystem();
    if (!world.hornTestAllyBeadHands) {
      world.hornTestAllyBeadHands = new Map();
    }
    world.hornTestAllyBeadHands.set(allyName, beadHand);
    world.hornTestBeadHands.set(allyName, beadHand);
  }
);

Given(
  'a horn test ally {string} at position {int},{int} with bead hand having {int} red',
  function (world: HornWorld, allyName: string, x: number, y: number, red: number) {
    if (!world.hornTestGrid) {
      world.hornTestGrid = new BattleGrid(12, 12);
    }
    if (!world.hornTestEntities) {
      world.hornTestEntities = new Map();
    }
    if (!world.hornTestBeadHands) {
      world.hornTestBeadHands = new Map();
    }

    const ally = new Entity(allyName, 30, world.hornTestGrid);
    ally.currentHealth = 30;
    world.hornTestEntities.set(allyName, ally);
    world.hornTestGrid.register(allyName, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red, blue: 0, green: 0, white: 0 });
    if (!world.hornTestAllyBeadHands) {
      world.hornTestAllyBeadHands = new Map();
    }
    world.hornTestAllyBeadHands.set(allyName, beadHand);
    world.hornTestBeadHands.set(allyName, beadHand);
  }
);

// ============================================================================
// UNIT TEST - Command Effect Execution
// ============================================================================

When(
  'the horn test command effect is executed targeting {string} spending {word}',
  function (world: HornWorld, targetId: string, beadColor: string) {
    if (!world.hornTestGameContext) {
      throw new Error('Game context not initialized');
    }

    const effect = new CommandEffect();
    world.hornTestCommandResult = effect.execute(
      world.hornTestGameContext,
      { targetId, beadColor },
      {},
      new Map()
    );
  }
);

// ============================================================================
// UNIT TEST - Assertions: Command Result
// ============================================================================

Then('the horn test command result should be successful', function (world: HornWorld) {
  expect(world.hornTestCommandResult).toBeDefined();
  expect(world.hornTestCommandResult?.success).toBe(true);
});

Then('the horn test command result should have failed', function (world: HornWorld) {
  expect(world.hornTestCommandResult).toBeDefined();
  expect(world.hornTestCommandResult?.success).toBe(false);
});

// ============================================================================
// UNIT TEST - Assertions: Bead Hand Counts
// ============================================================================

Then(
  'the horn test bearer should have {int} red beads in hand',
  function (world: HornWorld, expected: number) {
    if (!world.hornTestBearerBeadHand) {
      throw new Error('Bearer bead hand not initialized');
    }
    const counts = world.hornTestBearerBeadHand.getHandCounts();
    expect(counts.red).toBe(expected);
  }
);

Then(
  'the horn test ally {string} should have {int} red beads in hand',
  function (world: HornWorld, allyId: string, expected: number) {
    const beadHand = world.hornTestBeadHands?.get(allyId);
    if (!beadHand) {
      throw new Error(`Ally ${allyId} bead hand not initialized`);
    }
    const counts = beadHand.getHandCounts();
    expect(counts.red).toBe(expected);
  }
);

Then(
  'the horn test bearer should have {int} blue beads in hand',
  function (world: HornWorld, expected: number) {
    if (!world.hornTestBearerBeadHand) {
      throw new Error('Bearer bead hand not initialized');
    }
    const counts = world.hornTestBearerBeadHand.getHandCounts();
    expect(counts.blue).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Assertions: Ponder Stacks
// ============================================================================

Then(
  'the horn test bearer should have {int} ponder stacks',
  function (world: HornWorld, expected: number) {
    if (!world.hornTestBearer) {
      throw new Error('Bearer not initialized');
    }
    expect(world.hornTestBearer.getStacks('ponder')).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Cost from YAML
// ============================================================================

When('I check the horn test command action cost from YAML', function (world: HornWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { time?: number } }>;
  };
  const commandAction = data.actions?.find((a: { id: string }) => a.id === 'command');

  if (!commandAction) {
    throw new Error('Command action not found in YAML');
  }

  world.hornTestCommandCost = {
    windup: commandAction.cost?.time ?? 0,
  };
});

Then(
  'the horn test command cost should have {int} windup',
  function (world: HornWorld, expected: number) {
    expect(world.hornTestCommandCost).toBeDefined();
    expect(world.hornTestCommandCost?.windup).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a horn integration grid of {int}x{int}',
  function (world: HornWorld, width: number, height: number) {
    world.hornIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a horn integration game context with the grid', function (world: HornWorld) {
  if (!world.hornIntegrationGrid) {
    world.hornIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.hornIntegrationEntities) {
    world.hornIntegrationEntities = new Map();
  }
  if (!world.hornIntegrationBeadHands) {
    world.hornIntegrationBeadHands = new Map();
  }

  world.hornIntegrationGameContext = {
    grid: world.hornIntegrationGrid,
    actorId: 'horn-integration-bearer',
    getEntity(id: string): Entity | undefined {
      return world.hornIntegrationEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.hornIntegrationBeadHands?.get(entityId);
    },
  };
});

Given(
  'a horn integration bearer at position {int},{int} with {int} ponder stacks and bead hand having {int} red {int} blue',
  function (
    world: HornWorld,
    x: number,
    y: number,
    ponderStacks: number,
    red: number,
    blue: number
  ) {
    if (!world.hornIntegrationGrid) {
      world.hornIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.hornIntegrationEntities) {
      world.hornIntegrationEntities = new Map();
    }
    if (!world.hornIntegrationBeadHands) {
      world.hornIntegrationBeadHands = new Map();
    }

    const bearerId = 'horn-integration-bearer';
    world.hornIntegrationBearer = new Entity(bearerId, 50, world.hornIntegrationGrid);
    world.hornIntegrationBearer.currentHealth = 50;
    if (ponderStacks > 0) {
      world.hornIntegrationBearer.addStacks('ponder', ponderStacks);
    }
    world.hornIntegrationEntities.set(bearerId, world.hornIntegrationBearer);
    world.hornIntegrationGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red, blue, green: 0, white: 0 });
    world.hornIntegrationBearerBeadHand = beadHand;
    world.hornIntegrationBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a horn integration ally {string} at position {int},{int} with bead hand having {int} red',
  function (world: HornWorld, allyName: string, x: number, y: number, red: number) {
    if (!world.hornIntegrationGrid) {
      world.hornIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.hornIntegrationEntities) {
      world.hornIntegrationEntities = new Map();
    }
    if (!world.hornIntegrationBeadHands) {
      world.hornIntegrationBeadHands = new Map();
    }

    const allyId = `horn-integration-${allyName}`;
    const ally = new Entity(allyId, 30, world.hornIntegrationGrid);
    ally.currentHealth = 30;
    world.hornIntegrationEntities.set(allyId, ally);
    world.hornIntegrationGrid.register(allyId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red, blue: 0, green: 0, white: 0 });
    if (!world.hornIntegrationAllyBeadHands) {
      world.hornIntegrationAllyBeadHands = new Map();
    }
    world.hornIntegrationAllyBeadHands.set(allyId, beadHand);
    world.hornIntegrationBeadHands.set(allyId, beadHand);
  }
);

// ============================================================================
// INTEGRATION TEST - Command Execution
// ============================================================================

When(
  'the horn integration command is executed for {string} spending {word}',
  function (world: HornWorld, targetId: string, beadColor: string) {
    if (!world.hornIntegrationGameContext) {
      throw new Error('Game context not initialized');
    }

    const effect = new CommandEffect();
    world.hornIntegrationCommandResult = effect.execute(
      world.hornIntegrationGameContext,
      { targetId, beadColor },
      {},
      new Map()
    );
  }
);

// ============================================================================
// INTEGRATION TEST - Assertions: Command Result
// ============================================================================

Then('the horn integration command result should be successful', function (world: HornWorld) {
  expect(world.hornIntegrationCommandResult).toBeDefined();
  expect(world.hornIntegrationCommandResult?.success).toBe(true);
});

// ============================================================================
// INTEGRATION TEST - Assertions: Bead Hand Counts
// ============================================================================

Then(
  'the horn integration bearer should have {int} blue beads',
  function (world: HornWorld, expected: number) {
    if (!world.hornIntegrationBearerBeadHand) {
      throw new Error('Bearer bead hand not initialized');
    }
    const counts = world.hornIntegrationBearerBeadHand.getHandCounts();
    expect(counts.blue).toBe(expected);
  }
);

Then(
  'the horn integration ally {string} should have {int} red beads',
  function (world: HornWorld, allyId: string, expected: number) {
    const beadHand = world.hornIntegrationBeadHands?.get(allyId);
    if (!beadHand) {
      throw new Error(`Ally ${allyId} bead hand not initialized`);
    }
    const counts = beadHand.getHandCounts();
    expect(counts.red).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST - Assertions: Ponder Stacks
// ============================================================================

Then(
  'the horn integration bearer should have {int} ponder stacks',
  function (world: HornWorld, expected: number) {
    if (!world.hornIntegrationBearer) {
      throw new Error('Bearer not initialized');
    }
    expect(world.hornIntegrationBearer.getStacks('ponder')).toBe(expected);
  }
);
