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
import { RebukeEffect } from '@src/effects/RebukeEffect';

interface ShieldWorld extends QuickPickleWorld {
  // Unit test
  shieldTestGrid?: BattleGrid;
  shieldTestEntities?: Map<string, Entity>;
  shieldTestBeadHands?: Map<string, PlayerBeadSystem>;
  shieldTestGameContext?: GameContext;
  shieldTestBearer?: Entity;
  shieldTestBearerBeadHand?: PlayerBeadSystem;
  shieldTestRebukeResult?: EffectResult;
  shieldTestRebukeCost?: { redBeads: number };
  shieldTestEquipment?: {
    slot: string;
    category: string;
    passiveGuard: number;
    modifiers: string[];
    inventorySlots: number;
  };

  // Integration test
  shieldIntegrationGrid?: BattleGrid;
  shieldIntegrationEntities?: Map<string, Entity>;
  shieldIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  shieldIntegrationGameContext?: GameContext;
  shieldIntegrationBearer?: Entity;
  shieldIntegrationBearerBeadHand?: PlayerBeadSystem;
  shieldIntegrationRebukeResult?: EffectResult;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a shield test grid of {int}x{int}',
  function (world: ShieldWorld, width: number, height: number) {
    world.shieldTestGrid = new BattleGrid(width, height);
  }
);

Given('a shield test game context with the grid', function (world: ShieldWorld) {
  if (!world.shieldTestGrid) {
    world.shieldTestGrid = new BattleGrid(12, 12);
  }
  if (!world.shieldTestEntities) {
    world.shieldTestEntities = new Map();
  }
  if (!world.shieldTestBeadHands) {
    world.shieldTestBeadHands = new Map();
  }

  world.shieldTestGameContext = {
    grid: world.shieldTestGrid,
    actorId: 'shield-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.shieldTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.shieldTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a shield test bearer at position {int},{int} with bead hand having {int} red and {int} guard',
  function (world: ShieldWorld, x: number, y: number, red: number, guardValue: number) {
    if (!world.shieldTestGrid) {
      world.shieldTestGrid = new BattleGrid(12, 12);
    }
    if (!world.shieldTestEntities) {
      world.shieldTestEntities = new Map();
    }
    if (!world.shieldTestBeadHands) {
      world.shieldTestBeadHands = new Map();
    }

    const bearerId = 'shield-test-bearer';
    world.shieldTestBearer = new Entity(bearerId, 50, world.shieldTestGrid);
    world.shieldTestBearer.currentHealth = 50;
    world.shieldTestBearer.setGuard(guardValue);
    world.shieldTestEntities.set(bearerId, world.shieldTestBearer);
    world.shieldTestGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red, blue: 0, green: 0, white: 0 });
    world.shieldTestBearerBeadHand = beadHand;
    world.shieldTestBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a shield test attacker {string} at position {int},{int} with {int} power',
  function (world: ShieldWorld, attackerName: string, x: number, y: number, _power: number) {
    if (!world.shieldTestGrid) {
      world.shieldTestGrid = new BattleGrid(12, 12);
    }
    if (!world.shieldTestEntities) {
      world.shieldTestEntities = new Map();
    }

    const attacker = new Entity(attackerName, 30, world.shieldTestGrid);
    attacker.currentHealth = 30;
    world.shieldTestEntities.set(attackerName, attacker);
    world.shieldTestGrid.register(attackerName, x, y);
  }
);

Given(
  'a shield test attacker {string} at position {int},{int} with {int} power and {int} health',
  function (
    world: ShieldWorld,
    attackerName: string,
    x: number,
    y: number,
    _power: number,
    health: number
  ) {
    if (!world.shieldTestGrid) {
      world.shieldTestGrid = new BattleGrid(12, 12);
    }
    if (!world.shieldTestEntities) {
      world.shieldTestEntities = new Map();
    }

    const attacker = new Entity(attackerName, health, world.shieldTestGrid);
    attacker.currentHealth = health;
    world.shieldTestEntities.set(attackerName, attacker);
    world.shieldTestGrid.register(attackerName, x, y);
  }
);

Given(
  'a shield test obstacle at position {int},{int}',
  function (world: ShieldWorld, x: number, y: number) {
    if (!world.shieldTestGrid) {
      world.shieldTestGrid = new BattleGrid(12, 12);
    }
    const obstacleId = `obstacle-${x}-${y}`;
    const obstacle = new Entity(obstacleId, 999, world.shieldTestGrid);
    world.shieldTestEntities?.set(obstacleId, obstacle);
    world.shieldTestGrid.register(obstacleId, x, y);
  }
);

// ============================================================================
// UNIT TEST - Rebuke Effect Execution
// ============================================================================

When(
  'the shield test rebuke is triggered for {string} with guard {int} and power {int}',
  function (world: ShieldWorld, attackerId: string, guardTotal: number, power: number) {
    if (!world.shieldTestGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new RebukeEffect();
    world.shieldTestRebukeResult = effect.execute(
      world.shieldTestGameContext,
      { targetId: attackerId, guardTotal, power },
      {},
      new Map()
    );
  }
);

// ============================================================================
// UNIT TEST - Assertions: Rebuke Result
// ============================================================================

Then('the shield test rebuke result should be successful', function (world: ShieldWorld) {
  expect(world.shieldTestRebukeResult).toBeDefined();
  expect(world.shieldTestRebukeResult?.success).toBe(true);
});

Then('the shield test rebuke result should have failed', function (world: ShieldWorld) {
  expect(world.shieldTestRebukeResult).toBeDefined();
  expect(world.shieldTestRebukeResult?.success).toBe(false);
});

Then(
  'the shield test rebuke push distance should be {int}',
  function (world: ShieldWorld, expected: number) {
    expect(world.shieldTestRebukeResult).toBeDefined();
    expect(world.shieldTestRebukeResult?.data?.pushDistance).toBe(expected);
  }
);

Then(
  'the shield test attacker {string} should be at position {int},{int}',
  function (world: ShieldWorld, attackerId: string, x: number, y: number) {
    const pos = world.shieldTestGrid?.getPosition(attackerId);
    expect(pos).toBeDefined();
    expect(pos?.x).toBe(x);
    expect(pos?.y).toBe(y);
  }
);

Then(
  'the shield test attacker {string} should have {int} health',
  function (world: ShieldWorld, attackerId: string, expectedHealth: number) {
    const attacker = world.shieldTestEntities?.get(attackerId);
    expect(attacker).toBeDefined();
    expect(attacker?.currentHealth).toBe(expectedHealth);
  }
);

// ============================================================================
// UNIT TEST - Cost from YAML
// ============================================================================

When('I check the shield test rebuke action cost from YAML', function (world: ShieldWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    actions?: Array<{ id: string; cost?: { beads?: { red?: number } } }>;
  };
  const action = data.actions?.find((a: { id: string }) => a.id === 'rebuke');

  if (!action) {
    throw new Error('rebuke action not found in YAML');
  }

  world.shieldTestRebukeCost = {
    redBeads: action.cost?.beads?.red ?? 0,
  };
});

Then(
  'the shield test rebuke cost should have {int} red bead',
  function (world: ShieldWorld, expected: number) {
    expect(world.shieldTestRebukeCost).toBeDefined();
    expect(world.shieldTestRebukeCost?.redBeads).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Equipment from YAML
// ============================================================================

When('I check the shield test equipment from YAML', function (world: ShieldWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      slot: string;
      category: string;
      inventorySlots: number;
      grantedModifiers?: string[];
      passiveStats?: { guard?: number };
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'shield');

  if (!equipment) {
    throw new Error('Shield equipment not found in YAML');
  }

  world.shieldTestEquipment = {
    slot: equipment.slot,
    category: equipment.category,
    passiveGuard: equipment.passiveStats?.guard ?? 0,
    modifiers: equipment.grantedModifiers ?? [],
    inventorySlots: equipment.inventorySlots ?? 0,
  };
});

Then(
  'the shield test equipment slot should be {string}',
  function (world: ShieldWorld, expected: string) {
    expect(world.shieldTestEquipment).toBeDefined();
    expect(world.shieldTestEquipment?.slot).toBe(expected);
  }
);

Then(
  'the shield test equipment category should be {string}',
  function (world: ShieldWorld, expected: string) {
    expect(world.shieldTestEquipment).toBeDefined();
    expect(world.shieldTestEquipment?.category).toBe(expected);
  }
);

Then(
  'the shield test equipment passiveGuard should be {int}',
  function (world: ShieldWorld, expected: number) {
    expect(world.shieldTestEquipment).toBeDefined();
    expect(world.shieldTestEquipment?.passiveGuard).toBe(expected);
  }
);

Then(
  'the shield test equipment should have modifier {string}',
  function (world: ShieldWorld, modifierName: string) {
    expect(world.shieldTestEquipment).toBeDefined();
    expect(world.shieldTestEquipment?.modifiers).toContain(modifierName);
  }
);

Then(
  'the shield test equipment inventorySlots should be {int}',
  function (world: ShieldWorld, expected: number) {
    expect(world.shieldTestEquipment).toBeDefined();
    expect(world.shieldTestEquipment?.inventorySlots).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a shield integration grid of {int}x{int}',
  function (world: ShieldWorld, width: number, height: number) {
    world.shieldIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a shield integration game context with the grid', function (world: ShieldWorld) {
  if (!world.shieldIntegrationGrid) {
    world.shieldIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.shieldIntegrationEntities) {
    world.shieldIntegrationEntities = new Map();
  }
  if (!world.shieldIntegrationBeadHands) {
    world.shieldIntegrationBeadHands = new Map();
  }

  world.shieldIntegrationGameContext = {
    grid: world.shieldIntegrationGrid,
    actorId: 'shield-integration-bearer',
    getEntity(id: string): Entity | undefined {
      return world.shieldIntegrationEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.shieldIntegrationBeadHands?.get(entityId);
    },
  };
});

Given(
  'a shield integration bearer at position {int},{int} with bead hand having {int} red and {int} passive guard',
  function (world: ShieldWorld, x: number, y: number, red: number, passiveGuard: number) {
    if (!world.shieldIntegrationGrid) {
      world.shieldIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.shieldIntegrationEntities) {
      world.shieldIntegrationEntities = new Map();
    }
    if (!world.shieldIntegrationBeadHands) {
      world.shieldIntegrationBeadHands = new Map();
    }

    const bearerId = 'shield-integration-bearer';
    world.shieldIntegrationBearer = new Entity(bearerId, 50, world.shieldIntegrationGrid);
    world.shieldIntegrationBearer.currentHealth = 50;
    world.shieldIntegrationBearer.setGuard(passiveGuard);
    world.shieldIntegrationEntities.set(bearerId, world.shieldIntegrationBearer);
    world.shieldIntegrationGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red, blue: 0, green: 0, white: 0 });
    world.shieldIntegrationBearerBeadHand = beadHand;
    world.shieldIntegrationBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a shield integration attacker {string} at position {int},{int} with {int} power and {int} health',
  function (
    world: ShieldWorld,
    attackerName: string,
    x: number,
    y: number,
    _power: number,
    health: number
  ) {
    if (!world.shieldIntegrationGrid) {
      world.shieldIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.shieldIntegrationEntities) {
      world.shieldIntegrationEntities = new Map();
    }

    const attackerId = `shield-integration-${attackerName}`;
    const attacker = new Entity(attackerId, health, world.shieldIntegrationGrid);
    attacker.currentHealth = health;
    world.shieldIntegrationEntities.set(attackerId, attacker);
    world.shieldIntegrationGrid.register(attackerId, x, y);
  }
);

// ============================================================================
// INTEGRATION TEST - Block + Rebuke Flow
// ============================================================================

When(
  'the shield integration block is triggered granting {int} guard',
  function (world: ShieldWorld, guardGrant: number) {
    if (!world.shieldIntegrationBearer) {
      throw new Error('Bearer not initialized');
    }
    world.shieldIntegrationBearer.guard += guardGrant;
  }
);

When(
  'the shield integration rebuke is triggered for {string} with total guard and power {int}',
  function (world: ShieldWorld, attackerId: string, power: number) {
    if (!world.shieldIntegrationGameContext || !world.shieldIntegrationBearer) {
      throw new Error('Game context or bearer not initialized');
    }
    const guardTotal = world.shieldIntegrationBearer.guard;
    const effect = new RebukeEffect();
    world.shieldIntegrationRebukeResult = effect.execute(
      world.shieldIntegrationGameContext,
      { targetId: attackerId, guardTotal, power },
      {},
      new Map()
    );
  }
);

// ============================================================================
// INTEGRATION TEST - Assertions
// ============================================================================

Then(
  'the shield integration rebuke push distance should be {int}',
  function (world: ShieldWorld, expected: number) {
    expect(world.shieldIntegrationRebukeResult).toBeDefined();
    expect(world.shieldIntegrationRebukeResult?.data?.pushDistance).toBe(expected);
  }
);

Then(
  'the shield integration attacker {string} should be at position {int},{int}',
  function (world: ShieldWorld, attackerId: string, x: number, y: number) {
    const pos = world.shieldIntegrationGrid?.getPosition(attackerId);
    expect(pos).toBeDefined();
    expect(pos?.x).toBe(x);
    expect(pos?.y).toBe(y);
  }
);
