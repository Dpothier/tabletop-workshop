import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { Character } from '@src/entities/Character';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import type { EffectResult, GameContext } from '@src/types/Effect';
import { GreatGuardEffect } from '@src/effects/GreatGuardEffect';
import { ShieldWallEffect } from '@src/effects/ShieldWallEffect';

interface GreatShieldWorld extends QuickPickleWorld {
  // Unit test
  greatShieldTestGrid?: BattleGrid;
  greatShieldTestEntities?: Map<string, Entity>;
  greatShieldTestBeadHands?: Map<string, PlayerBeadSystem>;
  greatShieldTestGameContext?: GameContext;
  greatShieldTestBearer?: Entity;
  greatShieldTestBearerBeadHand?: PlayerBeadSystem;
  greatShieldTestGreatGuardResult?: EffectResult;
  greatShieldTestShieldWallResult?: EffectResult;
  greatShieldTestGreatGuardCost?: { redBeads: number };
  greatShieldTestShieldWallCost?: { redBeads: number };
  greatShieldTestEquipment?: { slot: string; category: string; passiveGuard: number };
  greatShieldTestBearerEquipment?: Array<{ tags?: string[] }>;

  // Integration test
  greatShieldIntegrationGrid?: BattleGrid;
  greatShieldIntegrationEntities?: Map<string, Entity>;
  greatShieldIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  greatShieldIntegrationGameContext?: GameContext;
  greatShieldIntegrationBearer?: Entity;
  greatShieldIntegrationBearerBeadHand?: PlayerBeadSystem;
  greatShieldIntegrationGreatGuardResult?: EffectResult;
  greatShieldIntegrationShieldWallResult?: EffectResult;
  greatShieldIntegrationBlockResult?: EffectResult;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a great shield test grid of {int}x{int}',
  function (world: GreatShieldWorld, width: number, height: number) {
    world.greatShieldTestGrid = new BattleGrid(width, height);
  }
);

Given('a great shield test game context with the grid', function (world: GreatShieldWorld) {
  if (!world.greatShieldTestGrid) {
    world.greatShieldTestGrid = new BattleGrid(12, 12);
  }
  if (!world.greatShieldTestEntities) {
    world.greatShieldTestEntities = new Map();
  }
  if (!world.greatShieldTestBeadHands) {
    world.greatShieldTestBeadHands = new Map();
  }

  world.greatShieldTestGameContext = {
    grid: world.greatShieldTestGrid,
    actorId: 'great-shield-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.greatShieldTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.greatShieldTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a great shield test bearer at position {int},{int} with bead hand having {int} red and {int} guard',
  function (world: GreatShieldWorld, x: number, y: number, red: number, guardValue: number) {
    if (!world.greatShieldTestGrid) {
      world.greatShieldTestGrid = new BattleGrid(12, 12);
    }
    if (!world.greatShieldTestEntities) {
      world.greatShieldTestEntities = new Map();
    }
    if (!world.greatShieldTestBeadHands) {
      world.greatShieldTestBeadHands = new Map();
    }

    const bearerId = 'great-shield-test-bearer';
    world.greatShieldTestBearer = new Entity(bearerId, 50, world.greatShieldTestGrid);
    world.greatShieldTestBearer.currentHealth = 50;
    world.greatShieldTestBearer.setGuard(guardValue);
    world.greatShieldTestEntities.set(bearerId, world.greatShieldTestBearer);
    world.greatShieldTestGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red, blue: 0, green: 0, white: 0 });
    world.greatShieldTestBearerBeadHand = beadHand;
    world.greatShieldTestBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a great shield test ally {string} at position {int},{int} with {int} guard',
  function (world: GreatShieldWorld, allyName: string, x: number, y: number, guardValue: number) {
    if (!world.greatShieldTestGrid) {
      world.greatShieldTestGrid = new BattleGrid(12, 12);
    }
    if (!world.greatShieldTestEntities) {
      world.greatShieldTestEntities = new Map();
    }
    if (!world.greatShieldTestBeadHands) {
      world.greatShieldTestBeadHands = new Map();
    }

    const ally = new Entity(allyName, 30, world.greatShieldTestGrid);
    ally.currentHealth = 30;
    ally.setGuard(guardValue);
    world.greatShieldTestEntities.set(allyName, ally);
    world.greatShieldTestGrid.register(allyName, x, y);
  }
);

Given('a great shield test bearer with great shield equipped', function (world: GreatShieldWorld) {
  if (!world.greatShieldTestGrid) {
    world.greatShieldTestGrid = new BattleGrid(12, 12);
  }
  const entityMap = new Map();
  const character = new Character(
    'great-shield-test-bearer',
    50,
    world.greatShieldTestGrid,
    entityMap
  );
  world.greatShieldTestGrid.register('great-shield-test-bearer', 5, 5);
  character.equip({
    id: 'great-shield',
    name: 'Great Shield',
    category: 'shield',
    slot: 'off-hand',
    power: 0,
    agility: 0,
    range: 0,
    penetration: 0,
    tags: ['shield', 'greatshield'],
    inventorySlots: 3,
    twoHanded: false,
    grantedModifiers: ['block', 'greatGuard', 'rebuke', 'shieldWall'],
    grantedActions: [],
    passiveStats: { guard: 1 },
    rangeBands: [],
    startsLoaded: false,
  });
  world.greatShieldTestBearerEquipment = [{ tags: ['shield', 'greatshield'] }];
  // Store the character for action check
  (world as any).greatShieldTestCharacter = character;
});

// ============================================================================
// UNIT TEST - Great Guard Effect Execution
// ============================================================================

When('the great shield test great guard is triggered', function (world: GreatShieldWorld) {
  if (!world.greatShieldTestGameContext) {
    throw new Error('Game context not initialized');
  }
  const effect = new GreatGuardEffect();
  world.greatShieldTestGreatGuardResult = effect.execute(
    world.greatShieldTestGameContext,
    { targetId: 'great-shield-test-bearer' },
    {},
    new Map()
  );
});

// ============================================================================
// UNIT TEST - Shield Wall Effect Execution
// ============================================================================

When(
  'the great shield test shield wall is triggered for {string}',
  function (world: GreatShieldWorld, allyId: string) {
    if (!world.greatShieldTestGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new ShieldWallEffect();
    world.greatShieldTestShieldWallResult = effect.execute(
      world.greatShieldTestGameContext,
      { targetId: allyId },
      {},
      new Map()
    );
  }
);

When('the great shield test shield wall is triggered for self', function (world: GreatShieldWorld) {
  if (!world.greatShieldTestGameContext) {
    throw new Error('Game context not initialized');
  }
  const effect = new ShieldWallEffect();
  world.greatShieldTestShieldWallResult = effect.execute(
    world.greatShieldTestGameContext,
    { targetId: 'great-shield-test-bearer' },
    {},
    new Map()
  );
});

// ============================================================================
// UNIT TEST - Assertions: Great Guard
// ============================================================================

Then(
  'the great shield test great guard result should be successful',
  function (world: GreatShieldWorld) {
    expect(world.greatShieldTestGreatGuardResult).toBeDefined();
    expect(world.greatShieldTestGreatGuardResult?.success).toBe(true);
  }
);

Then(
  'the great shield test bearer should have {int} guard',
  function (world: GreatShieldWorld, expected: number) {
    expect(world.greatShieldTestBearer).toBeDefined();
    expect(world.greatShieldTestBearer?.guard).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Assertions: Shield Wall
// ============================================================================

Then(
  'the great shield test shield wall result should be successful',
  function (world: GreatShieldWorld) {
    expect(world.greatShieldTestShieldWallResult).toBeDefined();
    expect(world.greatShieldTestShieldWallResult?.success).toBe(true);
  }
);

Then(
  'the great shield test shield wall result should have failed',
  function (world: GreatShieldWorld) {
    expect(world.greatShieldTestShieldWallResult).toBeDefined();
    expect(world.greatShieldTestShieldWallResult?.success).toBe(false);
  }
);

Then(
  'the great shield test ally {string} should have {int} guard',
  function (world: GreatShieldWorld, allyId: string, expected: number) {
    const ally = world.greatShieldTestEntities?.get(allyId);
    if (!ally) {
      throw new Error(`Ally ${allyId} not found`);
    }
    expect(ally.guard).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Attack Restriction
// ============================================================================

Then(
  'the great shield test bearer should not have {string} in available actions',
  function (world: GreatShieldWorld, actionId: string) {
    const character = (world as any).greatShieldTestCharacter as Character;
    expect(character).toBeDefined();
    const availableActions = character.getAvailableActionIds();
    expect(availableActions).not.toContain(actionId);
  }
);

// ============================================================================
// UNIT TEST - Cost from YAML
// ============================================================================

When(
  'I check the great shield test great guard action cost from YAML',
  function (world: GreatShieldWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      actions?: Array<{ id: string; cost?: { beads?: { red?: number } } }>;
    };
    const action = data.actions?.find((a: { id: string }) => a.id === 'greatGuard');

    if (!action) {
      throw new Error('greatGuard action not found in YAML');
    }

    world.greatShieldTestGreatGuardCost = {
      redBeads: action.cost?.beads?.red ?? 0,
    };
  }
);

Then(
  'the great shield test great guard cost should have {int} red bead',
  function (world: GreatShieldWorld, expected: number) {
    expect(world.greatShieldTestGreatGuardCost).toBeDefined();
    expect(world.greatShieldTestGreatGuardCost?.redBeads).toBe(expected);
  }
);

When(
  'I check the great shield test shield wall action cost from YAML',
  function (world: GreatShieldWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      actions?: Array<{ id: string; cost?: { beads?: { red?: number } } }>;
    };
    const action = data.actions?.find((a: { id: string }) => a.id === 'shieldWall');

    if (!action) {
      throw new Error('shieldWall action not found in YAML');
    }

    world.greatShieldTestShieldWallCost = {
      redBeads: action.cost?.beads?.red ?? 0,
    };
  }
);

Then(
  'the great shield test shield wall cost should have {int} red bead',
  function (world: GreatShieldWorld, expected: number) {
    expect(world.greatShieldTestShieldWallCost).toBeDefined();
    expect(world.greatShieldTestShieldWallCost?.redBeads).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Equipment from YAML
// ============================================================================

When('I check the great shield test equipment from YAML', function (world: GreatShieldWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as {
    equipment?: Array<{
      id: string;
      slot: string;
      category: string;
      passiveStats?: { guard?: number };
    }>;
  };
  const equipment = data.equipment?.find((e: { id: string }) => e.id === 'great-shield');

  if (!equipment) {
    throw new Error('Great Shield equipment not found in YAML');
  }

  world.greatShieldTestEquipment = {
    slot: equipment.slot,
    category: equipment.category,
    passiveGuard: equipment.passiveStats?.guard ?? 0,
  };
});

Then(
  'the great shield test equipment slot should be {string}',
  function (world: GreatShieldWorld, expected: string) {
    expect(world.greatShieldTestEquipment).toBeDefined();
    expect(world.greatShieldTestEquipment?.slot).toBe(expected);
  }
);

Then(
  'the great shield test equipment category should be {string}',
  function (world: GreatShieldWorld, expected: string) {
    expect(world.greatShieldTestEquipment).toBeDefined();
    expect(world.greatShieldTestEquipment?.category).toBe(expected);
  }
);

Then(
  'the great shield test equipment passiveGuard should be {int}',
  function (world: GreatShieldWorld, expected: number) {
    expect(world.greatShieldTestEquipment).toBeDefined();
    expect(world.greatShieldTestEquipment?.passiveGuard).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a great shield integration grid of {int}x{int}',
  function (world: GreatShieldWorld, width: number, height: number) {
    world.greatShieldIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a great shield integration game context with the grid', function (world: GreatShieldWorld) {
  if (!world.greatShieldIntegrationGrid) {
    world.greatShieldIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.greatShieldIntegrationEntities) {
    world.greatShieldIntegrationEntities = new Map();
  }
  if (!world.greatShieldIntegrationBeadHands) {
    world.greatShieldIntegrationBeadHands = new Map();
  }

  world.greatShieldIntegrationGameContext = {
    grid: world.greatShieldIntegrationGrid,
    actorId: 'great-shield-integration-bearer',
    getEntity(id: string): Entity | undefined {
      return world.greatShieldIntegrationEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.greatShieldIntegrationBeadHands?.get(entityId);
    },
  };
});

Given(
  'a great shield integration bearer at position {int},{int} with bead hand having {int} red',
  function (world: GreatShieldWorld, x: number, y: number, red: number) {
    if (!world.greatShieldIntegrationGrid) {
      world.greatShieldIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.greatShieldIntegrationEntities) {
      world.greatShieldIntegrationEntities = new Map();
    }
    if (!world.greatShieldIntegrationBeadHands) {
      world.greatShieldIntegrationBeadHands = new Map();
    }

    const bearerId = 'great-shield-integration-bearer';
    world.greatShieldIntegrationBearer = new Entity(bearerId, 50, world.greatShieldIntegrationGrid);
    world.greatShieldIntegrationBearer.currentHealth = 50;
    world.greatShieldIntegrationEntities.set(bearerId, world.greatShieldIntegrationBearer);
    world.greatShieldIntegrationGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red, blue: 0, green: 0, white: 0 });
    world.greatShieldIntegrationBearerBeadHand = beadHand;
    world.greatShieldIntegrationBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a great shield integration ally {string} at position {int},{int} with {int} guard',
  function (world: GreatShieldWorld, allyName: string, x: number, y: number, guardValue: number) {
    if (!world.greatShieldIntegrationGrid) {
      world.greatShieldIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.greatShieldIntegrationEntities) {
      world.greatShieldIntegrationEntities = new Map();
    }
    if (!world.greatShieldIntegrationBeadHands) {
      world.greatShieldIntegrationBeadHands = new Map();
    }

    const allyId = `great-shield-integration-${allyName}`;
    const ally = new Entity(allyId, 30, world.greatShieldIntegrationGrid);
    ally.currentHealth = 30;
    ally.setGuard(guardValue);
    world.greatShieldIntegrationEntities.set(allyId, ally);
    world.greatShieldIntegrationGrid.register(allyId, x, y);
  }
);

// ============================================================================
// INTEGRATION TEST - Shield Wall Execution
// ============================================================================

When(
  'the great shield integration shield wall is triggered for {string}',
  function (world: GreatShieldWorld, allyId: string) {
    if (!world.greatShieldIntegrationGameContext) {
      throw new Error('Game context not initialized');
    }
    const effect = new ShieldWallEffect();
    world.greatShieldIntegrationShieldWallResult = effect.execute(
      world.greatShieldIntegrationGameContext,
      { targetId: allyId },
      {},
      new Map()
    );
  }
);

// ============================================================================
// INTEGRATION TEST - Block + Great Guard Combined
// ============================================================================

When('the great shield integration block is triggered', function (world: GreatShieldWorld) {
  if (!world.greatShieldIntegrationGameContext || !world.greatShieldIntegrationBearer) {
    throw new Error('Game context or bearer not initialized');
  }
  // Block grants +1 Guard (standard shield action)
  world.greatShieldIntegrationBearer.guard += 1;
});

When('the great shield integration great guard is triggered', function (world: GreatShieldWorld) {
  if (!world.greatShieldIntegrationGameContext) {
    throw new Error('Game context not initialized');
  }
  const effect = new GreatGuardEffect();
  world.greatShieldIntegrationGreatGuardResult = effect.execute(
    world.greatShieldIntegrationGameContext,
    { targetId: 'great-shield-integration-bearer' },
    {},
    new Map()
  );
});

// ============================================================================
// INTEGRATION TEST - Assertions
// ============================================================================

Then(
  'the great shield integration shield wall result should be successful',
  function (world: GreatShieldWorld) {
    expect(world.greatShieldIntegrationShieldWallResult).toBeDefined();
    expect(world.greatShieldIntegrationShieldWallResult?.success).toBe(true);
  }
);

Then(
  'the great shield integration ally {string} should have {int} guard',
  function (world: GreatShieldWorld, allyId: string, expected: number) {
    const ally = world.greatShieldIntegrationEntities?.get(allyId);
    if (!ally) {
      throw new Error(`Ally ${allyId} not found`);
    }
    expect(ally.guard).toBe(expected);
  }
);

Then(
  'the great shield integration bearer should have {int} guard',
  function (world: GreatShieldWorld, expected: number) {
    expect(world.greatShieldIntegrationBearer).toBeDefined();
    expect(world.greatShieldIntegrationBearer?.guard).toBe(expected);
  }
);
