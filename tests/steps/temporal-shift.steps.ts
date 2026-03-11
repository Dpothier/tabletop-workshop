import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { ActionWheel } from '@src/systems/ActionWheel';
import type { EffectResult, GameContext } from '@src/types/Effect';
import { TemporalShiftEffect } from '@src/effects/TemporalShiftEffect';

interface TemporalWorld extends QuickPickleWorld {
  // Unit test context
  temporalTestGrid?: BattleGrid;
  temporalTestWheel?: ActionWheel;
  temporalTestEntities?: Map<string, Entity>;
  temporalTestGameContext?: GameContext;
  temporalTestCaster?: Entity;
  temporalTestEffect?: TemporalShiftEffect;
  temporalTestResult?: EffectResult;
  temporalTestCost?: { windup: number; blueBeads: number };
  temporalTestAllyAcceptance?: Map<string, boolean>;

  // Integration test context
  temporalIntegrationGrid?: BattleGrid;
  temporalIntegrationWheel?: ActionWheel;
  temporalIntegrationEntities?: Map<string, Entity>;
  temporalIntegrationGameContext?: GameContext;
  temporalIntegrationCaster?: Entity;
  temporalIntegrationAllyAcceptance?: Map<string, boolean>;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a temporal test grid of {int}x{int}',
  function (world: TemporalWorld, width: number, height: number) {
    world.temporalTestGrid = new BattleGrid(width, height);
  }
);

Given('a temporal test game context with the grid', function (world: TemporalWorld) {
  if (!world.temporalTestGrid) {
    world.temporalTestGrid = new BattleGrid(12, 12);
  }
  if (!world.temporalTestEntities) {
    world.temporalTestEntities = new Map();
  }
  if (!world.temporalTestWheel) {
    world.temporalTestWheel = new ActionWheel();
  }

  world.temporalTestGameContext = {
    grid: world.temporalTestGrid,
    actorId: 'temporal-test-caster',
    getEntity(id: string): Entity | undefined {
      return world.temporalTestEntities?.get(id);
    },
    getBeadHand(_entityId: string) {
      return undefined;
    },
    getWheel() {
      return world.temporalTestWheel;
    },
  } as GameContext;

  world.temporalTestEffect = new TemporalShiftEffect();
  world.temporalTestAllyAcceptance = new Map();
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a temporal test caster at position {int},{int} on wheel position {int}',
  function (world: TemporalWorld, x: number, y: number, wheelPos: number) {
    if (!world.temporalTestGrid) {
      world.temporalTestGrid = new BattleGrid(12, 12);
    }
    if (!world.temporalTestEntities) {
      world.temporalTestEntities = new Map();
    }
    if (!world.temporalTestWheel) {
      world.temporalTestWheel = new ActionWheel();
    }

    const casterId = 'temporal-test-caster';
    world.temporalTestCaster = new Entity(casterId, 50, world.temporalTestGrid);
    world.temporalTestCaster.currentHealth = 50;
    world.temporalTestEntities.set(casterId, world.temporalTestCaster);
    world.temporalTestGrid.register(casterId, x, y);
    world.temporalTestWheel.addEntity(casterId, wheelPos);
  }
);

Given(
  'a temporal test target {string} at grid position {int},{int} on wheel position {int} with {int} ward',
  function (
    world: TemporalWorld,
    name: string,
    gx: number,
    gy: number,
    wheelPos: number,
    ward: number
  ) {
    if (!world.temporalTestGrid) {
      world.temporalTestGrid = new BattleGrid(12, 12);
    }
    if (!world.temporalTestEntities) {
      world.temporalTestEntities = new Map();
    }
    if (!world.temporalTestWheel) {
      world.temporalTestWheel = new ActionWheel();
    }

    const entity = new Entity(name, 30, world.temporalTestGrid);
    entity.currentHealth = 30;
    entity.ward = ward;
    world.temporalTestEntities.set(name, entity);
    world.temporalTestGrid.register(name, gx, gy);
    world.temporalTestWheel.addEntity(name, wheelPos);
  }
);

Given(
  'a temporal test ally {string} at grid position {int},{int} on wheel position {int} accepting',
  function (world: TemporalWorld, name: string, gx: number, gy: number, wheelPos: number) {
    if (!world.temporalTestGrid) {
      world.temporalTestGrid = new BattleGrid(12, 12);
    }
    if (!world.temporalTestEntities) {
      world.temporalTestEntities = new Map();
    }
    if (!world.temporalTestWheel) {
      world.temporalTestWheel = new ActionWheel();
    }
    if (!world.temporalTestAllyAcceptance) {
      world.temporalTestAllyAcceptance = new Map();
    }

    const entity = new Entity(name, 30, world.temporalTestGrid);
    entity.currentHealth = 30;
    world.temporalTestEntities.set(name, entity);
    world.temporalTestGrid.register(name, gx, gy);
    world.temporalTestWheel.addEntity(name, wheelPos);
    world.temporalTestAllyAcceptance.set(name, true);
  }
);

// ============================================================================
// UNIT TEST - Effect Execution
// ============================================================================

When(
  'the temporal test effect is executed targeting {string} with direction {string}',
  function (world: TemporalWorld, targetId: string, direction: string) {
    if (!world.temporalTestEffect) {
      world.temporalTestEffect = new TemporalShiftEffect();
    }

    world.temporalTestResult = world.temporalTestEffect.execute(
      world.temporalTestGameContext!,
      { targetId, direction },
      { allyAcceptance: world.temporalTestAllyAcceptance },
      new Map()
    );
  }
);

When(
  'the temporal test effect is executed with aoe3x3 direction {string}',
  function (world: TemporalWorld, direction: string) {
    if (!world.temporalTestEffect) {
      world.temporalTestEffect = new TemporalShiftEffect();
    }

    world.temporalTestResult = world.temporalTestEffect.execute(
      world.temporalTestGameContext!,
      { direction },
      { aoe3x3: true, allyAcceptance: world.temporalTestAllyAcceptance },
      new Map()
    );
  }
);

When(
  'the temporal test effect is executed with aoe5x5 direction {string}',
  function (world: TemporalWorld, direction: string) {
    if (!world.temporalTestEffect) {
      world.temporalTestEffect = new TemporalShiftEffect();
    }

    world.temporalTestResult = world.temporalTestEffect.execute(
      world.temporalTestGameContext!,
      { direction },
      { aoe5x5: true, allyAcceptance: world.temporalTestAllyAcceptance },
      new Map()
    );
  }
);

When(
  'the temporal test effect is executed targeting {string} with direction {string} and intensity',
  function (world: TemporalWorld, targetId: string, direction: string) {
    if (!world.temporalTestEffect) {
      world.temporalTestEffect = new TemporalShiftEffect();
    }

    world.temporalTestResult = world.temporalTestEffect.execute(
      world.temporalTestGameContext!,
      { targetId, direction },
      { intensity: true, allyAcceptance: world.temporalTestAllyAcceptance },
      new Map()
    );
  }
);

// ============================================================================
// UNIT TEST - Wheel Position Assertions
// ============================================================================

Then(
  'the temporal test entity {string} should be at wheel position {int}',
  function (world: TemporalWorld, name: string, expectedPos: number) {
    const pos = world.temporalTestWheel!.getPosition(name);
    expect(pos).toBe(expectedPos);
  }
);

// ============================================================================
// UNIT TEST - Cost Verification
// ============================================================================

When('I check the temporal test action cost from YAML', function (world: TemporalWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { time?: number; beads?: { blue?: number } } }>;
  };
  const temporalAction = data.actions?.find((a: { id: string }) => a.id === 'temporal_shift');

  if (!temporalAction) {
    throw new Error('Temporal Shift action not found in YAML');
  }

  world.temporalTestCost = {
    windup: temporalAction.cost?.time ?? 2,
    blueBeads: temporalAction.cost?.beads?.blue ?? 1,
  };
});

Then(
  'the temporal test cost should have {int} windup',
  function (world: TemporalWorld, expectedWindup: number) {
    expect(world.temporalTestCost?.windup).toBe(expectedWindup);
  }
);

Then(
  'the temporal test cost should have {int} blue bead',
  function (world: TemporalWorld, expectedBeads: number) {
    expect(world.temporalTestCost?.blueBeads).toBe(expectedBeads);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a temporal integration grid of {int}x{int}',
  function (world: TemporalWorld, width: number, height: number) {
    world.temporalIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a temporal integration game context with the grid', function (world: TemporalWorld) {
  if (!world.temporalIntegrationGrid) {
    world.temporalIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.temporalIntegrationEntities) {
    world.temporalIntegrationEntities = new Map();
  }
  if (!world.temporalIntegrationWheel) {
    world.temporalIntegrationWheel = new ActionWheel();
  }

  world.temporalIntegrationGameContext = {
    grid: world.temporalIntegrationGrid,
    actorId: 'temporal-integration-caster',
    getEntity(id: string): Entity | undefined {
      return world.temporalIntegrationEntities?.get(id);
    },
    getBeadHand(_entityId: string) {
      return undefined;
    },
    getWheel() {
      return world.temporalIntegrationWheel;
    },
  } as GameContext;

  world.temporalIntegrationAllyAcceptance = new Map();
});

Given(
  'a temporal integration caster at position {int},{int} on wheel position {int}',
  function (world: TemporalWorld, x: number, y: number, wheelPos: number) {
    if (!world.temporalIntegrationGrid) {
      world.temporalIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.temporalIntegrationEntities) {
      world.temporalIntegrationEntities = new Map();
    }
    if (!world.temporalIntegrationWheel) {
      world.temporalIntegrationWheel = new ActionWheel();
    }

    const casterId = 'temporal-integration-caster';
    world.temporalIntegrationCaster = new Entity(casterId, 50, world.temporalIntegrationGrid);
    world.temporalIntegrationCaster.currentHealth = 50;
    world.temporalIntegrationEntities.set(casterId, world.temporalIntegrationCaster);
    world.temporalIntegrationGrid.register(casterId, x, y);
    world.temporalIntegrationWheel.addEntity(casterId, wheelPos);
  }
);

Given(
  'a temporal integration entity {string} at grid position {int},{int} on wheel position {int} with {int} ward',
  function (
    world: TemporalWorld,
    name: string,
    gx: number,
    gy: number,
    wheelPos: number,
    ward: number
  ) {
    if (!world.temporalIntegrationGrid) {
      world.temporalIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.temporalIntegrationEntities) {
      world.temporalIntegrationEntities = new Map();
    }
    if (!world.temporalIntegrationWheel) {
      world.temporalIntegrationWheel = new ActionWheel();
    }

    const entityId = `temporal-integration-${name}`;
    const entity = new Entity(entityId, 30, world.temporalIntegrationGrid);
    entity.currentHealth = 30;
    entity.ward = ward;
    world.temporalIntegrationEntities.set(entityId, entity);
    world.temporalIntegrationGrid.register(entityId, gx, gy);
    world.temporalIntegrationWheel.addEntity(entityId, wheelPos);
  }
);

Given(
  'a temporal integration entity {string} at grid position {int},{int} on wheel position {int} accepting',
  function (world: TemporalWorld, name: string, gx: number, gy: number, wheelPos: number) {
    if (!world.temporalIntegrationGrid) {
      world.temporalIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.temporalIntegrationEntities) {
      world.temporalIntegrationEntities = new Map();
    }
    if (!world.temporalIntegrationWheel) {
      world.temporalIntegrationWheel = new ActionWheel();
    }
    if (!world.temporalIntegrationAllyAcceptance) {
      world.temporalIntegrationAllyAcceptance = new Map();
    }

    const entityId = `temporal-integration-${name}`;
    const entity = new Entity(entityId, 30, world.temporalIntegrationGrid);
    entity.currentHealth = 30;
    world.temporalIntegrationEntities.set(entityId, entity);
    world.temporalIntegrationGrid.register(entityId, gx, gy);
    world.temporalIntegrationWheel.addEntity(entityId, wheelPos);
    world.temporalIntegrationAllyAcceptance.set(entityId, true);
  }
);

// ============================================================================
// INTEGRATION TEST - Spell Casting
// ============================================================================

When(
  'the temporal integration spell is cast with aoe3x3 direction {string}',
  function (world: TemporalWorld, direction: string) {
    const effect = new TemporalShiftEffect();
    world.temporalTestResult = effect.execute(
      world.temporalIntegrationGameContext!,
      { direction },
      { aoe3x3: true, allyAcceptance: world.temporalIntegrationAllyAcceptance },
      new Map()
    );
  }
);

// ============================================================================
// INTEGRATION TEST - Wheel Position Assertions
// ============================================================================

Then(
  'the temporal integration entity {string} should be at wheel position {int}',
  function (world: TemporalWorld, entityName: string, expectedPos: number) {
    const pos = world.temporalIntegrationWheel!.getPosition(entityName);
    expect(pos).toBe(expectedPos);
  }
);

Then(
  'the temporal integration caster should be at wheel position {int}',
  function (world: TemporalWorld, expectedPos: number) {
    const pos = world.temporalIntegrationWheel!.getPosition('temporal-integration-caster');
    expect(pos).toBe(expectedPos);
  }
);
