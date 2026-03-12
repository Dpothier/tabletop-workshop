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

interface PistolWorld extends QuickPickleWorld {
  // Unit test
  pistolTestGrid?: BattleGrid;
  pistolTestEntities?: Map<string, Entity>;
  pistolTestBeadHands?: Map<string, PlayerBeadSystem>;
  pistolTestGameContext?: GameContext;
  pistolTestEntity?: Entity;
  pistolTestLoadResult?: EffectResult;
  pistolTestEquipment?: {
    penetration: number;
    startsLoaded: boolean;
    inventorySlots: number;
    twoHanded: boolean;
  };
  pistolTestReloadCost?: { time: number };
  pistolTestRangeBands?: {
    short: number;
    medium: number;
    long: number;
  };
  pistolTestCanShoot?: boolean;

  // Integration test
  pistolIntegrationGrid?: BattleGrid;
  pistolIntegrationEntities?: Map<string, Entity>;
  pistolIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  pistolIntegrationGameContext?: GameContext;
  pistolIntegrationBearer?: Entity;
  pistolIntegrationReloadResult?: EffectResult;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a pistol test grid of {int}x{int}',
  function (world: PistolWorld, width: number, height: number) {
    world.pistolTestGrid = new BattleGrid(width, height);
  }
);

Given('a pistol test game context with the grid', function (world: PistolWorld) {
  if (!world.pistolTestGrid) {
    world.pistolTestGrid = new BattleGrid(12, 12);
  }
  if (!world.pistolTestEntities) {
    world.pistolTestEntities = new Map();
  }
  if (!world.pistolTestBeadHands) {
    world.pistolTestBeadHands = new Map();
  }

  world.pistolTestGameContext = {
    grid: world.pistolTestGrid,
    actorId: 'pistol-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.pistolTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.pistolTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a pistol test entity at position {int},{int}',
  function (world: PistolWorld, x: number, y: number) {
    if (!world.pistolTestGrid) {
      world.pistolTestGrid = new BattleGrid(12, 12);
    }
    if (!world.pistolTestEntities) {
      world.pistolTestEntities = new Map();
    }

    const entityId = 'pistol-test-bearer';
    world.pistolTestEntity = new Entity(entityId, 50, world.pistolTestGrid);
    world.pistolTestEntity.currentHealth = 50;
    world.pistolTestEntities.set(entityId, world.pistolTestEntity);
    world.pistolTestGrid.register(entityId, x, y);
  }
);

// ============================================================================
// UNIT TEST - Equipment from YAML
// ============================================================================

When('I check the pistol test equipment from YAML', function (world: PistolWorld) {
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
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'pistol');

  if (!equipment) {
    throw new Error('Pistol equipment not found in YAML');
  }

  world.pistolTestEquipment = {
    penetration: equipment.penetration ?? 0,
    startsLoaded: equipment.startsLoaded ?? false,
    inventorySlots: equipment.inventorySlots ?? 0,
    twoHanded: equipment.twoHanded ?? false,
  };
});

Then(
  'the pistol test equipment penetration should be {int}',
  function (world: PistolWorld, expected: number) {
    expect(world.pistolTestEquipment).toBeDefined();
    expect(world.pistolTestEquipment?.penetration).toBe(expected);
  }
);

Then('the pistol test equipment startsLoaded should be true', function (world: PistolWorld) {
  expect(world.pistolTestEquipment).toBeDefined();
  expect(world.pistolTestEquipment?.startsLoaded).toBe(true);
});

Then(
  'the pistol test equipment inventorySlots should be {int}',
  function (world: PistolWorld, expected: number) {
    expect(world.pistolTestEquipment).toBeDefined();
    expect(world.pistolTestEquipment?.inventorySlots).toBe(expected);
  }
);

Then('the pistol test equipment twoHanded should be false', function (world: PistolWorld) {
  expect(world.pistolTestEquipment).toBeDefined();
  expect(world.pistolTestEquipment?.twoHanded).toBe(false);
});

// ============================================================================
// UNIT TEST - Reload Action Cost from YAML
// ============================================================================

When('I check the pistol test reload action cost from YAML', function (world: PistolWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { time?: number } }>;
  };
  const action = data.actions?.find((a: { id: string }) => a.id === 'reload_pistol');

  if (!action) {
    throw new Error('reload_pistol action not found in YAML');
  }

  world.pistolTestReloadCost = {
    time: action.cost?.time ?? 0,
  };
});

Then(
  'the pistol test reload cost should have time {int}',
  function (world: PistolWorld, expected: number) {
    expect(world.pistolTestReloadCost).toBeDefined();
    expect(world.pistolTestReloadCost?.time).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Load Effect Execution
// ============================================================================

When('the pistol test load effect is executed', function (world: PistolWorld) {
  if (!world.pistolTestGameContext || !world.pistolTestEntity) {
    throw new Error('Game context or entity not initialized');
  }
  const effect = new LoadEffect();
  world.pistolTestLoadResult = effect.execute(
    world.pistolTestGameContext,
    { weaponId: 'pistol' },
    {},
    new Map()
  );
});

Then(
  'the pistol test entity should have loaded stacks {int}',
  function (world: PistolWorld, expected: number) {
    expect(world.pistolTestEntity).toBeDefined();
    expect(world.pistolTestEntity?.getStacks('loaded')).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Loaded State Management
// ============================================================================

When('the pistol test shot removes loaded stack', function (world: PistolWorld) {
  if (!world.pistolTestEntity) {
    throw new Error('Entity not initialized');
  }
  world.pistolTestEntity.addStacks('loaded', -1);
});

When(
  'the pistol test entity is checked with loaded stacks {int}',
  function (world: PistolWorld, loadedStacks: number) {
    if (!world.pistolTestEntity) {
      throw new Error('Entity not initialized');
    }
    // Set entity to unloaded state
    world.pistolTestEntity.addStacks('loaded', loadedStacks);
  }
);

Then('the pistol test entity cannot shoot due to unloaded state', function (world: PistolWorld) {
  expect(world.pistolTestEntity).toBeDefined();
  const loadedStacks = world.pistolTestEntity?.getStacks('loaded') ?? 0;
  // Weapon must be loaded to shoot - unloaded means cannot fire
  world.pistolTestCanShoot = loadedStacks > 0;
  expect(world.pistolTestCanShoot).toBe(false);
});

// ============================================================================
// UNIT TEST - Range Bands
// ============================================================================

When('I check the pistol test range bands from YAML', function (world: PistolWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      rangeBands?: Array<{ name: string; min: number; max: number; modifier: number }>;
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'pistol');

  if (!equipment || !equipment.rangeBands) {
    throw new Error('Pistol range bands not found in YAML');
  }

  const shortBand = equipment.rangeBands.find((b) => b.name === 'short');
  const mediumBand = equipment.rangeBands.find((b) => b.name === 'medium');
  const longBand = equipment.rangeBands.find((b) => b.name === 'long');

  world.pistolTestRangeBands = {
    short: shortBand?.modifier ?? 0,
    medium: mediumBand?.modifier ?? 0,
    long: longBand?.modifier ?? 0,
  };
});

Then(
  'the pistol test range band short should apply modifier {int}',
  function (world: PistolWorld, expected: number) {
    expect(world.pistolTestRangeBands).toBeDefined();
    expect(world.pistolTestRangeBands?.short).toBe(expected);
  }
);

Then(
  'the pistol test range band medium should apply modifier {int}',
  function (world: PistolWorld, expected: number) {
    expect(world.pistolTestRangeBands).toBeDefined();
    expect(world.pistolTestRangeBands?.medium).toBe(expected);
  }
);

Then(
  'the pistol test range band long should apply modifier {int}',
  function (world: PistolWorld, expected: number) {
    expect(world.pistolTestRangeBands).toBeDefined();
    expect(world.pistolTestRangeBands?.long).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a pistol integration grid of {int}x{int}',
  function (world: PistolWorld, width: number, height: number) {
    world.pistolIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a pistol integration game context with the grid', function (world: PistolWorld) {
  if (!world.pistolIntegrationGrid) {
    world.pistolIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.pistolIntegrationEntities) {
    world.pistolIntegrationEntities = new Map();
  }
  if (!world.pistolIntegrationBeadHands) {
    world.pistolIntegrationBeadHands = new Map();
  }

  world.pistolIntegrationGameContext = {
    grid: world.pistolIntegrationGrid,
    actorId: 'pistol-integration-bearer',
    getEntity(id: string): Entity | undefined {
      return world.pistolIntegrationEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.pistolIntegrationBeadHands?.get(entityId);
    },
  };
});

Given(
  'a pistol integration bearer at position {int},{int} with loaded stacks {int}',
  function (world: PistolWorld, x: number, y: number, loadedStacks: number) {
    if (!world.pistolIntegrationGrid) {
      world.pistolIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.pistolIntegrationEntities) {
      world.pistolIntegrationEntities = new Map();
    }

    const bearerId = 'pistol-integration-bearer';
    world.pistolIntegrationBearer = new Entity(bearerId, 50, world.pistolIntegrationGrid);
    world.pistolIntegrationBearer.currentHealth = 50;
    world.pistolIntegrationBearer.addStacks('loaded', loadedStacks);
    world.pistolIntegrationEntities.set(bearerId, world.pistolIntegrationBearer);
    world.pistolIntegrationGrid.register(bearerId, x, y);
  }
);

// ============================================================================
// INTEGRATION TEST - Reload and Firing Flow
// ============================================================================

When('the pistol integration shot is fired removing loaded stack', function (world: PistolWorld) {
  if (!world.pistolIntegrationBearer) {
    throw new Error('Bearer not initialized');
  }
  world.pistolIntegrationBearer.addStacks('loaded', -1);
});

When('the pistol integration reload is executed', function (world: PistolWorld) {
  if (!world.pistolIntegrationGameContext || !world.pistolIntegrationBearer) {
    throw new Error('Game context or bearer not initialized');
  }
  const effect = new LoadEffect();
  world.pistolIntegrationReloadResult = effect.execute(
    world.pistolIntegrationGameContext,
    { weaponId: 'pistol' },
    {},
    new Map()
  );
});

// ============================================================================
// INTEGRATION TEST - Assertions
// ============================================================================

Then(
  'the pistol integration bearer should have loaded stacks {int}',
  function (world: PistolWorld, expected: number) {
    expect(world.pistolIntegrationBearer).toBeDefined();
    expect(world.pistolIntegrationBearer?.getStacks('loaded')).toBe(expected);
  }
);
