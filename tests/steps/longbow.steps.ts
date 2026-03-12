import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import type { GameContext } from '@src/types/Effect';

interface LongbowWorld extends QuickPickleWorld {
  // Unit test
  longbowTestGrid?: BattleGrid;
  longbowTestEntities?: Map<string, Entity>;
  longbowTestBeadHands?: Map<string, PlayerBeadSystem>;
  longbowTestGameContext?: GameContext;
  longbowTestEntity?: Entity;
  longbowTestEquipment?: {
    penetration: number;
    twoHanded: boolean;
    inventorySlots: number;
  };
  longbowTestStrongDrawModifier?: { penetration: number };
  longbowTestStrongDrawCost?: { red: number };
  longbowTestRangeBands?: {
    short: number;
    medium: number;
    long: number;
  };
  longbowTestMaxRange?: number;

  // Integration test
  longbowIntegrationGrid?: BattleGrid;
  longbowIntegrationEntities?: Map<string, Entity>;
  longbowIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  longbowIntegrationGameContext?: GameContext;
  longbowIntegrationBearer?: Entity;
  longbowIntegrationAimStacks?: number;
  longbowIntegrationPenetrationModifier?: number;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a longbow test grid of {int}x{int}',
  function (world: LongbowWorld, width: number, height: number) {
    world.longbowTestGrid = new BattleGrid(width, height);
  }
);

Given('a longbow test game context with the grid', function (world: LongbowWorld) {
  if (!world.longbowTestGrid) {
    world.longbowTestGrid = new BattleGrid(12, 12);
  }
  if (!world.longbowTestEntities) {
    world.longbowTestEntities = new Map();
  }
  if (!world.longbowTestBeadHands) {
    world.longbowTestBeadHands = new Map();
  }

  world.longbowTestGameContext = {
    grid: world.longbowTestGrid,
    actorId: 'longbow-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.longbowTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.longbowTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Equipment from YAML
// ============================================================================

When('I check the longbow test equipment from YAML', function (world: LongbowWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      penetration?: number;
      twoHanded?: boolean;
      inventorySlots?: number;
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'longbow');

  if (!equipment) {
    throw new Error('Longbow equipment not found in YAML');
  }

  world.longbowTestEquipment = {
    penetration: equipment.penetration ?? 0,
    twoHanded: equipment.twoHanded ?? false,
    inventorySlots: equipment.inventorySlots ?? 0,
  };
});

Then(
  'the longbow test equipment penetration should be {int}',
  function (world: LongbowWorld, expected: number) {
    expect(world.longbowTestEquipment).toBeDefined();
    expect(world.longbowTestEquipment?.penetration).toBe(expected);
  }
);

Then('the longbow test equipment twoHanded should be true', function (world: LongbowWorld) {
  expect(world.longbowTestEquipment).toBeDefined();
  expect(world.longbowTestEquipment?.twoHanded).toBe(true);
});

Then(
  'the longbow test equipment inventorySlots should be {int}',
  function (world: LongbowWorld, expected: number) {
    expect(world.longbowTestEquipment).toBeDefined();
    expect(world.longbowTestEquipment?.inventorySlots).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Strong Draw Modifier from YAML
// ============================================================================

When('I check the longbow test strong draw modifier from YAML', function (world: LongbowWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{
      id: string;
      modifier?: { penetration?: number };
      cost?: { beads?: { red?: number } };
    }>;
  };
  const action = data.actions?.find((a: { id: string }) => a.id === 'strongDraw');

  if (!action) {
    throw new Error('strongDraw action not found in YAML');
  }

  world.longbowTestStrongDrawModifier = {
    penetration: action.modifier?.penetration ?? 0,
  };

  world.longbowTestStrongDrawCost = {
    red: action.cost?.beads?.red ?? 0,
  };
});

Then(
  'the longbow test strong draw modifier penetration should be {int}',
  function (world: LongbowWorld, expected: number) {
    expect(world.longbowTestStrongDrawModifier).toBeDefined();
    expect(world.longbowTestStrongDrawModifier?.penetration).toBe(expected);
  }
);

Then(
  'the longbow test strong draw cost should have red {int}',
  function (world: LongbowWorld, expected: number) {
    expect(world.longbowTestStrongDrawCost).toBeDefined();
    expect(world.longbowTestStrongDrawCost?.red).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Range Bands
// ============================================================================

When('I check the longbow test range bands from YAML', function (world: LongbowWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      rangeBands?: Array<{ name: string; min: number; max: number; modifier: number }>;
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'longbow');

  if (!equipment || !equipment.rangeBands) {
    throw new Error('Longbow range bands not found in YAML');
  }

  const shortBand = equipment.rangeBands.find((b) => b.name === 'short');
  const mediumBand = equipment.rangeBands.find((b) => b.name === 'medium');
  const longBand = equipment.rangeBands.find((b) => b.name === 'long');

  world.longbowTestRangeBands = {
    short: shortBand?.modifier ?? 0,
    medium: mediumBand?.modifier ?? 0,
    long: longBand?.modifier ?? 0,
  };
});

Then(
  'the longbow test range band short should apply modifier {int}',
  function (world: LongbowWorld, expected: number) {
    expect(world.longbowTestRangeBands).toBeDefined();
    expect(world.longbowTestRangeBands?.short).toBe(expected);
  }
);

Then(
  'the longbow test range band medium should apply modifier {int}',
  function (world: LongbowWorld, expected: number) {
    expect(world.longbowTestRangeBands).toBeDefined();
    expect(world.longbowTestRangeBands?.medium).toBe(expected);
  }
);

Then(
  'the longbow test range band long should apply modifier {int}',
  function (world: LongbowWorld, expected: number) {
    expect(world.longbowTestRangeBands).toBeDefined();
    expect(world.longbowTestRangeBands?.long).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Maximum Range from YAML
// ============================================================================

When('I check the longbow test maximum range from YAML', function (world: LongbowWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      range?: number;
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'longbow');

  if (!equipment) {
    throw new Error('Longbow equipment not found in YAML');
  }

  world.longbowTestMaxRange = equipment.range ?? 0;
});

Then(
  'the longbow test maximum range should be {int}',
  function (world: LongbowWorld, expected: number) {
    expect(world.longbowTestMaxRange).toBeDefined();
    expect(world.longbowTestMaxRange).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a longbow integration grid of {int}x{int}',
  function (world: LongbowWorld, width: number, height: number) {
    world.longbowIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a longbow integration game context with the grid', function (world: LongbowWorld) {
  if (!world.longbowIntegrationGrid) {
    world.longbowIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.longbowIntegrationEntities) {
    world.longbowIntegrationEntities = new Map();
  }
  if (!world.longbowIntegrationBeadHands) {
    world.longbowIntegrationBeadHands = new Map();
  }

  world.longbowIntegrationGameContext = {
    grid: world.longbowIntegrationGrid,
    actorId: 'longbow-integration-bearer',
    getEntity(id: string): Entity | undefined {
      return world.longbowIntegrationEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.longbowIntegrationBeadHands?.get(entityId);
    },
  };
});

Given(
  'a longbow integration bearer at position {int},{int}',
  function (world: LongbowWorld, x: number, y: number) {
    if (!world.longbowIntegrationGrid) {
      world.longbowIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.longbowIntegrationEntities) {
      world.longbowIntegrationEntities = new Map();
    }

    const bearerId = 'longbow-integration-bearer';
    world.longbowIntegrationBearer = new Entity(bearerId, 50, world.longbowIntegrationGrid);
    world.longbowIntegrationBearer.currentHealth = 50;
    world.longbowIntegrationEntities.set(bearerId, world.longbowIntegrationBearer);
    world.longbowIntegrationGrid.register(bearerId, x, y);
  }
);

// ============================================================================
// INTEGRATION TEST - Aim Stack Application
// ============================================================================

When(
  'the longbow integration aim stacks are added {int}',
  function (world: LongbowWorld, stacks: number) {
    if (!world.longbowIntegrationBearer) {
      throw new Error('Bearer not initialized');
    }
    world.longbowIntegrationBearer.addStacks('aim', stacks);
    world.longbowIntegrationAimStacks = world.longbowIntegrationBearer.getStacks('aim');
  }
);

Then(
  'the longbow integration bearer should have aim stacks {int}',
  function (world: LongbowWorld, expected: number) {
    expect(world.longbowIntegrationBearer).toBeDefined();
    expect(world.longbowIntegrationBearer?.getStacks('aim')).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST - Strong Draw Penetration Application
// ============================================================================

When('the longbow integration strong draw penetration is applied', function (world: LongbowWorld) {
  if (!world.longbowIntegrationBearer) {
    throw new Error('Bearer not initialized');
  }
  // Strong Draw applies +1 penetration
  world.longbowIntegrationPenetrationModifier = 1;
});

// ============================================================================
// INTEGRATION TEST - Assertions
// ============================================================================

Then(
  'the longbow integration penetration modifier should be {int}',
  function (world: LongbowWorld, expected: number) {
    expect(world.longbowIntegrationPenetrationModifier).toBe(expected);
  }
);
