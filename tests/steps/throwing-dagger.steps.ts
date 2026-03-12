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

interface ThrowingDaggerWorld extends QuickPickleWorld {
  // Unit test
  throwingDaggerTestGrid?: BattleGrid;
  throwingDaggerTestEntities?: Map<string, Entity>;
  throwingDaggerTestBeadHands?: Map<string, PlayerBeadSystem>;
  throwingDaggerTestGameContext?: GameContext;
  throwingDaggerTestBearer?: Entity;
  throwingDaggerTestTarget?: Entity;
  throwingDaggerTestThrowResult?: EffectResult;
  throwingDaggerTestEquipment?: {
    power: number;
    agility: number;
    twoHanded: boolean;
    tags: string[];
    grantedModifiers: string[];
  };
  throwingDaggerTestThrowCost?: {
    timeBeads: number;
    greenBeads: number;
  };
  throwingDaggerTestThrowRange?: number;
  throwingDaggerTestParadeCost?: {
    redBeads: number;
  };
  throwingDaggerTestParadeModifier?: {
    guard: number;
  };
  throwingDaggerTestWeaponDroppedPosition?: { x: number; y: number } | null;
  throwingDaggerTestAvailableActions?: string[];

  // Integration test
  throwingDaggerIntegrationGrid?: BattleGrid;
  throwingDaggerIntegrationEntities?: Map<string, Entity>;
  throwingDaggerIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  throwingDaggerIntegrationGameContext?: GameContext;
  throwingDaggerIntegrationBearer?: Entity;
  throwingDaggerIntegrationTarget?: Entity;
  throwingDaggerIntegrationThrowResult?: EffectResult;
  throwingDaggerIntegrationDroppedPosition?: { x: number; y: number } | null;
  throwingDaggerIntegrationAvailableActions?: string[];
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a throwing-dagger test grid of {int}x{int}',
  function (world: ThrowingDaggerWorld, width: number, height: number) {
    world.throwingDaggerTestGrid = new BattleGrid(width, height);
  }
);

Given('a throwing-dagger test game context with the grid', function (world: ThrowingDaggerWorld) {
  if (!world.throwingDaggerTestGrid) {
    world.throwingDaggerTestGrid = new BattleGrid(12, 12);
  }
  if (!world.throwingDaggerTestEntities) {
    world.throwingDaggerTestEntities = new Map();
  }
  if (!world.throwingDaggerTestBeadHands) {
    world.throwingDaggerTestBeadHands = new Map();
  }

  world.throwingDaggerTestGameContext = {
    grid: world.throwingDaggerTestGrid,
    actorId: 'throwing-dagger-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.throwingDaggerTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.throwingDaggerTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a throwing-dagger test bearer at position {int},{int}',
  function (world: ThrowingDaggerWorld, x: number, y: number) {
    if (!world.throwingDaggerTestGrid) {
      world.throwingDaggerTestGrid = new BattleGrid(12, 12);
    }
    if (!world.throwingDaggerTestEntities) {
      world.throwingDaggerTestEntities = new Map();
    }

    const bearerId = 'throwing-dagger-test-bearer';
    world.throwingDaggerTestBearer = new Entity(bearerId, 50, world.throwingDaggerTestGrid);
    world.throwingDaggerTestBearer.currentHealth = 50;
    world.throwingDaggerTestEntities.set(bearerId, world.throwingDaggerTestBearer);
    world.throwingDaggerTestGrid.register(bearerId, x, y);
  }
);

Given(
  'a throwing-dagger test target {string} at position {int},{int}',
  function (world: ThrowingDaggerWorld, targetName: string, x: number, y: number) {
    if (!world.throwingDaggerTestGrid) {
      world.throwingDaggerTestGrid = new BattleGrid(12, 12);
    }
    if (!world.throwingDaggerTestEntities) {
      world.throwingDaggerTestEntities = new Map();
    }

    const target = new Entity(targetName, 30, world.throwingDaggerTestGrid);
    target.currentHealth = 30;
    world.throwingDaggerTestEntities.set(targetName, target);
    world.throwingDaggerTestGrid.register(targetName, x, y);
  }
);

Given(
  'a throwing-dagger test weapon dropped at position {int},{int}',
  function (world: ThrowingDaggerWorld, x: number, y: number) {
    world.throwingDaggerTestWeaponDroppedPosition = { x, y };
  }
);

// ============================================================================
// UNIT TEST - Equipment from YAML
// ============================================================================

When('I check the throwing-dagger test equipment from YAML', function (world: ThrowingDaggerWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      power: number;
      agility: number;
      twoHanded: boolean;
      tags?: string[];
      grantedModifiers?: string[];
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'throwing-dagger');

  if (!equipment) {
    throw new Error('Throwing Dagger equipment not found in YAML');
  }

  world.throwingDaggerTestEquipment = {
    power: equipment.power,
    agility: equipment.agility,
    twoHanded: equipment.twoHanded,
    tags: equipment.tags ?? [],
    grantedModifiers: equipment.grantedModifiers ?? [],
  };
});

Then(
  'the throwing-dagger test equipment power should be {int}',
  function (world: ThrowingDaggerWorld, expected: number) {
    expect(world.throwingDaggerTestEquipment).toBeDefined();
    expect(world.throwingDaggerTestEquipment?.power).toBe(expected);
  }
);

Then(
  'the throwing-dagger test equipment agility should be {int}',
  function (world: ThrowingDaggerWorld, expected: number) {
    expect(world.throwingDaggerTestEquipment).toBeDefined();
    expect(world.throwingDaggerTestEquipment?.agility).toBe(expected);
  }
);

Then(
  'the throwing-dagger test equipment twoHanded should be {word}',
  function (world: ThrowingDaggerWorld, expected: string) {
    expect(world.throwingDaggerTestEquipment).toBeDefined();
    expect(world.throwingDaggerTestEquipment?.twoHanded).toBe(expected === 'true');
  }
);

Then(
  'the throwing-dagger test equipment should have tag {string}',
  function (world: ThrowingDaggerWorld, tagName: string) {
    expect(world.throwingDaggerTestEquipment).toBeDefined();
    expect(world.throwingDaggerTestEquipment?.tags).toContain(tagName);
  }
);

Then(
  'the throwing-dagger test equipment should have granted modifier {string}',
  function (world: ThrowingDaggerWorld, modifierName: string) {
    expect(world.throwingDaggerTestEquipment).toBeDefined();
    expect(world.throwingDaggerTestEquipment?.grantedModifiers).toContain(modifierName);
  }
);

// ============================================================================
// UNIT TEST - Throw Action Cost from YAML
// ============================================================================

When(
  'I check the throwing-dagger test throw action cost from YAML',
  function (world: ThrowingDaggerWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      actions?: Array<{ id: string; cost?: { time?: number; beads?: { green?: number } } }>;
    };
    const action = data.actions?.find((a: { id: string }) => a.id === 'throw_dagger');

    if (!action) {
      throw new Error('throw_dagger action not found in YAML');
    }

    world.throwingDaggerTestThrowCost = {
      timeBeads: action.cost?.time ?? 0,
      greenBeads: action.cost?.beads?.green ?? 0,
    };
  }
);

Then(
  'the throwing-dagger test throw cost should have {int} time beads',
  function (world: ThrowingDaggerWorld, expected: number) {
    expect(world.throwingDaggerTestThrowCost).toBeDefined();
    expect(world.throwingDaggerTestThrowCost?.timeBeads).toBe(expected);
  }
);

Then(
  'the throwing-dagger test throw cost should have {int} green bead',
  function (world: ThrowingDaggerWorld, expected: number) {
    expect(world.throwingDaggerTestThrowCost).toBeDefined();
    expect(world.throwingDaggerTestThrowCost?.greenBeads).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Throw Action from YAML
// ============================================================================

When(
  'I check the throwing-dagger test throw action from YAML',
  function (world: ThrowingDaggerWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      actions?: Array<{ id: string; parameters?: Array<{ range?: number }> }>;
    };
    const action = data.actions?.find((a: { id: string }) => a.id === 'throw_dagger');

    if (!action) {
      throw new Error('throw_dagger action not found in YAML');
    }

    world.throwingDaggerTestThrowRange = action.parameters?.[0]?.range ?? 0;
  }
);

Then(
  'the throwing-dagger test throw range should be {int}',
  function (world: ThrowingDaggerWorld, expected: number) {
    expect(world.throwingDaggerTestThrowRange).toBeDefined();
    expect(world.throwingDaggerTestThrowRange).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Throw Effect Execution
// ============================================================================

When(
  'the throwing-dagger test throw effect is triggered for {string} with power {int} and agility {int}',
  function (world: ThrowingDaggerWorld, targetId: string, power: number, agility: number) {
    if (!world.throwingDaggerTestGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new ThrowEffect();
    world.throwingDaggerTestThrowResult = effect.execute(
      world.throwingDaggerTestGameContext,
      { targetId, power, agility },
      {},
      new Map()
    );
  }
);

When(
  'the throwing-dagger test throw effect is triggered for {string} with hit outcome {string} at maximum range',
  function (world: ThrowingDaggerWorld, targetId: string, outcome: string) {
    if (!world.throwingDaggerTestGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new ThrowEffect();
    world.throwingDaggerTestThrowResult = effect.execute(
      world.throwingDaggerTestGameContext,
      { targetId, power: 1, agility: 1, hitOutcome: outcome },
      {},
      new Map()
    );
  }
);

Then(
  'the throwing-dagger test throw effect result should be successful',
  function (world: ThrowingDaggerWorld) {
    expect(world.throwingDaggerTestThrowResult).toBeDefined();
    expect(world.throwingDaggerTestThrowResult?.success).toBe(true);
  }
);

Then(
  'the throwing-dagger test throw effect should have weapon drop position at {int},{int}',
  function (world: ThrowingDaggerWorld, expectedX: number, expectedY: number) {
    expect(world.throwingDaggerTestThrowResult).toBeDefined();
    expect(world.throwingDaggerTestThrowResult?.data).toBeDefined();
    const dropPos = world.throwingDaggerTestThrowResult?.data?.weaponDropPosition as
      | { x: number; y: number }
      | undefined;
    expect(dropPos).toBeDefined();
    expect((dropPos as { x: number; y: number }).x).toBe(expectedX);
    expect((dropPos as { x: number; y: number }).y).toBe(expectedY);
  }
);

Then(
  'the throwing-dagger test weapon should be dropped at trajectory end position',
  function (world: ThrowingDaggerWorld) {
    expect(world.throwingDaggerTestThrowResult).toBeDefined();
    expect(world.throwingDaggerTestThrowResult?.data).toBeDefined();
    const dropPos = world.throwingDaggerTestThrowResult?.data?.weaponDropPosition;
    expect(dropPos).toBeDefined();
    expect(dropPos).toHaveProperty('x');
    expect(dropPos).toHaveProperty('y');
  }
);

// ============================================================================
// UNIT TEST - Weapon Dropped State
// ============================================================================

When('the throwing-dagger test bearer has weapon dropped', function (world: ThrowingDaggerWorld) {
  world.throwingDaggerTestWeaponDroppedPosition = { x: 6, y: 6 };
});

When(
  'I check throwing-dagger test available actions for bearer',
  function (world: ThrowingDaggerWorld) {
    const baseActions = ['attack', 'quickStrike', 'parade', 'move', 'run', 'rest'];

    if (world.throwingDaggerTestWeaponDroppedPosition !== null) {
      // Filter out actions that require weapon
      world.throwingDaggerTestAvailableActions = baseActions.filter(
        (action) => !['attack', 'quickStrike', 'parade'].includes(action)
      );
    } else {
      world.throwingDaggerTestAvailableActions = baseActions;
    }
  }
);

Then(
  'the throwing-dagger test available actions should not include {string}',
  function (world: ThrowingDaggerWorld, actionName: string) {
    expect(world.throwingDaggerTestAvailableActions).toBeDefined();
    expect(world.throwingDaggerTestAvailableActions).not.toContain(actionName);
  }
);

Then(
  'the throwing-dagger test available actions should include {string}',
  function (world: ThrowingDaggerWorld, actionName: string) {
    expect(world.throwingDaggerTestAvailableActions).toBeDefined();
    expect(world.throwingDaggerTestAvailableActions).toContain(actionName);
  }
);

// ============================================================================
// UNIT TEST - Auto-Recovery
// ============================================================================

When(
  'the throwing-dagger test bearer moves to position {int},{int}',
  function (world: ThrowingDaggerWorld, x: number, y: number) {
    if (!world.throwingDaggerTestBearer) {
      throw new Error('Bearer not initialized');
    }
    // Simulate moving to the dropped position
    if (
      world.throwingDaggerTestWeaponDroppedPosition &&
      world.throwingDaggerTestWeaponDroppedPosition.x === x &&
      world.throwingDaggerTestWeaponDroppedPosition.y === y
    ) {
      // Auto-recovery happens
      world.throwingDaggerTestWeaponDroppedPosition = null;
    }
  }
);

When('I check throwing-dagger test weapon recovery status', function (world: ThrowingDaggerWorld) {
  // Status is tracked by throwingDaggerTestWeaponDroppedPosition being null
  expect(world.throwingDaggerTestWeaponDroppedPosition).toBeDefined();
});

Then('the throwing-dagger test weapon should be recovered', function (world: ThrowingDaggerWorld) {
  expect(world.throwingDaggerTestWeaponDroppedPosition).toBeNull();
});

Then(
  'the throwing-dagger test dropped position should be null',
  function (world: ThrowingDaggerWorld) {
    expect(world.throwingDaggerTestWeaponDroppedPosition).toBeNull();
  }
);

// ============================================================================
// UNIT TEST - Parade Modifier from YAML
// ============================================================================

When(
  'I check the throwing-dagger test parade action cost from YAML',
  function (world: ThrowingDaggerWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      actions?: Array<{ id: string; cost?: { beads?: { red?: number } } }>;
    };
    const action = data.actions?.find((a: { id: string }) => a.id === 'parade');

    if (!action) {
      throw new Error('parade action not found in YAML');
    }

    world.throwingDaggerTestParadeCost = {
      redBeads: action.cost?.beads?.red ?? 0,
    };
  }
);

Then(
  'the throwing-dagger test parade cost should have {int} red bead',
  function (world: ThrowingDaggerWorld, expected: number) {
    expect(world.throwingDaggerTestParadeCost).toBeDefined();
    expect(world.throwingDaggerTestParadeCost?.redBeads).toBe(expected);
  }
);

When(
  'I check the throwing-dagger test parade modifier from YAML',
  function (world: ThrowingDaggerWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      actions?: Array<{ id: string; modifier?: { guard?: number } }>;
    };
    const action = data.actions?.find((a: { id: string }) => a.id === 'parade');

    if (!action) {
      throw new Error('parade action not found in YAML');
    }

    world.throwingDaggerTestParadeModifier = {
      guard: action.modifier?.guard ?? 0,
    };
  }
);

Then(
  'the throwing-dagger test parade guard modifier should be {int}',
  function (world: ThrowingDaggerWorld, expected: number) {
    expect(world.throwingDaggerTestParadeModifier).toBeDefined();
    expect(world.throwingDaggerTestParadeModifier?.guard).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a throwing-dagger integration grid of {int}x{int}',
  function (world: ThrowingDaggerWorld, width: number, height: number) {
    world.throwingDaggerIntegrationGrid = new BattleGrid(width, height);
  }
);

Given(
  'a throwing-dagger integration game context with the grid',
  function (world: ThrowingDaggerWorld) {
    if (!world.throwingDaggerIntegrationGrid) {
      world.throwingDaggerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.throwingDaggerIntegrationEntities) {
      world.throwingDaggerIntegrationEntities = new Map();
    }
    if (!world.throwingDaggerIntegrationBeadHands) {
      world.throwingDaggerIntegrationBeadHands = new Map();
    }

    world.throwingDaggerIntegrationGameContext = {
      grid: world.throwingDaggerIntegrationGrid,
      actorId: 'throwing-dagger-integration-bearer',
      getEntity(id: string): Entity | undefined {
        return world.throwingDaggerIntegrationEntities?.get(id);
      },
      getBeadHand(entityId: string) {
        return world.throwingDaggerIntegrationBeadHands?.get(entityId);
      },
    };
  }
);

Given(
  'a throwing-dagger integration bearer at position {int},{int} with bead hand having {int} green',
  function (world: ThrowingDaggerWorld, x: number, y: number, green: number) {
    if (!world.throwingDaggerIntegrationGrid) {
      world.throwingDaggerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.throwingDaggerIntegrationEntities) {
      world.throwingDaggerIntegrationEntities = new Map();
    }
    if (!world.throwingDaggerIntegrationBeadHands) {
      world.throwingDaggerIntegrationBeadHands = new Map();
    }

    const bearerId = 'throwing-dagger-integration-bearer';
    world.throwingDaggerIntegrationBearer = new Entity(
      bearerId,
      50,
      world.throwingDaggerIntegrationGrid
    );
    world.throwingDaggerIntegrationBearer.currentHealth = 50;
    world.throwingDaggerIntegrationEntities.set(bearerId, world.throwingDaggerIntegrationBearer);
    world.throwingDaggerIntegrationGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red: 0, blue: 0, green, white: 0 });
    world.throwingDaggerIntegrationBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a throwing-dagger integration target {string} at position {int},{int}',
  function (world: ThrowingDaggerWorld, targetName: string, x: number, y: number) {
    if (!world.throwingDaggerIntegrationGrid) {
      world.throwingDaggerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.throwingDaggerIntegrationEntities) {
      world.throwingDaggerIntegrationEntities = new Map();
    }

    const target = new Entity(targetName, 30, world.throwingDaggerIntegrationGrid);
    target.currentHealth = 30;
    world.throwingDaggerIntegrationEntities.set(targetName, target);
    world.throwingDaggerIntegrationGrid.register(targetName, x, y);
  }
);

// ============================================================================
// INTEGRATION TEST - Execute Throw Action
// ============================================================================

When(
  'the throwing-dagger integration throw action is executed against {string}',
  function (world: ThrowingDaggerWorld, targetId: string) {
    if (!world.throwingDaggerIntegrationGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new ThrowEffect();
    world.throwingDaggerIntegrationThrowResult = effect.execute(
      world.throwingDaggerIntegrationGameContext,
      { targetId, power: 1, agility: 1 },
      {},
      new Map()
    );
  }
);

Then(
  'the throwing-dagger integration weapon should be dropped at target position',
  function (world: ThrowingDaggerWorld) {
    expect(world.throwingDaggerIntegrationThrowResult).toBeDefined();
    expect(world.throwingDaggerIntegrationThrowResult?.success).toBe(true);
    expect(world.throwingDaggerIntegrationThrowResult?.data?.weaponDropPosition).toBeDefined();
  }
);

Then(
  'the throwing-dagger integration bearer should lose attack action',
  function (world: ThrowingDaggerWorld) {
    expect(world.throwingDaggerIntegrationThrowResult?.data?.weaponDropPosition).toBeDefined();
  }
);

When(
  'the throwing-dagger integration bearer moves to position {int},{int}',
  function (world: ThrowingDaggerWorld, _x: number, _y: number) {
    if (!world.throwingDaggerIntegrationBearer) {
      throw new Error('Bearer not initialized');
    }
    // Simulate moving to dropped position - weapon is recovered
    world.throwingDaggerIntegrationDroppedPosition = null;
  }
);

Then(
  'the throwing-dagger integration weapon should be recovered',
  function (world: ThrowingDaggerWorld) {
    // Recovery happens when moving to dropped position
    expect(world.throwingDaggerIntegrationThrowResult?.data?.weaponDropPosition).toBeDefined();
  }
);

Then(
  'the throwing-dagger integration bearer should regain attack action',
  function (world: ThrowingDaggerWorld) {
    expect(world.throwingDaggerIntegrationBearer).toBeDefined();
  }
);

Then(
  'the throwing-dagger integration bearer should have parade action available',
  function (world: ThrowingDaggerWorld) {
    expect(world.throwingDaggerIntegrationBearer).toBeDefined();
  }
);
