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
import { LacerateEffect } from '@src/effects/LacerateEffect';

interface EndOfRoundDamage {
  entityId: string;
  type: string;
  damage: number;
  consumed: boolean;
}

interface SlicingDaggerWorld extends QuickPickleWorld {
  // Unit test
  slicingDaggerTestGrid?: BattleGrid;
  slicingDaggerTestEntities?: Map<string, Entity>;
  slicingDaggerTestBeadHands?: Map<string, PlayerBeadSystem>;
  slicingDaggerTestGameContext?: GameContext;
  slicingDaggerTestBearer?: Entity;
  slicingDaggerTestTarget?: Entity;
  slicingDaggerTestLacerateResult?: EffectResult;
  slicingDaggerTestEquipment?: {
    power: number;
    agility: number;
    twoHanded: boolean;
    grantedModifiers: string[];
  };
  slicingDaggerTestSlashModifier?: {
    agility: number;
  };
  slicingDaggerTestLacerateCost?: {
    greenBeads: number;
  };
  slicingDaggerTestSlashCost?: {
    redBeads: number;
  };
  slicingDaggerTestBleedApplied?: boolean;
  slicingDaggerTestEndOfRoundResults?: EndOfRoundDamage[];

  // Integration test
  slicingDaggerIntegrationGrid?: BattleGrid;
  slicingDaggerIntegrationEntities?: Map<string, Entity>;
  slicingDaggerIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  slicingDaggerIntegrationGameContext?: GameContext;
  slicingDaggerIntegrationBearer?: Entity;
  slicingDaggerIntegrationTarget?: Entity;
  slicingDaggerIntegrationLacerateResult?: EffectResult;
  slicingDaggerIntegrationEndOfRoundResults?: EndOfRoundDamage[];
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a slicing-dagger test grid of {int}x{int}',
  function (world: SlicingDaggerWorld, width: number, height: number) {
    world.slicingDaggerTestGrid = new BattleGrid(width, height);
  }
);

Given('a slicing-dagger test game context with the grid', function (world: SlicingDaggerWorld) {
  if (!world.slicingDaggerTestGrid) {
    world.slicingDaggerTestGrid = new BattleGrid(12, 12);
  }
  if (!world.slicingDaggerTestEntities) {
    world.slicingDaggerTestEntities = new Map();
  }
  if (!world.slicingDaggerTestBeadHands) {
    world.slicingDaggerTestBeadHands = new Map();
  }

  world.slicingDaggerTestGameContext = {
    grid: world.slicingDaggerTestGrid,
    actorId: 'slicing-dagger-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.slicingDaggerTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.slicingDaggerTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a slicing-dagger test bearer at position {int},{int}',
  function (world: SlicingDaggerWorld, x: number, y: number) {
    if (!world.slicingDaggerTestGrid) {
      world.slicingDaggerTestGrid = new BattleGrid(12, 12);
    }
    if (!world.slicingDaggerTestEntities) {
      world.slicingDaggerTestEntities = new Map();
    }

    const bearerId = 'slicing-dagger-test-bearer';
    world.slicingDaggerTestBearer = new Entity(bearerId, 50, world.slicingDaggerTestGrid);
    world.slicingDaggerTestBearer.currentHealth = 50;
    world.slicingDaggerTestEntities.set(bearerId, world.slicingDaggerTestBearer);
    world.slicingDaggerTestGrid.register(bearerId, x, y);
  }
);

Given(
  'a slicing-dagger test target {string} at position {int},{int}',
  function (world: SlicingDaggerWorld, targetName: string, x: number, y: number) {
    if (!world.slicingDaggerTestGrid) {
      world.slicingDaggerTestGrid = new BattleGrid(12, 12);
    }
    if (!world.slicingDaggerTestEntities) {
      world.slicingDaggerTestEntities = new Map();
    }

    const target = new Entity(targetName, 30, world.slicingDaggerTestGrid);
    target.currentHealth = 30;
    world.slicingDaggerTestTarget = target;
    world.slicingDaggerTestEntities.set(targetName, target);
    world.slicingDaggerTestGrid.register(targetName, x, y);
  }
);

Given(
  'a slicing-dagger test entity {string} at position {int},{int} with {int} health',
  function (world: SlicingDaggerWorld, entityId: string, x: number, y: number, health: number) {
    if (!world.slicingDaggerTestGrid) {
      world.slicingDaggerTestGrid = new BattleGrid(12, 12);
    }
    if (!world.slicingDaggerTestEntities) {
      world.slicingDaggerTestEntities = new Map();
    }

    const entity = new Entity(entityId, health, world.slicingDaggerTestGrid);
    entity.currentHealth = health;
    world.slicingDaggerTestEntities.set(entityId, entity);
    world.slicingDaggerTestGrid.register(entityId, x, y);
  }
);

// ============================================================================
// UNIT TEST - Equipment from YAML
// ============================================================================

When('I check the slicing-dagger test equipment from YAML', function (world: SlicingDaggerWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      power: number;
      agility: number;
      twoHanded: boolean;
      grantedModifiers?: string[];
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'slicing-dagger');

  if (!equipment) {
    throw new Error('Slicing Dagger equipment not found in YAML');
  }

  world.slicingDaggerTestEquipment = {
    power: equipment.power,
    agility: equipment.agility,
    twoHanded: equipment.twoHanded,
    grantedModifiers: equipment.grantedModifiers ?? [],
  };
});

Then(
  'the slicing-dagger test equipment power should be {int}',
  function (world: SlicingDaggerWorld, expected: number) {
    expect(world.slicingDaggerTestEquipment).toBeDefined();
    expect(world.slicingDaggerTestEquipment?.power).toBe(expected);
  }
);

Then(
  'the slicing-dagger test equipment agility should be {int}',
  function (world: SlicingDaggerWorld, expected: number) {
    expect(world.slicingDaggerTestEquipment).toBeDefined();
    expect(world.slicingDaggerTestEquipment?.agility).toBe(expected);
  }
);

Then(
  'the slicing-dagger test equipment twoHanded should be {word}',
  function (world: SlicingDaggerWorld, expected: string) {
    expect(world.slicingDaggerTestEquipment).toBeDefined();
    expect(world.slicingDaggerTestEquipment?.twoHanded).toBe(expected === 'true');
  }
);

Then(
  'the slicing-dagger test equipment should have granted modifier {string}',
  function (world: SlicingDaggerWorld, modifierName: string) {
    expect(world.slicingDaggerTestEquipment).toBeDefined();
    expect(world.slicingDaggerTestEquipment?.grantedModifiers).toContain(modifierName);
  }
);

// ============================================================================
// UNIT TEST - Slash Modifier from YAML
// ============================================================================

When(
  'I check the slicing-dagger test slash modifier from YAML',
  function (world: SlicingDaggerWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      actions?: Array<{ id: string; modifier?: { agility?: number } }>;
    };
    const action = data.actions?.find((a: { id: string }) => a.id === 'slash');

    if (!action) {
      throw new Error('slash action not found in YAML');
    }

    world.slicingDaggerTestSlashModifier = {
      agility: action.modifier?.agility ?? 0,
    };
  }
);

Then(
  'the slicing-dagger test slash agility modifier should be {int}',
  function (world: SlicingDaggerWorld, expected: number) {
    expect(world.slicingDaggerTestSlashModifier).toBeDefined();
    expect(world.slicingDaggerTestSlashModifier?.agility).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Lacerate Action Cost from YAML
// ============================================================================

When(
  'I check the slicing-dagger test lacerate action cost from YAML',
  function (world: SlicingDaggerWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      actions?: Array<{ id: string; cost?: { beads?: { green?: number } } }>;
    };
    const action = data.actions?.find((a: { id: string }) => a.id === 'lacerate');

    if (!action) {
      throw new Error('lacerate action not found in YAML');
    }

    world.slicingDaggerTestLacerateCost = {
      greenBeads: action.cost?.beads?.green ?? 0,
    };
  }
);

Then(
  'the slicing-dagger test lacerate cost should have {int} green bead',
  function (world: SlicingDaggerWorld, expected: number) {
    expect(world.slicingDaggerTestLacerateCost).toBeDefined();
    expect(world.slicingDaggerTestLacerateCost?.greenBeads).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Slash Action Cost from YAML
// ============================================================================

When(
  'I check the slicing-dagger test slash action cost from YAML',
  function (world: SlicingDaggerWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      actions?: Array<{ id: string; cost?: { beads?: { red?: number } } }>;
    };
    const action = data.actions?.find((a: { id: string }) => a.id === 'slash');

    if (!action) {
      throw new Error('slash action not found in YAML');
    }

    world.slicingDaggerTestSlashCost = {
      redBeads: action.cost?.beads?.red ?? 0,
    };
  }
);

Then(
  'the slicing-dagger test slash cost should have {int} red bead',
  function (world: SlicingDaggerWorld, expected: number) {
    expect(world.slicingDaggerTestSlashCost).toBeDefined();
    expect(world.slicingDaggerTestSlashCost?.redBeads).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Lacerate Effect Execution
// ============================================================================

When(
  'the slicing-dagger test lacerate effect is triggered for {string} with hit outcome {string}',
  function (world: SlicingDaggerWorld, targetId: string, hitOutcome: string) {
    if (!world.slicingDaggerTestGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new LacerateEffect();
    world.slicingDaggerTestLacerateResult = effect.execute(
      world.slicingDaggerTestGameContext,
      { targetId, hitOutcome },
      {},
      new Map()
    );
  }
);

Then('the slicing-dagger test bleed should be applied', function (world: SlicingDaggerWorld) {
  expect(world.slicingDaggerTestLacerateResult).toBeDefined();
  expect(world.slicingDaggerTestLacerateResult?.success).toBe(true);
  expect(world.slicingDaggerTestLacerateResult?.data).toBeDefined();
  const bleedApplied = (world.slicingDaggerTestLacerateResult?.data as { bleedApplied?: boolean })
    ?.bleedApplied;
  expect(bleedApplied).toBe(true);
});

Then('the slicing-dagger test bleed should not be applied', function (world: SlicingDaggerWorld) {
  expect(world.slicingDaggerTestLacerateResult).toBeDefined();
  expect(world.slicingDaggerTestLacerateResult?.success).toBe(true);
  expect(world.slicingDaggerTestLacerateResult?.data).toBeDefined();
  const bleedApplied = (world.slicingDaggerTestLacerateResult?.data as { bleedApplied?: boolean })
    ?.bleedApplied;
  expect(bleedApplied).toBe(false);
});

Then(
  'the slicing-dagger test target should have {int} bleed stack',
  function (world: SlicingDaggerWorld, expected: number) {
    expect(world.slicingDaggerTestTarget).toBeDefined();
    const stacks = world.slicingDaggerTestTarget!.getStacks('bleed');
    expect(stacks).toBe(expected);
  }
);

Then(
  'the slicing-dagger test target should have {int} bleed stacks',
  function (world: SlicingDaggerWorld, expected: number) {
    expect(world.slicingDaggerTestTarget).toBeDefined();
    const stacks = world.slicingDaggerTestTarget!.getStacks('bleed');
    expect(stacks).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Bleed Status Effect Resolution
// ============================================================================

When(
  'entity {string} has {int} bleed stack applied',
  function (world: SlicingDaggerWorld, entityId: string, stacks: number) {
    const entity = world.slicingDaggerTestEntities!.get(entityId)!;
    entity.addStacks('bleed', stacks);
  }
);

When(
  'entity {string} has {int} bleed stacks applied',
  function (world: SlicingDaggerWorld, entityId: string, stacks: number) {
    const entity = world.slicingDaggerTestEntities!.get(entityId)!;
    entity.addStacks('bleed', stacks);
  }
);

When('end of round is resolved for slicing-dagger test', function (world: SlicingDaggerWorld) {
  const allEntities = Array.from(world.slicingDaggerTestEntities!.values());
  const results: EndOfRoundDamage[] = [];
  for (const entity of allEntities) {
    const stacks = entity.getStacks('bleed');
    if (stacks > 0) {
      const actualDamage = Math.min(stacks, entity.currentHealth);
      entity.receiveDamage(stacks);
      entity.clearStacks('bleed');
      results.push({ entityId: entity.id, type: 'bleed', damage: actualDamage, consumed: true });
    }
  }
  world.slicingDaggerTestEndOfRoundResults = results;
});

Then(
  'the slicing-dagger test end-of-round results should show {int} damage to {string}',
  function (world: SlicingDaggerWorld, expectedDamage: number, entityId: string) {
    const result = world.slicingDaggerTestEndOfRoundResults!.find((r) => r.entityId === entityId);
    expect(result).toBeDefined();
    expect(result!.damage).toBe(expectedDamage);
    expect(result!.consumed).toBe(true);
  }
);

Then(
  'the slicing-dagger test target should have {int} health',
  function (world: SlicingDaggerWorld, expected: number) {
    expect(world.slicingDaggerTestTarget).toBeDefined();
    expect(world.slicingDaggerTestTarget!.currentHealth).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a slicing-dagger integration grid of {int}x{int}',
  function (world: SlicingDaggerWorld, width: number, height: number) {
    world.slicingDaggerIntegrationGrid = new BattleGrid(width, height);
  }
);

Given(
  'a slicing-dagger integration game context with the grid',
  function (world: SlicingDaggerWorld) {
    if (!world.slicingDaggerIntegrationGrid) {
      world.slicingDaggerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.slicingDaggerIntegrationEntities) {
      world.slicingDaggerIntegrationEntities = new Map();
    }
    if (!world.slicingDaggerIntegrationBeadHands) {
      world.slicingDaggerIntegrationBeadHands = new Map();
    }

    world.slicingDaggerIntegrationGameContext = {
      grid: world.slicingDaggerIntegrationGrid,
      actorId: 'slicing-dagger-integration-bearer',
      getEntity(id: string): Entity | undefined {
        return world.slicingDaggerIntegrationEntities?.get(id);
      },
      getBeadHand(entityId: string) {
        return world.slicingDaggerIntegrationBeadHands?.get(entityId);
      },
    };
  }
);

Given(
  'a slicing-dagger integration bearer at position {int},{int}',
  function (world: SlicingDaggerWorld, x: number, y: number) {
    if (!world.slicingDaggerIntegrationGrid) {
      world.slicingDaggerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.slicingDaggerIntegrationEntities) {
      world.slicingDaggerIntegrationEntities = new Map();
    }

    const bearerId = 'slicing-dagger-integration-bearer';
    world.slicingDaggerIntegrationBearer = new Entity(
      bearerId,
      50,
      world.slicingDaggerIntegrationGrid
    );
    world.slicingDaggerIntegrationBearer.currentHealth = 50;
    world.slicingDaggerIntegrationEntities.set(bearerId, world.slicingDaggerIntegrationBearer);
    world.slicingDaggerIntegrationGrid.register(bearerId, x, y);
  }
);

Given(
  'a slicing-dagger integration target {string} at position {int},{int} with {int} health',
  function (world: SlicingDaggerWorld, targetName: string, x: number, y: number, health: number) {
    if (!world.slicingDaggerIntegrationGrid) {
      world.slicingDaggerIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.slicingDaggerIntegrationEntities) {
      world.slicingDaggerIntegrationEntities = new Map();
    }

    const target = new Entity(targetName, health, world.slicingDaggerIntegrationGrid);
    target.currentHealth = health;
    world.slicingDaggerIntegrationTarget = target;
    world.slicingDaggerIntegrationEntities.set(targetName, target);
    world.slicingDaggerIntegrationGrid.register(targetName, x, y);
  }
);

// ============================================================================
// INTEGRATION TEST - Lacerate Effect Execution
// ============================================================================

When(
  'the slicing-dagger integration lacerate effect is triggered for {string} with hit outcome {string}',
  function (world: SlicingDaggerWorld, targetId: string, hitOutcome: string) {
    if (!world.slicingDaggerIntegrationGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new LacerateEffect();
    world.slicingDaggerIntegrationLacerateResult = effect.execute(
      world.slicingDaggerIntegrationGameContext,
      { targetId, hitOutcome },
      {},
      new Map()
    );
  }
);

Then(
  'the slicing-dagger integration target should have {int} bleed stack',
  function (world: SlicingDaggerWorld, expected: number) {
    expect(world.slicingDaggerIntegrationTarget).toBeDefined();
    const stacks = world.slicingDaggerIntegrationTarget!.getStacks('bleed');
    expect(stacks).toBe(expected);
  }
);

Then(
  'the slicing-dagger integration target should have {int} bleed stacks',
  function (world: SlicingDaggerWorld, expected: number) {
    expect(world.slicingDaggerIntegrationTarget).toBeDefined();
    const stacks = world.slicingDaggerIntegrationTarget!.getStacks('bleed');
    expect(stacks).toBe(expected);
  }
);

Then(
  'the slicing-dagger integration target should have {int} health',
  function (world: SlicingDaggerWorld, expected: number) {
    expect(world.slicingDaggerIntegrationTarget).toBeDefined();
    expect(world.slicingDaggerIntegrationTarget!.currentHealth).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST - End of Round Resolution
// ============================================================================

When(
  'end of round is resolved for slicing-dagger integration',
  function (world: SlicingDaggerWorld) {
    const allEntities = Array.from(world.slicingDaggerIntegrationEntities!.values());
    const results: EndOfRoundDamage[] = [];
    for (const entity of allEntities) {
      const stacks = entity.getStacks('bleed');
      if (stacks > 0) {
        const actualDamage = Math.min(stacks, entity.currentHealth);
        entity.receiveDamage(stacks);
        entity.clearStacks('bleed');
        results.push({ entityId: entity.id, type: 'bleed', damage: actualDamage, consumed: true });
      }
    }
    world.slicingDaggerIntegrationEndOfRoundResults = results;
  }
);

Then(
  'the slicing-dagger integration end-of-round results should show {int} damage to {string}',
  function (world: SlicingDaggerWorld, expectedDamage: number, entityId: string) {
    const result = world.slicingDaggerIntegrationEndOfRoundResults!.find(
      (r) => r.entityId === entityId
    );
    expect(result).toBeDefined();
    expect(result!.damage).toBe(expectedDamage);
    expect(result!.consumed).toBe(true);
  }
);
