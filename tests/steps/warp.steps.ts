import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import type { EffectResult, GameContext } from '@src/types/Effect';
import { WarpEffect } from '@src/effects/WarpEffect';

interface WarpWorld extends QuickPickleWorld {
  // Unit test context
  warpTestGrid?: BattleGrid;
  warpTestEntities?: Map<string, Entity>;
  warpTestGameContext?: GameContext;
  warpTestCaster?: Entity;
  warpTestEffect?: WarpEffect;
  warpTestResult?: EffectResult;

  // Integration test context
  warpIntegrationGrid?: BattleGrid;
  warpIntegrationEntities?: Map<string, Entity>;
  warpIntegrationGameContext?: GameContext;
  warpIntegrationCaster?: Entity;

  // General tracking
  warpTestCost?: { windup: number; blueBeads: number };
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a warp test grid of {int}x{int}',
  function (world: WarpWorld, width: number, height: number) {
    world.warpTestGrid = new BattleGrid(width, height);
  }
);

Given('a warp test game context with the grid', function (world: WarpWorld) {
  if (!world.warpTestGrid) {
    world.warpTestGrid = new BattleGrid(12, 12);
  }
  if (!world.warpTestEntities) {
    world.warpTestEntities = new Map();
  }

  world.warpTestGameContext = {
    grid: world.warpTestGrid,
    actorId: 'warp-test-caster',
    getEntity(id: string): Entity | undefined {
      return world.warpTestEntities?.get(id);
    },
    getBeadHand(_entityId: string) {
      return undefined;
    },
  };

  world.warpTestEffect = new WarpEffect();
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a warp test caster at position {int},{int}',
  function (world: WarpWorld, x: number, y: number) {
    if (!world.warpTestGrid) {
      world.warpTestGrid = new BattleGrid(12, 12);
    }
    if (!world.warpTestEntities) {
      world.warpTestEntities = new Map();
    }

    const casterId = 'warp-test-caster';
    world.warpTestCaster = new Entity(casterId, 50, world.warpTestGrid);
    world.warpTestCaster.currentHealth = 50;
    world.warpTestEntities.set(casterId, world.warpTestCaster);
    world.warpTestGrid.register(casterId, x, y);
  }
);

Given(
  'a warp test entity {string} at position {int},{int}',
  function (world: WarpWorld, entityName: string, x: number, y: number) {
    if (!world.warpTestGrid) {
      world.warpTestGrid = new BattleGrid(12, 12);
    }
    if (!world.warpTestEntities) {
      world.warpTestEntities = new Map();
    }

    const entity = new Entity(entityName, 30, world.warpTestGrid);
    entity.currentHealth = 30;
    world.warpTestEntities.set(entityName, entity);
    world.warpTestGrid.register(entityName, x, y);
  }
);

Given(
  'a warp test enemy {string} at position {int},{int} with {int} ward',
  function (world: WarpWorld, enemyName: string, x: number, y: number, ward: number) {
    if (!world.warpTestGrid) {
      world.warpTestGrid = new BattleGrid(12, 12);
    }
    if (!world.warpTestEntities) {
      world.warpTestEntities = new Map();
    }

    const enemy = new Entity(enemyName, 30, world.warpTestGrid);
    enemy.currentHealth = 30;
    enemy.ward = ward;
    world.warpTestEntities.set(enemyName, enemy);
    world.warpTestGrid.register(enemyName, x, y);
  }
);

Given(
  'a warp test obstacle at position {int},{int}',
  function (world: WarpWorld, x: number, y: number) {
    if (!world.warpTestGrid) {
      world.warpTestGrid = new BattleGrid(12, 12);
    }
    // Mark position as occupied by registering a dummy entity
    const obstacleId = `warp-test-obstacle-${x}-${y}`;
    world.warpTestGrid.register(obstacleId, x, y);
  }
);

// ============================================================================
// UNIT TEST - Effect Execution
// ============================================================================

When(
  'the warp test effect is executed with destination {int},{int}',
  function (world: WarpWorld, destX: number, destY: number) {
    if (!world.warpTestEffect) {
      world.warpTestEffect = new WarpEffect();
    }

    world.warpTestResult = world.warpTestEffect.execute(
      world.warpTestGameContext!,
      { destination: { x: destX, y: destY } },
      {},
      new Map()
    );
  }
);

When(
  'the warp test effect is executed with swap targeting {string}',
  function (world: WarpWorld, targetId: string) {
    if (!world.warpTestEffect) {
      world.warpTestEffect = new WarpEffect();
    }

    world.warpTestResult = world.warpTestEffect.execute(
      world.warpTestGameContext!,
      { targetId },
      { swap: true },
      new Map()
    );
  }
);

When(
  'the warp test effect is executed with other targeting {string} to destination {int},{int}',
  function (world: WarpWorld, targetId: string, destX: number, destY: number) {
    if (!world.warpTestEffect) {
      world.warpTestEffect = new WarpEffect();
    }

    world.warpTestResult = world.warpTestEffect.execute(
      world.warpTestGameContext!,
      { targetId, destination: { x: destX, y: destY } },
      { other: true },
      new Map()
    );
  }
);

When(
  'the warp test effect is executed with other and extendedSelection targeting {string} to destination {int},{int}',
  function (world: WarpWorld, targetId: string, destX: number, destY: number) {
    if (!world.warpTestEffect) {
      world.warpTestEffect = new WarpEffect();
    }

    world.warpTestResult = world.warpTestEffect.execute(
      world.warpTestGameContext!,
      { targetId, destination: { x: destX, y: destY } },
      { other: true, extendedSelection: true },
      new Map()
    );
  }
);

When(
  'the warp test effect is executed with extendedRange to destination {int},{int}',
  function (world: WarpWorld, destX: number, destY: number) {
    if (!world.warpTestEffect) {
      world.warpTestEffect = new WarpEffect();
    }

    world.warpTestResult = world.warpTestEffect.execute(
      world.warpTestGameContext!,
      { destination: { x: destX, y: destY } },
      { extendedRange: true },
      new Map()
    );
  }
);

When(
  'the warp test effect is executed with swap and extendedRange targeting {string}',
  function (world: WarpWorld, targetId: string) {
    if (!world.warpTestEffect) {
      world.warpTestEffect = new WarpEffect();
    }

    world.warpTestResult = world.warpTestEffect.execute(
      world.warpTestGameContext!,
      { targetId },
      { swap: true, extendedRange: true },
      new Map()
    );
  }
);

// ============================================================================
// UNIT TEST - Position Assertions
// ============================================================================

Then(
  'the warp test caster should be at position {int},{int}',
  function (world: WarpWorld, expectedX: number, expectedY: number) {
    const position = world.warpTestGrid!.getPosition('warp-test-caster');
    expect(position).toBeDefined();
    expect(position?.x).toBe(expectedX);
    expect(position?.y).toBe(expectedY);
  }
);

Then(
  'the warp test entity {string} should be at position {int},{int}',
  function (world: WarpWorld, entityName: string, expectedX: number, expectedY: number) {
    const position = world.warpTestGrid!.getPosition(entityName);
    expect(position).toBeDefined();
    expect(position?.x).toBe(expectedX);
    expect(position?.y).toBe(expectedY);
  }
);

// ============================================================================
// UNIT TEST - Result Assertions
// ============================================================================

Then('the warp test result should have failed', function (world: WarpWorld) {
  expect(world.warpTestResult).toBeDefined();
  expect(world.warpTestResult?.success).toBe(false);
});

// ============================================================================
// UNIT TEST - Cost Verification
// ============================================================================

When('I check the warp test action cost from YAML', function (world: WarpWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { time?: number; beads?: { blue?: number } } }>;
  };
  const warpAction = data.actions?.find((a: { id: string }) => a.id === 'warp');

  if (!warpAction) {
    throw new Error('Warp action not found in YAML');
  }

  world.warpTestCost = {
    windup: warpAction.cost?.time ?? 2,
    blueBeads: warpAction.cost?.beads?.blue ?? 1,
  };
});

Then(
  'the warp test cost should have {int} windup',
  function (world: WarpWorld, expectedWindup: number) {
    expect(world.warpTestCost?.windup).toBe(expectedWindup);
  }
);

Then(
  'the warp test cost should have {int} blue bead',
  function (world: WarpWorld, expectedBeads: number) {
    expect(world.warpTestCost?.blueBeads).toBe(expectedBeads);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a warp integration grid of {int}x{int}',
  function (world: WarpWorld, width: number, height: number) {
    world.warpIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a warp integration game context with the grid', function (world: WarpWorld) {
  if (!world.warpIntegrationGrid) {
    world.warpIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.warpIntegrationEntities) {
    world.warpIntegrationEntities = new Map();
  }

  world.warpIntegrationGameContext = {
    grid: world.warpIntegrationGrid,
    actorId: 'warp-integration-caster',
    getEntity(id: string): Entity | undefined {
      return world.warpIntegrationEntities?.get(id);
    },
    getBeadHand(_entityId: string) {
      return undefined;
    },
  };
});

Given(
  'a warp integration caster at position {int},{int}',
  function (world: WarpWorld, x: number, y: number) {
    if (!world.warpIntegrationGrid) {
      world.warpIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.warpIntegrationEntities) {
      world.warpIntegrationEntities = new Map();
    }

    const casterId = 'warp-integration-caster';
    world.warpIntegrationCaster = new Entity(casterId, 50, world.warpIntegrationGrid);
    world.warpIntegrationCaster.currentHealth = 50;
    world.warpIntegrationEntities.set(casterId, world.warpIntegrationCaster);
    world.warpIntegrationGrid.register(casterId, x, y);
  }
);

Given(
  'a warp integration ally at position {int},{int}',
  function (world: WarpWorld, x: number, y: number) {
    if (!world.warpIntegrationGrid) {
      world.warpIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.warpIntegrationEntities) {
      world.warpIntegrationEntities = new Map();
    }

    const allyId = 'warp-integration-ally';
    const ally = new Entity(allyId, 30, world.warpIntegrationGrid);
    ally.currentHealth = 30;
    world.warpIntegrationEntities.set(allyId, ally);
    world.warpIntegrationGrid.register(allyId, x, y);
  }
);

Given(
  'a warp integration entity {string} at position {int},{int}',
  function (world: WarpWorld, name: string, x: number, y: number) {
    if (!world.warpIntegrationGrid) {
      world.warpIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.warpIntegrationEntities) {
      world.warpIntegrationEntities = new Map();
    }

    const entityId = `warp-integration-${name}`;
    const entity = new Entity(entityId, 30, world.warpIntegrationGrid);
    entity.currentHealth = 30;
    world.warpIntegrationEntities.set(entityId, entity);
    world.warpIntegrationGrid.register(entityId, x, y);
  }
);

// ============================================================================
// INTEGRATION TEST - Spell Casting
// ============================================================================

When(
  'the warp integration spell is cast with other and extendedSelection targeting {string} to destination {int},{int}',
  function (world: WarpWorld, targetId: string, destX: number, destY: number) {
    const effect = new WarpEffect();
    world.warpTestResult = effect.execute(
      world.warpIntegrationGameContext!,
      { targetId, destination: { x: destX, y: destY } },
      { other: true, extendedSelection: true },
      new Map()
    );
  }
);

When(
  'the warp integration spell is cast with swap and other targeting {string} with swap target at {int},{int}',
  function (world: WarpWorld, targetId: string, destX: number, destY: number) {
    const effect = new WarpEffect();
    world.warpTestResult = effect.execute(
      world.warpIntegrationGameContext!,
      { targetId, destination: { x: destX, y: destY } },
      { swap: true, other: true },
      new Map()
    );
  }
);

// ============================================================================
// INTEGRATION TEST - Position Assertions
// ============================================================================

Then(
  'the warp integration entity {string} should be at position {int},{int}',
  function (world: WarpWorld, entityName: string, expectedX: number, expectedY: number) {
    const position = world.warpIntegrationGrid!.getPosition(entityName);
    expect(position).toBeDefined();
    expect(position?.x).toBe(expectedX);
    expect(position?.y).toBe(expectedY);
  }
);

Then(
  'the warp integration caster should be at position {int},{int}',
  function (world: WarpWorld, expectedX: number, expectedY: number) {
    const position = world.warpIntegrationGrid!.getPosition('warp-integration-caster');
    expect(position).toBeDefined();
    expect(position?.x).toBe(expectedX);
    expect(position?.y).toBe(expectedY);
  }
);
