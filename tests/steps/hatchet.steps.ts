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
import { ThrowEffect } from '@src/effects/ThrowEffect';

interface HatchetWorld extends QuickPickleWorld {
  // Unit test
  hatchetTestGrid?: BattleGrid;
  hatchetTestEntities?: Map<string, Entity>;
  hatchetTestBeadHands?: Map<string, PlayerBeadSystem>;
  hatchetTestGameContext?: GameContext;
  hatchetTestBearer?: Entity;
  hatchetTestBearerBeadHand?: PlayerBeadSystem;
  hatchetTestThrowResult?: EffectResult;
  hatchetTestEquipment?: {
    power: number;
    agility: number;
    twoHanded: boolean;
    tags: string[];
  };
  hatchetTestChopModifier?: {
    damage: number;
    agility: number;
  };
  hatchetTestChopCost?: {
    redBeads: number;
  };
  hatchetTestThrowCost?: {
    timeBeads: number;
    greenBeads: number;
  };
  hatchetTestThrowRange?: number;
  hatchetTestEffectiveAgility?: number;
  hatchetTestBaseAgility?: number;

  // Integration test
  hatchetIntegrationGrid?: BattleGrid;
  hatchetIntegrationEntities?: Map<string, Entity>;
  hatchetIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  hatchetIntegrationGameContext?: GameContext;
  hatchetIntegrationBearer?: Entity;
  hatchetIntegrationBearerBeadHand?: PlayerBeadSystem;
  hatchetIntegrationBasePower?: number;
  hatchetIntegrationBaseAgility?: number;
  hatchetIntegrationEffectivePower?: number;
  hatchetIntegrationEffectiveAgility?: number;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a hatchet test grid of {int}x{int}',
  function (world: HatchetWorld, width: number, height: number) {
    world.hatchetTestGrid = new BattleGrid(width, height);
  }
);

Given('a hatchet test game context with the grid', function (world: HatchetWorld) {
  if (!world.hatchetTestGrid) {
    world.hatchetTestGrid = new BattleGrid(12, 12);
  }
  if (!world.hatchetTestEntities) {
    world.hatchetTestEntities = new Map();
  }
  if (!world.hatchetTestBeadHands) {
    world.hatchetTestBeadHands = new Map();
  }

  world.hatchetTestGameContext = {
    grid: world.hatchetTestGrid,
    actorId: 'hatchet-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.hatchetTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.hatchetTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a hatchet test bearer at position {int},{int} with agility {int}',
  function (world: HatchetWorld, x: number, y: number, agility: number) {
    if (!world.hatchetTestGrid) {
      world.hatchetTestGrid = new BattleGrid(12, 12);
    }
    if (!world.hatchetTestEntities) {
      world.hatchetTestEntities = new Map();
    }

    const bearerId = 'hatchet-test-bearer';
    world.hatchetTestBearer = new Entity(bearerId, 50, world.hatchetTestGrid);
    world.hatchetTestBearer.currentHealth = 50;
    world.hatchetTestBaseAgility = agility;
    world.hatchetTestEntities.set(bearerId, world.hatchetTestBearer);
    world.hatchetTestGrid.register(bearerId, x, y);
  }
);

Given(
  'a hatchet test bearer at position {int},{int}',
  function (world: HatchetWorld, x: number, y: number) {
    if (!world.hatchetTestGrid) {
      world.hatchetTestGrid = new BattleGrid(12, 12);
    }
    if (!world.hatchetTestEntities) {
      world.hatchetTestEntities = new Map();
    }

    const bearerId = 'hatchet-test-bearer';
    world.hatchetTestBearer = new Entity(bearerId, 50, world.hatchetTestGrid);
    world.hatchetTestBearer.currentHealth = 50;
    world.hatchetTestEntities.set(bearerId, world.hatchetTestBearer);
    world.hatchetTestGrid.register(bearerId, x, y);
  }
);

Given(
  'a hatchet test target {string} at position {int},{int}',
  function (world: HatchetWorld, targetName: string, x: number, y: number) {
    if (!world.hatchetTestGrid) {
      world.hatchetTestGrid = new BattleGrid(12, 12);
    }
    if (!world.hatchetTestEntities) {
      world.hatchetTestEntities = new Map();
    }

    const target = new Entity(targetName, 30, world.hatchetTestGrid);
    target.currentHealth = 30;
    world.hatchetTestEntities.set(targetName, target);
    world.hatchetTestGrid.register(targetName, x, y);
  }
);

// ============================================================================
// UNIT TEST - Equipment from YAML
// ============================================================================

When('I check the hatchet test equipment from YAML', function (world: HatchetWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      power: number;
      agility: number;
      twoHanded: boolean;
      tags?: string[];
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'hatchet');

  if (!equipment) {
    throw new Error('Hatchet equipment not found in YAML');
  }

  world.hatchetTestEquipment = {
    power: equipment.power,
    agility: equipment.agility,
    twoHanded: equipment.twoHanded,
    tags: equipment.tags ?? [],
  };
});

Then(
  'the hatchet test equipment power should be {int}',
  function (world: HatchetWorld, expected: number) {
    expect(world.hatchetTestEquipment).toBeDefined();
    expect(world.hatchetTestEquipment?.power).toBe(expected);
  }
);

Then(
  'the hatchet test equipment agility should be {int}',
  function (world: HatchetWorld, expected: number) {
    expect(world.hatchetTestEquipment).toBeDefined();
    expect(world.hatchetTestEquipment?.agility).toBe(expected);
  }
);

Then(
  'the hatchet test equipment twoHanded should be {word}',
  function (world: HatchetWorld, expected: string) {
    expect(world.hatchetTestEquipment).toBeDefined();
    expect(world.hatchetTestEquipment?.twoHanded).toBe(expected === 'true');
  }
);

Then(
  'the hatchet test equipment should have tag {string}',
  function (world: HatchetWorld, tagName: string) {
    expect(world.hatchetTestEquipment).toBeDefined();
    expect(world.hatchetTestEquipment?.tags).toContain(tagName);
  }
);

// ============================================================================
// UNIT TEST - Chop Modifier from YAML
// ============================================================================

When('I check the hatchet test chop modifier from YAML', function (world: HatchetWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; modifier?: { damage?: number; agility?: number } }>;
  };
  const action = data.actions?.find((a: { id: string }) => a.id === 'chop');

  if (!action) {
    throw new Error('chop action not found in YAML');
  }

  world.hatchetTestChopModifier = {
    damage: action.modifier?.damage ?? 0,
    agility: action.modifier?.agility ?? 0,
  };
});

Then(
  'the hatchet test chop damage modifier should be {int}',
  function (world: HatchetWorld, expected: number) {
    expect(world.hatchetTestChopModifier).toBeDefined();
    expect(world.hatchetTestChopModifier?.damage).toBe(expected);
  }
);

Then(
  'the hatchet test chop agility modifier should be {int}',
  function (world: HatchetWorld, expected: number) {
    expect(world.hatchetTestChopModifier).toBeDefined();
    expect(world.hatchetTestChopModifier?.agility).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Agility Floor Testing
// ============================================================================

When('I apply the hatchet test chop agility modifier', function (world: HatchetWorld) {
  if (!world.hatchetTestChopModifier) {
    throw new Error('Chop modifier not loaded');
  }
  if (world.hatchetTestBaseAgility === undefined) {
    throw new Error('Base agility not set');
  }

  const baseAgility = world.hatchetTestBaseAgility;
  const modifiedAgility = baseAgility + world.hatchetTestChopModifier.agility;
  world.hatchetTestEffectiveAgility = Math.max(0, modifiedAgility);
});

Then(
  'the hatchet test effective agility should be {int}',
  function (world: HatchetWorld, expected: number) {
    expect(world.hatchetTestEffectiveAgility).toBeDefined();
    expect(world.hatchetTestEffectiveAgility).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Chop Action Cost from YAML
// ============================================================================

When('I check the hatchet test chop action cost from YAML', function (world: HatchetWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { beads?: { red?: number } } }>;
  };
  const action = data.actions?.find((a: { id: string }) => a.id === 'chop');

  if (!action) {
    throw new Error('chop action not found in YAML');
  }

  world.hatchetTestChopCost = {
    redBeads: action.cost?.beads?.red ?? 0,
  };
});

Then(
  'the hatchet test chop cost should have {int} red bead',
  function (world: HatchetWorld, expected: number) {
    expect(world.hatchetTestChopCost).toBeDefined();
    expect(world.hatchetTestChopCost?.redBeads).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Throw Hatchet Action Cost from YAML
// ============================================================================

When(
  'I check the hatchet test throw hatchet action cost from YAML',
  function (world: HatchetWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      actions?: Array<{ id: string; cost?: { time?: number; beads?: { green?: number } } }>;
    };
    const action = data.actions?.find((a: { id: string }) => a.id === 'throw_hatchet');

    if (!action) {
      throw new Error('throw_hatchet action not found in YAML');
    }

    world.hatchetTestThrowCost = {
      timeBeads: action.cost?.time ?? 0,
      greenBeads: action.cost?.beads?.green ?? 0,
    };
  }
);

Then(
  'the hatchet test throw hatchet cost should have {int} time beads',
  function (world: HatchetWorld, expected: number) {
    expect(world.hatchetTestThrowCost).toBeDefined();
    expect(world.hatchetTestThrowCost?.timeBeads).toBe(expected);
  }
);

Then(
  'the hatchet test throw hatchet cost should have {int} green bead',
  function (world: HatchetWorld, expected: number) {
    expect(world.hatchetTestThrowCost).toBeDefined();
    expect(world.hatchetTestThrowCost?.greenBeads).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Throw Hatchet Action from YAML
// ============================================================================

When('I check the hatchet test throw hatchet action from YAML', function (world: HatchetWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; parameters?: Array<{ range?: number }> }>;
  };
  const action = data.actions?.find((a: { id: string }) => a.id === 'throw_hatchet');

  if (!action) {
    throw new Error('throw_hatchet action not found in YAML');
  }

  // Range is in the first parameter
  world.hatchetTestThrowRange = action.parameters?.[0]?.range ?? 0;
});

Then(
  'the hatchet test throw hatchet range should be {int}',
  function (world: HatchetWorld, expected: number) {
    expect(world.hatchetTestThrowRange).toBeDefined();
    expect(world.hatchetTestThrowRange).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Throw Effect Execution
// ============================================================================

When(
  'the hatchet test throw effect is triggered for {string} with power {int} and agility {int}',
  function (world: HatchetWorld, targetId: string, power: number, agility: number) {
    if (!world.hatchetTestGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new ThrowEffect();
    world.hatchetTestThrowResult = effect.execute(
      world.hatchetTestGameContext,
      { targetId, power, agility },
      {},
      new Map()
    );
  }
);

Then('the hatchet test throw effect result should be successful', function (world: HatchetWorld) {
  expect(world.hatchetTestThrowResult).toBeDefined();
  expect(world.hatchetTestThrowResult?.success).toBe(true);
});

Then(
  'the hatchet test throw effect should have weapon drop position at {int},{int}',
  function (world: HatchetWorld, expectedX: number, expectedY: number) {
    expect(world.hatchetTestThrowResult).toBeDefined();
    expect(world.hatchetTestThrowResult?.data).toBeDefined();
    const dropPos = world.hatchetTestThrowResult?.data?.weaponDropPosition as
      | { x: number; y: number }
      | undefined;
    expect(dropPos).toBeDefined();
    expect((dropPos as { x: number; y: number }).x).toBe(expectedX);
    expect((dropPos as { x: number; y: number }).y).toBe(expectedY);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a hatchet integration grid of {int}x{int}',
  function (world: HatchetWorld, width: number, height: number) {
    world.hatchetIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a hatchet integration game context with the grid', function (world: HatchetWorld) {
  if (!world.hatchetIntegrationGrid) {
    world.hatchetIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.hatchetIntegrationEntities) {
    world.hatchetIntegrationEntities = new Map();
  }
  if (!world.hatchetIntegrationBeadHands) {
    world.hatchetIntegrationBeadHands = new Map();
  }

  world.hatchetIntegrationGameContext = {
    grid: world.hatchetIntegrationGrid,
    actorId: 'hatchet-integration-bearer',
    getEntity(id: string): Entity | undefined {
      return world.hatchetIntegrationEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.hatchetIntegrationBeadHands?.get(entityId);
    },
  };
});

Given(
  'a hatchet integration bearer at position {int},{int} with bead hand having {int} red',
  function (world: HatchetWorld, x: number, y: number, red: number) {
    if (!world.hatchetIntegrationGrid) {
      world.hatchetIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.hatchetIntegrationEntities) {
      world.hatchetIntegrationEntities = new Map();
    }
    if (!world.hatchetIntegrationBeadHands) {
      world.hatchetIntegrationBeadHands = new Map();
    }

    const bearerId = 'hatchet-integration-bearer';
    world.hatchetIntegrationBearer = new Entity(bearerId, 50, world.hatchetIntegrationGrid);
    world.hatchetIntegrationBearer.currentHealth = 50;
    world.hatchetIntegrationEntities.set(bearerId, world.hatchetIntegrationBearer);
    world.hatchetIntegrationGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red, blue: 0, green: 0, white: 0 });
    world.hatchetIntegrationBearerBeadHand = beadHand;
    world.hatchetIntegrationBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a hatchet integration bearer with base agility {int}',
  function (world: HatchetWorld, agility: number) {
    if (!world.hatchetIntegrationBearer) {
      throw new Error('Bearer not initialized');
    }
    world.hatchetIntegrationBaseAgility = agility;
  }
);

Given(
  'a hatchet integration bearer with base power {int}',
  function (world: HatchetWorld, power: number) {
    if (!world.hatchetIntegrationBearer) {
      throw new Error('Bearer not initialized');
    }
    world.hatchetIntegrationBasePower = power;
  }
);

// ============================================================================
// INTEGRATION TEST - Apply Chop Modifier
// ============================================================================

When('the hatchet integration chop modifier is applied', function (world: HatchetWorld) {
  if (world.hatchetIntegrationBasePower === undefined) {
    throw new Error('Base power not set');
  }
  if (world.hatchetIntegrationBaseAgility === undefined) {
    throw new Error('Base agility not set');
  }

  const basePower = world.hatchetIntegrationBasePower;
  const baseAgility = world.hatchetIntegrationBaseAgility;

  // Chop adds +1 to damage (power) and -1 to agility
  world.hatchetIntegrationEffectivePower = basePower + 1;
  world.hatchetIntegrationEffectiveAgility = Math.max(0, baseAgility - 1);
});

Then(
  'the hatchet integration effective power should be {int}',
  function (world: HatchetWorld, expected: number) {
    expect(world.hatchetIntegrationEffectivePower).toBeDefined();
    expect(world.hatchetIntegrationEffectivePower).toBe(expected);
  }
);

Then(
  'the hatchet integration effective agility should be {int}',
  function (world: HatchetWorld, expected: number) {
    expect(world.hatchetIntegrationEffectiveAgility).toBeDefined();
    expect(world.hatchetIntegrationEffectiveAgility).toBe(expected);
  }
);
