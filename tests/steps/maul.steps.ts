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
import { CrushEffect } from '@src/effects/CrushEffect';
import { SlamEffect } from '@src/effects/SlamEffect';

interface MaulWorld extends QuickPickleWorld {
  // Unit test
  maulTestGrid?: BattleGrid;
  maulTestEntities?: Map<string, Entity>;
  maulTestBeadHands?: Map<string, PlayerBeadSystem>;
  maulTestGameContext?: GameContext;
  maulTestBearer?: Entity;
  maulTestBearerBeadHand?: PlayerBeadSystem;
  maulTestCrushResult?: EffectResult;
  maulTestSlamResult?: EffectResult;
  maulTestCrushCost?: { redBeads: number };
  maulTestSlamCost?: { redBeads: number; greenBeads: number };
  maulTestEquipment?: {
    power: number;
    twoHanded: boolean;
    inventorySlots: number;
    modifiers: string[];
  };

  // Integration test
  maulIntegrationGrid?: BattleGrid;
  maulIntegrationEntities?: Map<string, Entity>;
  maulIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  maulIntegrationGameContext?: GameContext;
  maulIntegrationBearer?: Entity;
  maulIntegrationBearerBeadHand?: PlayerBeadSystem;
  maulIntegrationCrushResult?: EffectResult;
  maulIntegrationSlamResult?: EffectResult;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a maul test grid of {int}x{int}',
  function (world: MaulWorld, width: number, height: number) {
    world.maulTestGrid = new BattleGrid(width, height);
  }
);

Given('a maul test game context with the grid', function (world: MaulWorld) {
  if (!world.maulTestGrid) {
    world.maulTestGrid = new BattleGrid(12, 12);
  }
  if (!world.maulTestEntities) {
    world.maulTestEntities = new Map();
  }
  if (!world.maulTestBeadHands) {
    world.maulTestBeadHands = new Map();
  }

  world.maulTestGameContext = {
    grid: world.maulTestGrid,
    actorId: 'maul-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.maulTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.maulTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a maul test bearer at position {int},{int} with bead hand having {int} red',
  function (world: MaulWorld, x: number, y: number, red: number) {
    if (!world.maulTestGrid) {
      world.maulTestGrid = new BattleGrid(12, 12);
    }
    if (!world.maulTestEntities) {
      world.maulTestEntities = new Map();
    }
    if (!world.maulTestBeadHands) {
      world.maulTestBeadHands = new Map();
    }

    const bearerId = 'maul-test-bearer';
    world.maulTestBearer = new Entity(bearerId, 50, world.maulTestGrid);
    world.maulTestBearer.currentHealth = 50;
    world.maulTestEntities.set(bearerId, world.maulTestBearer);
    world.maulTestGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red, blue: 0, green: 0, white: 0 });
    world.maulTestBearerBeadHand = beadHand;
    world.maulTestBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a maul test bearer at position {int},{int}',
  function (world: MaulWorld, x: number, y: number) {
    if (!world.maulTestGrid) {
      world.maulTestGrid = new BattleGrid(12, 12);
    }
    if (!world.maulTestEntities) {
      world.maulTestEntities = new Map();
    }

    const bearerId = 'maul-test-bearer';
    world.maulTestBearer = new Entity(bearerId, 50, world.maulTestGrid);
    world.maulTestBearer.currentHealth = 50;
    world.maulTestEntities.set(bearerId, world.maulTestBearer);
    world.maulTestGrid.register(bearerId, x, y);
  }
);

Given(
  'a maul test target {string} at position {int},{int}',
  function (world: MaulWorld, targetName: string, x: number, y: number) {
    if (!world.maulTestGrid) {
      world.maulTestGrid = new BattleGrid(12, 12);
    }
    if (!world.maulTestEntities) {
      world.maulTestEntities = new Map();
    }

    const target = new Entity(targetName, 30, world.maulTestGrid);
    target.currentHealth = 30;
    world.maulTestEntities.set(targetName, target);
    world.maulTestGrid.register(targetName, x, y);
  }
);

Given(
  'a maul test target {string} at position {int},{int} with {int} health',
  function (world: MaulWorld, targetName: string, x: number, y: number, health: number) {
    if (!world.maulTestGrid) {
      world.maulTestGrid = new BattleGrid(12, 12);
    }
    if (!world.maulTestEntities) {
      world.maulTestEntities = new Map();
    }

    const target = new Entity(targetName, health, world.maulTestGrid);
    target.currentHealth = health;
    world.maulTestEntities.set(targetName, target);
    world.maulTestGrid.register(targetName, x, y);
  }
);

Given(
  'a maul test target {string} at position {int},{int} with {int} health and {int} guard',
  function (
    world: MaulWorld,
    targetName: string,
    x: number,
    y: number,
    health: number,
    guardValue: number
  ) {
    if (!world.maulTestGrid) {
      world.maulTestGrid = new BattleGrid(12, 12);
    }
    if (!world.maulTestEntities) {
      world.maulTestEntities = new Map();
    }

    const target = new Entity(targetName, health, world.maulTestGrid);
    target.currentHealth = health;
    target.setGuard(guardValue);
    world.maulTestEntities.set(targetName, target);
    world.maulTestGrid.register(targetName, x, y);
  }
);

Given(
  'a maul test obstacle at position {int},{int}',
  function (world: MaulWorld, x: number, y: number) {
    if (!world.maulTestGrid) {
      world.maulTestGrid = new BattleGrid(12, 12);
    }
    const obstacleId = `maul-obstacle-${x}-${y}`;
    const obstacle = new Entity(obstacleId, 999, world.maulTestGrid);
    world.maulTestEntities?.set(obstacleId, obstacle);
    world.maulTestGrid.register(obstacleId, x, y);
  }
);

Given(
  'a maul test blocker {string} at position {int},{int}',
  function (world: MaulWorld, blockerName: string, x: number, y: number) {
    if (!world.maulTestGrid) {
      world.maulTestGrid = new BattleGrid(12, 12);
    }
    if (!world.maulTestEntities) {
      world.maulTestEntities = new Map();
    }

    const blocker = new Entity(blockerName, 50, world.maulTestGrid);
    blocker.currentHealth = 50;
    world.maulTestEntities.set(blockerName, blocker);
    world.maulTestGrid.register(blockerName, x, y);
  }
);

// ============================================================================
// UNIT TEST - Crush Effect Execution
// ============================================================================

When(
  'the maul test crush is triggered for {string} with guard {int}',
  function (world: MaulWorld, targetId: string, guardValue: number) {
    if (!world.maulTestGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new CrushEffect();
    world.maulTestCrushResult = effect.execute(
      world.maulTestGameContext,
      { targetId, guard: guardValue, armor: 0 },
      {},
      new Map()
    );
  }
);

// ============================================================================
// UNIT TEST - Slam Effect Execution
// ============================================================================

When(
  'the maul test slam is triggered for {string} pushing vertically',
  function (world: MaulWorld, targetId: string) {
    if (!world.maulTestGameContext) {
      throw new Error('Game context not initialized');
    }

    const bearerPos = world.maulTestGrid?.getPosition('maul-test-bearer');
    const targetPos = world.maulTestGrid?.getPosition(targetId);

    if (!bearerPos || !targetPos) {
      throw new Error('Bearer or target position not found');
    }

    // Calculate direction from bearer to target
    const dy = targetPos.y > bearerPos.y ? 1 : targetPos.y < bearerPos.y ? -1 : 0;

    const effect = new SlamEffect();
    world.maulTestSlamResult = effect.execute(
      world.maulTestGameContext,
      { targetId, direction: { dx: 0, dy } },
      {},
      new Map()
    );
  }
);

// ============================================================================
// UNIT TEST - Assertions: Crush Result
// ============================================================================

Then('the maul test crush result should be successful', function (world: MaulWorld) {
  expect(world.maulTestCrushResult).toBeDefined();
  expect(world.maulTestCrushResult?.success).toBe(true);
});

Then(
  'the maul test crush effective guard should be {int}',
  function (world: MaulWorld, expected: number) {
    expect(world.maulTestCrushResult).toBeDefined();
    expect(world.maulTestCrushResult?.data?.effectiveGuard).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Assertions: Slam Result
// ============================================================================

Then('the maul test slam result should be successful', function (world: MaulWorld) {
  expect(world.maulTestSlamResult).toBeDefined();
  expect(world.maulTestSlamResult?.success).toBe(true);
});

Then(
  'the maul test target {string} should be at position {int},{int}',
  function (world: MaulWorld, targetId: string, x: number, y: number) {
    const pos = world.maulTestGrid?.getPosition(targetId);
    expect(pos).toBeDefined();
    expect(pos?.x).toBe(x);
    expect(pos?.y).toBe(y);
  }
);

Then(
  'the maul test target {string} should have {int} health',
  function (world: MaulWorld, targetId: string, expectedHealth: number) {
    const target = world.maulTestEntities?.get(targetId);
    expect(target).toBeDefined();
    expect(target?.currentHealth).toBe(expectedHealth);
  }
);

// ============================================================================
// UNIT TEST - Equipment from YAML
// ============================================================================

When('I check the maul test equipment from YAML', function (world: MaulWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      power: number;
      twoHanded: boolean;
      inventorySlots: number;
      grantedModifiers?: string[];
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'maul');

  if (!equipment) {
    throw new Error('Maul equipment not found in YAML');
  }

  world.maulTestEquipment = {
    power: equipment.power,
    twoHanded: equipment.twoHanded,
    inventorySlots: equipment.inventorySlots,
    modifiers: equipment.grantedModifiers ?? [],
  };
});

Then(
  'the maul test equipment power should be {int}',
  function (world: MaulWorld, expected: number) {
    expect(world.maulTestEquipment).toBeDefined();
    expect(world.maulTestEquipment?.power).toBe(expected);
  }
);

Then(
  'the maul test equipment twoHanded should be {word}',
  function (world: MaulWorld, expected: string) {
    expect(world.maulTestEquipment).toBeDefined();
    expect(world.maulTestEquipment?.twoHanded).toBe(expected === 'true');
  }
);

Then(
  'the maul test equipment inventorySlots should be {int}',
  function (world: MaulWorld, expected: number) {
    expect(world.maulTestEquipment).toBeDefined();
    expect(world.maulTestEquipment?.inventorySlots).toBe(expected);
  }
);

Then(
  'the maul test equipment should have modifier {string}',
  function (world: MaulWorld, modifierName: string) {
    expect(world.maulTestEquipment).toBeDefined();
    expect(world.maulTestEquipment?.modifiers).toContain(modifierName);
  }
);

// ============================================================================
// UNIT TEST - Crush Action Cost from YAML
// ============================================================================

When('I check the maul test crush action cost from YAML', function (world: MaulWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { beads?: { red?: number } } }>;
  };
  const action = data.actions?.find((a: { id: string }) => a.id === 'crush');

  if (!action) {
    throw new Error('crush action not found in YAML');
  }

  world.maulTestCrushCost = {
    redBeads: action.cost?.beads?.red ?? 0,
  };
});

Then(
  'the maul test crush cost should have {int} red bead',
  function (world: MaulWorld, expected: number) {
    expect(world.maulTestCrushCost).toBeDefined();
    expect(world.maulTestCrushCost?.redBeads).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Slam Action Cost from YAML
// ============================================================================

When('I check the maul test slam action cost from YAML', function (world: MaulWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { beads?: { red?: number; green?: number } } }>;
  };
  const action = data.actions?.find((a: { id: string }) => a.id === 'slam');

  if (!action) {
    throw new Error('slam action not found in YAML');
  }

  world.maulTestSlamCost = {
    redBeads: action.cost?.beads?.red ?? 0,
    greenBeads: action.cost?.beads?.green ?? 0,
  };
});

Then(
  'the maul test slam cost should have {int} red bead',
  function (world: MaulWorld, expected: number) {
    expect(world.maulTestSlamCost).toBeDefined();
    expect(world.maulTestSlamCost?.redBeads).toBe(expected);
  }
);

Then(
  'the maul test slam cost should have {int} green bead',
  function (world: MaulWorld, expected: number) {
    expect(world.maulTestSlamCost).toBeDefined();
    expect(world.maulTestSlamCost?.greenBeads).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a maul integration grid of {int}x{int}',
  function (world: MaulWorld, width: number, height: number) {
    world.maulIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a maul integration game context with the grid', function (world: MaulWorld) {
  if (!world.maulIntegrationGrid) {
    world.maulIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.maulIntegrationEntities) {
    world.maulIntegrationEntities = new Map();
  }
  if (!world.maulIntegrationBeadHands) {
    world.maulIntegrationBeadHands = new Map();
  }

  world.maulIntegrationGameContext = {
    grid: world.maulIntegrationGrid,
    actorId: 'maul-integration-bearer',
    getEntity(id: string): Entity | undefined {
      return world.maulIntegrationEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.maulIntegrationBeadHands?.get(entityId);
    },
  };
});

Given(
  'a maul integration bearer at position {int},{int} with bead hand having {int} red and {int} green',
  function (world: MaulWorld, x: number, y: number, red: number, green: number) {
    if (!world.maulIntegrationGrid) {
      world.maulIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.maulIntegrationEntities) {
      world.maulIntegrationEntities = new Map();
    }
    if (!world.maulIntegrationBeadHands) {
      world.maulIntegrationBeadHands = new Map();
    }

    const bearerId = 'maul-integration-bearer';
    world.maulIntegrationBearer = new Entity(bearerId, 50, world.maulIntegrationGrid);
    world.maulIntegrationBearer.currentHealth = 50;
    world.maulIntegrationEntities.set(bearerId, world.maulIntegrationBearer);
    world.maulIntegrationGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red, blue: 0, green, white: 0 });
    world.maulIntegrationBearerBeadHand = beadHand;
    world.maulIntegrationBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a maul integration target {string} at position {int},{int} with {int} health and {int} guard',
  function (
    world: MaulWorld,
    targetName: string,
    x: number,
    y: number,
    health: number,
    guardValue: number
  ) {
    if (!world.maulIntegrationGrid) {
      world.maulIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.maulIntegrationEntities) {
      world.maulIntegrationEntities = new Map();
    }

    const targetId = `maul-integration-${targetName}`;
    const target = new Entity(targetId, health, world.maulIntegrationGrid);
    target.currentHealth = health;
    target.setGuard(guardValue);
    world.maulIntegrationEntities.set(targetId, target);
    world.maulIntegrationGrid.register(targetId, x, y);
  }
);

// ============================================================================
// INTEGRATION TEST - Crush Effect Execution
// ============================================================================

When(
  'the maul integration crush is triggered for {string} with guard {int}',
  function (world: MaulWorld, targetId: string, guardValue: number) {
    if (!world.maulIntegrationGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new CrushEffect();
    world.maulIntegrationCrushResult = effect.execute(
      world.maulIntegrationGameContext,
      { targetId, guard: guardValue, armor: 0 },
      {},
      new Map()
    );
  }
);

// ============================================================================
// INTEGRATION TEST - Slam Effect Execution
// ============================================================================

When(
  'the maul integration slam is triggered for {string} pushing vertically',
  function (world: MaulWorld, targetId: string) {
    if (!world.maulIntegrationGameContext) {
      throw new Error('Game context not initialized');
    }

    const bearerPos = world.maulIntegrationGrid?.getPosition('maul-integration-bearer');
    const targetPos = world.maulIntegrationGrid?.getPosition(targetId);

    if (!bearerPos || !targetPos) {
      throw new Error('Bearer or target position not found');
    }

    // Calculate direction from bearer to target
    const dy = targetPos.y > bearerPos.y ? 1 : targetPos.y < bearerPos.y ? -1 : 0;

    const effect = new SlamEffect();
    world.maulIntegrationSlamResult = effect.execute(
      world.maulIntegrationGameContext,
      { targetId, direction: { dx: 0, dy } },
      {},
      new Map()
    );
  }
);

// ============================================================================
// INTEGRATION TEST - Assertions
// ============================================================================

Then('the maul integration crush result should be successful', function (world: MaulWorld) {
  expect(world.maulIntegrationCrushResult).toBeDefined();
  expect(world.maulIntegrationCrushResult?.success).toBe(true);
});

Then(
  'the maul integration crush effective guard should be {int}',
  function (world: MaulWorld, expected: number) {
    expect(world.maulIntegrationCrushResult).toBeDefined();
    expect(world.maulIntegrationCrushResult?.data?.effectiveGuard).toBe(expected);
  }
);

Then('the maul integration slam result should be successful', function (world: MaulWorld) {
  expect(world.maulIntegrationSlamResult).toBeDefined();
  expect(world.maulIntegrationSlamResult?.success).toBe(true);
});

Then(
  'the maul integration target {string} should be at position {int},{int}',
  function (world: MaulWorld, targetId: string, x: number, y: number) {
    const pos = world.maulIntegrationGrid?.getPosition(targetId);
    expect(pos).toBeDefined();
    expect(pos?.x).toBe(x);
    expect(pos?.y).toBe(y);
  }
);
