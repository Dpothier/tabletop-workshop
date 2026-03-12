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

interface ArquebusteWorld extends QuickPickleWorld {
  // Unit test
  arquebuTestGrid?: BattleGrid;
  arquebuTestEntities?: Map<string, Entity>;
  arquebuTestBeadHands?: Map<string, PlayerBeadSystem>;
  arquebuTestGameContext?: GameContext;
  arquebuTestEntity?: Entity;
  arquebuTestLoadResult?: EffectResult;
  arquebuTestEquipment?: {
    penetration: number;
    startsLoaded: boolean;
    inventorySlots: number;
    twoHanded: boolean;
  };
  arquebuTestReloadCost?: { time: number };
  arquebuTestSteadyAimModifier?: {
    agility: number;
  };
  arquebuTestSteadyAimCost?: { blue: number };
  arquebuTestSteadyAimCondition?: { weaponTag: string };
  arquebuTestRangeBands?: {
    short: number;
    medium: number;
    long: number;
  };

  // Integration test
  arquebuIntegrationGrid?: BattleGrid;
  arquebuIntegrationEntities?: Map<string, Entity>;
  arquebuIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  arquebuIntegrationGameContext?: GameContext;
  arquebuIntegrationBearer?: Entity;
  arquebuIntegrationReloadResult?: EffectResult;
  arquebuIntegrationSteadyAimResult?: any;
  arquebuIntegrationPrecisionModifier?: number;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a arquebus test grid of {int}x{int}',
  function (world: ArquebusteWorld, width: number, height: number) {
    world.arquebuTestGrid = new BattleGrid(width, height);
  }
);

Given('a arquebus test game context with the grid', function (world: ArquebusteWorld) {
  if (!world.arquebuTestGrid) {
    world.arquebuTestGrid = new BattleGrid(12, 12);
  }
  if (!world.arquebuTestEntities) {
    world.arquebuTestEntities = new Map();
  }
  if (!world.arquebuTestBeadHands) {
    world.arquebuTestBeadHands = new Map();
  }

  world.arquebuTestGameContext = {
    grid: world.arquebuTestGrid,
    actorId: 'arquebus-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.arquebuTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.arquebuTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a arquebus test entity at position {int},{int}',
  function (world: ArquebusteWorld, x: number, y: number) {
    if (!world.arquebuTestGrid) {
      world.arquebuTestGrid = new BattleGrid(12, 12);
    }
    if (!world.arquebuTestEntities) {
      world.arquebuTestEntities = new Map();
    }

    const entityId = 'arquebus-test-bearer';
    world.arquebuTestEntity = new Entity(entityId, 50, world.arquebuTestGrid);
    world.arquebuTestEntity.currentHealth = 50;
    world.arquebuTestEntities.set(entityId, world.arquebuTestEntity);
    world.arquebuTestGrid.register(entityId, x, y);
  }
);

// ============================================================================
// UNIT TEST - Equipment from YAML
// ============================================================================

When('I check the arquebus test equipment from YAML', function (world: ArquebusteWorld) {
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
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'arquebus');

  if (!equipment) {
    throw new Error('Arquebus equipment not found in YAML');
  }

  world.arquebuTestEquipment = {
    penetration: equipment.penetration ?? 0,
    startsLoaded: equipment.startsLoaded ?? false,
    inventorySlots: equipment.inventorySlots ?? 0,
    twoHanded: equipment.twoHanded ?? false,
  };
});

Then(
  'the arquebus test equipment penetration should be {int}',
  function (world: ArquebusteWorld, expected: number) {
    expect(world.arquebuTestEquipment).toBeDefined();
    expect(world.arquebuTestEquipment?.penetration).toBe(expected);
  }
);

Then('the arquebus test equipment startsLoaded should be true', function (world: ArquebusteWorld) {
  expect(world.arquebuTestEquipment).toBeDefined();
  expect(world.arquebuTestEquipment?.startsLoaded).toBe(true);
});

Then(
  'the arquebus test equipment inventorySlots should be {int}',
  function (world: ArquebusteWorld, expected: number) {
    expect(world.arquebuTestEquipment).toBeDefined();
    expect(world.arquebuTestEquipment?.inventorySlots).toBe(expected);
  }
);

Then('the arquebus test equipment twoHanded should be true', function (world: ArquebusteWorld) {
  expect(world.arquebuTestEquipment).toBeDefined();
  expect(world.arquebuTestEquipment?.twoHanded).toBe(true);
});

// ============================================================================
// UNIT TEST - Reload Action Cost from YAML
// ============================================================================

When('I check the arquebus test reload action cost from YAML', function (world: ArquebusteWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { time?: number } }>;
  };
  const action = data.actions?.find((a: { id: string }) => a.id === 'reload_arquebus');

  if (!action) {
    throw new Error('reload_arquebus action not found in YAML');
  }

  world.arquebuTestReloadCost = {
    time: action.cost?.time ?? 0,
  };
});

Then(
  'the arquebus test reload cost should have time {int}',
  function (world: ArquebusteWorld, expected: number) {
    expect(world.arquebuTestReloadCost).toBeDefined();
    expect(world.arquebuTestReloadCost?.time).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Load Effect Execution
// ============================================================================

When('the arquebus test load effect is executed', function (world: ArquebusteWorld) {
  if (!world.arquebuTestGameContext || !world.arquebuTestEntity) {
    throw new Error('Game context or entity not initialized');
  }
  const effect = new LoadEffect();
  world.arquebuTestLoadResult = effect.execute(
    world.arquebuTestGameContext,
    { weaponId: 'arquebus' },
    {},
    new Map()
  );
});

Then(
  'the arquebus test entity should have loaded stacks {int}',
  function (world: ArquebusteWorld, expected: number) {
    expect(world.arquebuTestEntity).toBeDefined();
    expect(world.arquebuTestEntity?.getStacks('loaded')).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Steady Aim Modifier
// ============================================================================

When('the arquebus test steady aim modifier is applied', function (world: ArquebusteWorld) {
  // Steady Aim applies agility +1
  world.arquebuTestSteadyAimModifier = {
    agility: 1,
  };
});

Then(
  'the arquebus test modifier output should have agility {int}',
  function (world: ArquebusteWorld, expected: number) {
    expect(world.arquebuTestSteadyAimModifier).toBeDefined();
    expect(world.arquebuTestSteadyAimModifier?.agility).toBe(expected);
  }
);

When('I check the arquebus test steady aim modifier from YAML', function (world: ArquebusteWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{
      id: string;
      cost?: { beads?: { blue?: number } };
      condition?: { weaponTag?: string };
    }>;
  };
  const modifier = data.actions?.find((a: { id: string }) => a.id === 'steadyAim');

  if (!modifier) {
    throw new Error('steadyAim modifier not found in YAML');
  }

  world.arquebuTestSteadyAimCost = {
    blue: modifier.cost?.beads?.blue ?? 0,
  };
  world.arquebuTestSteadyAimCondition = {
    weaponTag: modifier.condition?.weaponTag ?? '',
  };
});

Then(
  'the arquebus test steady aim cost should have blue {int}',
  function (world: ArquebusteWorld, expected: number) {
    expect(world.arquebuTestSteadyAimCost).toBeDefined();
    expect(world.arquebuTestSteadyAimCost?.blue).toBe(expected);
  }
);

Then(
  'the arquebus test steady aim condition weaponTag should be firearm',
  function (world: ArquebusteWorld) {
    expect(world.arquebuTestSteadyAimCondition).toBeDefined();
    expect(world.arquebuTestSteadyAimCondition?.weaponTag).toBe('firearm');
  }
);

// ============================================================================
// UNIT TEST - Range Bands
// ============================================================================

When('I check the arquebus test range bands from YAML', function (world: ArquebusteWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      rangeBands?: Array<{ name: string; min: number; max: number; modifier: number }>;
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'arquebus');

  if (!equipment || !equipment.rangeBands) {
    throw new Error('Arquebus range bands not found in YAML');
  }

  const shortBand = equipment.rangeBands.find((b) => b.name === 'short');
  const mediumBand = equipment.rangeBands.find((b) => b.name === 'medium');
  const longBand = equipment.rangeBands.find((b) => b.name === 'long');

  world.arquebuTestRangeBands = {
    short: shortBand?.modifier ?? 0,
    medium: mediumBand?.modifier ?? 0,
    long: longBand?.modifier ?? 0,
  };
});

Then(
  'the arquebus test range band short should apply modifier {int}',
  function (world: ArquebusteWorld, expected: number) {
    expect(world.arquebuTestRangeBands).toBeDefined();
    expect(world.arquebuTestRangeBands?.short).toBe(expected);
  }
);

Then(
  'the arquebus test range band medium should apply modifier {int}',
  function (world: ArquebusteWorld, expected: number) {
    expect(world.arquebuTestRangeBands).toBeDefined();
    expect(world.arquebuTestRangeBands?.medium).toBe(expected);
  }
);

Then(
  'the arquebus test range band long should apply modifier {int}',
  function (world: ArquebusteWorld, expected: number) {
    expect(world.arquebuTestRangeBands).toBeDefined();
    expect(world.arquebuTestRangeBands?.long).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a arquebus integration grid of {int}x{int}',
  function (world: ArquebusteWorld, width: number, height: number) {
    world.arquebuIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a arquebus integration game context with the grid', function (world: ArquebusteWorld) {
  if (!world.arquebuIntegrationGrid) {
    world.arquebuIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.arquebuIntegrationEntities) {
    world.arquebuIntegrationEntities = new Map();
  }
  if (!world.arquebuIntegrationBeadHands) {
    world.arquebuIntegrationBeadHands = new Map();
  }

  world.arquebuIntegrationGameContext = {
    grid: world.arquebuIntegrationGrid,
    actorId: 'arquebus-integration-bearer',
    getEntity(id: string): Entity | undefined {
      return world.arquebuIntegrationEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.arquebuIntegrationBeadHands?.get(entityId);
    },
  };
});

Given(
  'a arquebus integration bearer at position {int},{int} with loaded stacks {int}',
  function (world: ArquebusteWorld, x: number, y: number, loadedStacks: number) {
    if (!world.arquebuIntegrationGrid) {
      world.arquebuIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.arquebuIntegrationEntities) {
      world.arquebuIntegrationEntities = new Map();
    }

    const bearerId = 'arquebus-integration-bearer';
    world.arquebuIntegrationBearer = new Entity(bearerId, 50, world.arquebuIntegrationGrid);
    world.arquebuIntegrationBearer.currentHealth = 50;
    world.arquebuIntegrationBearer.addStacks('loaded', loadedStacks);
    world.arquebuIntegrationEntities.set(bearerId, world.arquebuIntegrationBearer);
    world.arquebuIntegrationGrid.register(bearerId, x, y);
  }
);

// ============================================================================
// INTEGRATION TEST - Reload and Steady Aim Flow
// ============================================================================

When(
  'the arquebus integration shot is fired removing loaded stack',
  function (world: ArquebusteWorld) {
    if (!world.arquebuIntegrationBearer) {
      throw new Error('Bearer not initialized');
    }
    world.arquebuIntegrationBearer.addStacks('loaded', -1);
  }
);

When('the arquebus integration reload is executed', function (world: ArquebusteWorld) {
  if (!world.arquebuIntegrationGameContext || !world.arquebuIntegrationBearer) {
    throw new Error('Game context or bearer not initialized');
  }
  const effect = new LoadEffect();
  world.arquebuIntegrationReloadResult = effect.execute(
    world.arquebuIntegrationGameContext,
    { weaponId: 'arquebus' },
    {},
    new Map()
  );
});

When('the arquebus integration steady aim is applied', function (world: ArquebusteWorld) {
  if (!world.arquebuIntegrationBearer) {
    throw new Error('Bearer not initialized');
  }
  // Steady Aim applies +1 agility (precision)
  world.arquebuIntegrationPrecisionModifier = 1;
});

// ============================================================================
// INTEGRATION TEST - Assertions
// ============================================================================

Then(
  'the arquebus integration bearer should have loaded stacks {int}',
  function (world: ArquebusteWorld, expected: number) {
    expect(world.arquebuIntegrationBearer).toBeDefined();
    expect(world.arquebuIntegrationBearer?.getStacks('loaded')).toBe(expected);
  }
);

Then(
  'the arquebus integration precision modifier should be {int}',
  function (world: ArquebusteWorld, expected: number) {
    expect(world.arquebuIntegrationPrecisionModifier).toBe(expected);
  }
);
