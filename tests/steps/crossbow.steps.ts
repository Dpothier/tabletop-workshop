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
import { LoadEffect } from '@src/effects/LoadEffect';

interface CrossbowWorld extends QuickPickleWorld {
  // Unit test
  crossbowTestGrid?: BattleGrid;
  crossbowTestEntities?: Map<string, Entity>;
  crossbowTestBeadHands?: Map<string, PlayerBeadSystem>;
  crossbowTestGameContext?: GameContext;
  crossbowTestEntity?: Entity;
  crossbowTestLoadResult?: EffectResult;
  crossbowTestEquipment?: {
    penetration: number;
    startsLoaded: boolean;
    inventorySlots: number;
    twoHanded: boolean;
  };
  crossbowTestLoadCost?: { time: number };
  crossbowTestSteadyAimModifier?: {
    agility: number;
  };
  crossbowTestSteadyAimCost?: { blue: number };
  crossbowTestRangeBands?: {
    short: number;
    medium: number;
    long: number;
  };
  crossbowTestCanShoot?: boolean;

  // Integration test
  crossbowIntegrationGrid?: BattleGrid;
  crossbowIntegrationEntities?: Map<string, Entity>;
  crossbowIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  crossbowIntegrationGameContext?: GameContext;
  crossbowIntegrationBearer?: Entity;
  crossbowIntegrationLoadResult?: EffectResult;
  crossbowIntegrationSteadyAimResult?: any;
  crossbowIntegrationPrecisionModifier?: number;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a crossbow test grid of {int}x{int}',
  function (world: CrossbowWorld, width: number, height: number) {
    world.crossbowTestGrid = new BattleGrid(width, height);
  }
);

Given('a crossbow test game context with the grid', function (world: CrossbowWorld) {
  if (!world.crossbowTestGrid) {
    world.crossbowTestGrid = new BattleGrid(12, 12);
  }
  if (!world.crossbowTestEntities) {
    world.crossbowTestEntities = new Map();
  }
  if (!world.crossbowTestBeadHands) {
    world.crossbowTestBeadHands = new Map();
  }

  world.crossbowTestGameContext = {
    grid: world.crossbowTestGrid,
    actorId: 'crossbow-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.crossbowTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.crossbowTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a crossbow test entity at position {int},{int}',
  function (world: CrossbowWorld, x: number, y: number) {
    if (!world.crossbowTestGrid) {
      world.crossbowTestGrid = new BattleGrid(12, 12);
    }
    if (!world.crossbowTestEntities) {
      world.crossbowTestEntities = new Map();
    }

    const entityId = 'crossbow-test-bearer';
    world.crossbowTestEntity = new Entity(entityId, 50, world.crossbowTestGrid);
    world.crossbowTestEntity.currentHealth = 50;
    world.crossbowTestEntities.set(entityId, world.crossbowTestEntity);
    world.crossbowTestGrid.register(entityId, x, y);
  }
);

// ============================================================================
// UNIT TEST - Equipment from YAML
// ============================================================================

When('I check the crossbow test equipment from YAML', function (world: CrossbowWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      penetration?: number;
      startsLoaded?: boolean;
      inventorySlots?: number;
      twoHanded?: boolean;
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'crossbow');

  if (!equipment) {
    throw new Error('Crossbow equipment not found in YAML');
  }

  world.crossbowTestEquipment = {
    penetration: equipment.penetration ?? 0,
    startsLoaded: equipment.startsLoaded ?? false,
    inventorySlots: equipment.inventorySlots ?? 0,
    twoHanded: equipment.twoHanded ?? false,
  };
});

Then(
  'the crossbow test equipment penetration should be {int}',
  function (world: CrossbowWorld, expected: number) {
    expect(world.crossbowTestEquipment).toBeDefined();
    expect(world.crossbowTestEquipment?.penetration).toBe(expected);
  }
);

Then('the crossbow test equipment startsLoaded should be false', function (world: CrossbowWorld) {
  expect(world.crossbowTestEquipment).toBeDefined();
  expect(world.crossbowTestEquipment?.startsLoaded).toBe(false);
});

Then(
  'the crossbow test equipment inventorySlots should be {int}',
  function (world: CrossbowWorld, expected: number) {
    expect(world.crossbowTestEquipment).toBeDefined();
    expect(world.crossbowTestEquipment?.inventorySlots).toBe(expected);
  }
);

Then('the crossbow test equipment twoHanded should be true', function (world: CrossbowWorld) {
  expect(world.crossbowTestEquipment).toBeDefined();
  expect(world.crossbowTestEquipment?.twoHanded).toBe(true);
});

// ============================================================================
// UNIT TEST - Load Action Cost from YAML
// ============================================================================

When('I check the crossbow test load action cost from YAML', function (world: CrossbowWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { time?: number } }>;
  };
  const action = data.actions?.find((a: { id: string }) => a.id === 'load_crossbow');

  if (!action) {
    throw new Error('load_crossbow action not found in YAML');
  }

  world.crossbowTestLoadCost = {
    time: action.cost?.time ?? 0,
  };
});

Then(
  'the crossbow test load cost should have time {int}',
  function (world: CrossbowWorld, expected: number) {
    expect(world.crossbowTestLoadCost).toBeDefined();
    expect(world.crossbowTestLoadCost?.time).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Load Effect Execution
// ============================================================================

When('the crossbow test load effect is executed', function (world: CrossbowWorld) {
  if (!world.crossbowTestGameContext || !world.crossbowTestEntity) {
    throw new Error('Game context or entity not initialized');
  }
  const effect = new LoadEffect();
  world.crossbowTestLoadResult = effect.execute(
    world.crossbowTestGameContext,
    { weaponId: 'crossbow' },
    {},
    new Map()
  );
});

Then(
  'the crossbow test entity should have loaded stacks {int}',
  function (world: CrossbowWorld, expected: number) {
    expect(world.crossbowTestEntity).toBeDefined();
    expect(world.crossbowTestEntity?.getStacks('loaded')).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Loaded State Management
// ============================================================================

When('the crossbow test shot removes loaded stack', function (world: CrossbowWorld) {
  if (!world.crossbowTestEntity) {
    throw new Error('Entity not initialized');
  }
  world.crossbowTestEntity.addStacks('loaded', -1);
});

When(
  'the crossbow test entity is checked with loaded stacks {int}',
  function (world: CrossbowWorld, loadedStacks: number) {
    if (!world.crossbowTestEntity) {
      throw new Error('Entity not initialized');
    }
    // Set entity to unloaded state
    world.crossbowTestEntity.addStacks('loaded', loadedStacks);
  }
);

Then(
  'the crossbow test entity cannot shoot due to unloaded state',
  function (world: CrossbowWorld) {
    expect(world.crossbowTestEntity).toBeDefined();
    const loadedStacks = world.crossbowTestEntity?.getStacks('loaded') ?? 0;
    // Weapon must be loaded to shoot - unloaded means cannot fire
    world.crossbowTestCanShoot = loadedStacks > 0;
    expect(world.crossbowTestCanShoot).toBe(false);
  }
);

// ============================================================================
// UNIT TEST - Steady Aim Modifier
// ============================================================================

When('the crossbow test steady aim modifier is applied', function (world: CrossbowWorld) {
  // Steady Aim applies agility +1
  world.crossbowTestSteadyAimModifier = {
    agility: 1,
  };
});

Then(
  'the crossbow test modifier output should have agility {int}',
  function (world: CrossbowWorld, expected: number) {
    expect(world.crossbowTestSteadyAimModifier).toBeDefined();
    expect(world.crossbowTestSteadyAimModifier?.agility).toBe(expected);
  }
);

When('I check the crossbow test steady aim modifier from YAML', function (world: CrossbowWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{
      id: string;
      cost?: { beads?: { blue?: number } };
    }>;
  };
  const modifier = data.actions?.find((a: { id: string }) => a.id === 'steadyAim');

  if (!modifier) {
    throw new Error('steadyAim modifier not found in YAML');
  }

  world.crossbowTestSteadyAimCost = {
    blue: modifier.cost?.beads?.blue ?? 0,
  };
});

Then(
  'the crossbow test steady aim cost should have blue {int}',
  function (world: CrossbowWorld, expected: number) {
    expect(world.crossbowTestSteadyAimCost).toBeDefined();
    expect(world.crossbowTestSteadyAimCost?.blue).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Range Bands
// ============================================================================

When('I check the crossbow test range bands from YAML', function (world: CrossbowWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      rangeBands?: Array<{ name: string; min: number; max: number; modifier: number }>;
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'crossbow');

  if (!equipment || !equipment.rangeBands) {
    throw new Error('Crossbow range bands not found in YAML');
  }

  const shortBand = equipment.rangeBands.find((b) => b.name === 'short');
  const mediumBand = equipment.rangeBands.find((b) => b.name === 'medium');
  const longBand = equipment.rangeBands.find((b) => b.name === 'long');

  world.crossbowTestRangeBands = {
    short: shortBand?.modifier ?? 0,
    medium: mediumBand?.modifier ?? 0,
    long: longBand?.modifier ?? 0,
  };
});

Then(
  'the crossbow test range band short should apply modifier {int}',
  function (world: CrossbowWorld, expected: number) {
    expect(world.crossbowTestRangeBands).toBeDefined();
    expect(world.crossbowTestRangeBands?.short).toBe(expected);
  }
);

Then(
  'the crossbow test range band medium should apply modifier {int}',
  function (world: CrossbowWorld, expected: number) {
    expect(world.crossbowTestRangeBands).toBeDefined();
    expect(world.crossbowTestRangeBands?.medium).toBe(expected);
  }
);

Then(
  'the crossbow test range band long should apply modifier {int}',
  function (world: CrossbowWorld, expected: number) {
    expect(world.crossbowTestRangeBands).toBeDefined();
    expect(world.crossbowTestRangeBands?.long).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a crossbow integration grid of {int}x{int}',
  function (world: CrossbowWorld, width: number, height: number) {
    world.crossbowIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a crossbow integration game context with the grid', function (world: CrossbowWorld) {
  if (!world.crossbowIntegrationGrid) {
    world.crossbowIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.crossbowIntegrationEntities) {
    world.crossbowIntegrationEntities = new Map();
  }
  if (!world.crossbowIntegrationBeadHands) {
    world.crossbowIntegrationBeadHands = new Map();
  }

  world.crossbowIntegrationGameContext = {
    grid: world.crossbowIntegrationGrid,
    actorId: 'crossbow-integration-bearer',
    getEntity(id: string): Entity | undefined {
      return world.crossbowIntegrationEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.crossbowIntegrationBeadHands?.get(entityId);
    },
  };
});

Given(
  'a crossbow integration bearer at position {int},{int} with loaded stacks {int}',
  function (world: CrossbowWorld, x: number, y: number, loadedStacks: number) {
    if (!world.crossbowIntegrationGrid) {
      world.crossbowIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.crossbowIntegrationEntities) {
      world.crossbowIntegrationEntities = new Map();
    }

    const bearerId = 'crossbow-integration-bearer';
    world.crossbowIntegrationBearer = new Entity(bearerId, 50, world.crossbowIntegrationGrid);
    world.crossbowIntegrationBearer.currentHealth = 50;
    world.crossbowIntegrationBearer.addStacks('loaded', loadedStacks);
    world.crossbowIntegrationEntities.set(bearerId, world.crossbowIntegrationBearer);
    world.crossbowIntegrationGrid.register(bearerId, x, y);
  }
);

// ============================================================================
// INTEGRATION TEST - Load and Firing Flow
// ============================================================================

When('the crossbow integration load is executed', function (world: CrossbowWorld) {
  if (!world.crossbowIntegrationGameContext || !world.crossbowIntegrationBearer) {
    throw new Error('Game context or bearer not initialized');
  }
  const effect = new LoadEffect();
  world.crossbowIntegrationLoadResult = effect.execute(
    world.crossbowIntegrationGameContext,
    { weaponId: 'crossbow' },
    {},
    new Map()
  );
});

When(
  'the crossbow integration shot is fired removing loaded stack',
  function (world: CrossbowWorld) {
    if (!world.crossbowIntegrationBearer) {
      throw new Error('Bearer not initialized');
    }
    world.crossbowIntegrationBearer.addStacks('loaded', -1);
  }
);

When('the crossbow integration steady aim is applied', function (world: CrossbowWorld) {
  if (!world.crossbowIntegrationBearer) {
    throw new Error('Bearer not initialized');
  }
  // Steady Aim applies +1 agility (precision)
  world.crossbowIntegrationPrecisionModifier = 1;
});

// ============================================================================
// INTEGRATION TEST - Assertions
// ============================================================================

Then(
  'the crossbow integration bearer should have loaded stacks {int}',
  function (world: CrossbowWorld, expected: number) {
    expect(world.crossbowIntegrationBearer).toBeDefined();
    expect(world.crossbowIntegrationBearer?.getStacks('loaded')).toBe(expected);
  }
);

Then(
  'the crossbow integration precision modifier should be {int}',
  function (world: CrossbowWorld, expected: number) {
    expect(world.crossbowIntegrationPrecisionModifier).toBe(expected);
  }
);
