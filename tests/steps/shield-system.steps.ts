import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { BattleGrid } from '@src/state/BattleGrid';
import { Character } from '@src/entities/Character';
import { Entity } from '@src/entities/Entity';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import type { EffectResult, GameContext } from '@src/types/Effect';
import { BlockEffect } from '@src/effects/BlockEffect';
import { EquipmentLoader } from '@src/data/EquipmentLoader';

interface ShieldSystemWorld extends QuickPickleWorld {
  // Unit test
  shieldSystemTestGrid?: BattleGrid;
  shieldSystemTestEntities?: Map<string, Entity>;
  shieldSystemTestCharacters?: Map<string, Character>;
  shieldSystemTestBeadHands?: Map<string, PlayerBeadSystem>;
  shieldSystemTestGameContext?: GameContext;
  shieldSystemTestBearer?: Entity;
  shieldSystemTestBearerBeadHand?: PlayerBeadSystem;
  shieldSystemTestBlockResult?: EffectResult;
  shieldSystemTestBlockCost?: { anyColorBeads: number };
  shieldSystemTestShieldEquipment?: {
    grantedModifiers: string[];
  };
  shieldSystemTestBlockAvailable?: boolean;
  shieldSystemTestEquipError?: Error | null;
  shieldSystemTestCharacter?: Character;

  // Integration test
  shieldSystemIntegrationGrid?: BattleGrid;
  shieldSystemIntegrationEntities?: Map<string, Entity>;
  shieldSystemIntegrationBeadHands?: Map<string, PlayerBeadSystem>;
  shieldSystemIntegrationGameContext?: GameContext;
  shieldSystemIntegrationDefender?: Entity;
  shieldSystemIntegrationAttacker?: Entity;
  shieldSystemIntegrationBlockResult?: EffectResult;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a shield system test grid of {int}x{int}',
  function (world: ShieldSystemWorld, width: number, height: number) {
    world.shieldSystemTestGrid = new BattleGrid(width, height);
  }
);

Given('a shield system test game context with the grid', function (world: ShieldSystemWorld) {
  if (!world.shieldSystemTestGrid) {
    world.shieldSystemTestGrid = new BattleGrid(12, 12);
  }
  if (!world.shieldSystemTestEntities) {
    world.shieldSystemTestEntities = new Map();
  }
  if (!world.shieldSystemTestCharacters) {
    world.shieldSystemTestCharacters = new Map();
  }
  if (!world.shieldSystemTestBeadHands) {
    world.shieldSystemTestBeadHands = new Map();
  }

  world.shieldSystemTestGameContext = {
    grid: world.shieldSystemTestGrid,
    actorId: 'shield-system-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.shieldSystemTestEntities?.get(id);
    },
    getBeadHand(entityId: string) {
      return world.shieldSystemTestBeadHands?.get(entityId);
    },
  };
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a shield system test bearer at position {int},{int} with {int} guard',
  function (world: ShieldSystemWorld, x: number, y: number, guardValue: number) {
    if (!world.shieldSystemTestGrid) {
      world.shieldSystemTestGrid = new BattleGrid(12, 12);
    }
    if (!world.shieldSystemTestEntities) {
      world.shieldSystemTestEntities = new Map();
    }
    if (!world.shieldSystemTestBeadHands) {
      world.shieldSystemTestBeadHands = new Map();
    }

    const bearerId = 'shield-system-test-bearer';
    world.shieldSystemTestBearer = new Entity(bearerId, 50, world.shieldSystemTestGrid);
    world.shieldSystemTestBearer.currentHealth = 50;
    world.shieldSystemTestBearer.setGuard(guardValue);
    world.shieldSystemTestEntities.set(bearerId, world.shieldSystemTestBearer);
    world.shieldSystemTestGrid.register(bearerId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red: 0, blue: 0, green: 0, white: 0 });
    world.shieldSystemTestBearerBeadHand = beadHand;
    world.shieldSystemTestBeadHands.set(bearerId, beadHand);
  }
);

Given(
  'a shield system test character with shield equipped having passiveGuard {int}',
  function (world: ShieldSystemWorld, _passiveGuardValue: number) {
    if (!world.shieldSystemTestGrid) {
      world.shieldSystemTestGrid = new BattleGrid(12, 12);
    }
    if (!world.shieldSystemTestCharacters) {
      world.shieldSystemTestCharacters = new Map();
    }

    const charId = 'shield-system-test-character';
    world.shieldSystemTestCharacter = new Character(
      charId,
      50,
      world.shieldSystemTestGrid,
      new Map()
    );
    world.shieldSystemTestCharacter.currentHealth = 50;

    // Load shield equipment data from YAML
    const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const loader = new EquipmentLoader();
    const equipmentData = loader.loadFromYAML(content);
    const shieldDef = equipmentData.find((eq) => eq.id === 'shield');

    if (shieldDef) {
      world.shieldSystemTestCharacter.equip(shieldDef);
    }

    world.shieldSystemTestCharacters.set(charId, world.shieldSystemTestCharacter);
    world.shieldSystemTestGrid.register(charId, 5, 5);
  }
);

Given(
  'a shield system test character with two-handed weapon equipped',
  function (world: ShieldSystemWorld) {
    if (!world.shieldSystemTestGrid) {
      world.shieldSystemTestGrid = new BattleGrid(12, 12);
    }
    if (!world.shieldSystemTestCharacters) {
      world.shieldSystemTestCharacters = new Map();
    }

    const charId = 'shield-system-test-character';
    world.shieldSystemTestCharacter = new Character(
      charId,
      50,
      world.shieldSystemTestGrid,
      new Map()
    );
    world.shieldSystemTestCharacter.currentHealth = 50;

    // Load greatsword (two-handed) equipment from YAML
    const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const loader = new EquipmentLoader();
    const equipmentData = loader.loadFromYAML(content);
    const greatswordDef = equipmentData.find((eq) => eq.id === 'greatsword');

    if (greatswordDef) {
      world.shieldSystemTestCharacter.equip(greatswordDef);
    }

    world.shieldSystemTestCharacters.set(charId, world.shieldSystemTestCharacter);
    world.shieldSystemTestGrid.register(charId, 5, 5);
  }
);

Given('the shield system test bearer has no shield equipped', function (world: ShieldSystemWorld) {
  // Create a Character (not just Entity) to check equipment
  if (!world.shieldSystemTestGrid) {
    world.shieldSystemTestGrid = new BattleGrid(12, 12);
  }
  const charId = 'shield-system-test-bearer';
  world.shieldSystemTestCharacter = new Character(
    charId,
    50,
    world.shieldSystemTestGrid,
    new Map()
  );
  // No shield equipped — getEquipment('off-hand') will return undefined
});

// ============================================================================
// UNIT TEST - Block Effect Execution
// ============================================================================

When('the shield system test block is triggered', function (world: ShieldSystemWorld) {
  if (!world.shieldSystemTestGameContext || !world.shieldSystemTestBearer) {
    throw new Error('Game context or bearer not initialized');
  }
  const effect = new BlockEffect();
  world.shieldSystemTestBlockResult = effect.execute(
    world.shieldSystemTestGameContext,
    { targetId: 'shield-system-test-bearer' },
    {},
    new Map()
  );
});

// ============================================================================
// UNIT TEST - Block Cost from YAML
// ============================================================================

When(
  'I check the shield system test block action cost from YAML',
  function (world: ShieldSystemWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      actions?: Array<{ id: string; cost?: { beads?: { anyColor?: number } } }>;
    };
    const action = data.actions?.find((a: { id: string }) => a.id === 'block');

    if (!action) {
      throw new Error('block action not found in YAML');
    }

    world.shieldSystemTestBlockCost = {
      anyColorBeads: action.cost?.beads?.anyColor ?? 0,
    };
  }
);

// ============================================================================
// UNIT TEST - Block Availability
// ============================================================================

When('the shield system test block availability is checked', function (world: ShieldSystemWorld) {
  if (!world.shieldSystemTestCharacter) {
    throw new Error('Character not initialized');
  }

  // Check if bearer has shield with "block" modifier via real equipment check
  const offHand = world.shieldSystemTestCharacter.getEquipment('off-hand');
  world.shieldSystemTestBlockAvailable = offHand
    ? offHand.grantedModifiers.includes('block')
    : false;
});

// ============================================================================
// UNIT TEST - Equipment Equip with Two-Handed Check
// ============================================================================

When(
  'the shield system test character tries to equip a shield',
  function (world: ShieldSystemWorld) {
    if (!world.shieldSystemTestCharacter) {
      throw new Error('Character not initialized');
    }

    try {
      const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
      const content = fs.readFileSync(yamlPath, 'utf-8');
      const loader = new EquipmentLoader();
      const equipmentData = loader.loadFromYAML(content);
      const shieldDef = equipmentData.find((eq) => eq.id === 'shield');

      if (shieldDef) {
        world.shieldSystemTestCharacter.equip(shieldDef);
      }
      world.shieldSystemTestEquipError = null;
    } catch (error) {
      world.shieldSystemTestEquipError = error instanceof Error ? error : new Error(String(error));
    }
  }
);

// ============================================================================
// UNIT TEST - Shield Equipment from YAML
// ============================================================================

When(
  'I check the shield system test shield equipment from YAML',
  function (world: ShieldSystemWorld) {
    const yamlPath = path.resolve(process.cwd(), 'public/data/equipment/core.yaml');
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(content) as {
      equipment?: Array<{
        id: string;
        grantedModifiers?: string[];
      }>;
    };
    const equipment = data.equipment?.find((e: { id: string }) => e.id === 'shield');

    if (!equipment) {
      throw new Error('Shield equipment not found in YAML');
    }

    world.shieldSystemTestShieldEquipment = {
      grantedModifiers: equipment.grantedModifiers ?? [],
    };
  }
);

// ============================================================================
// UNIT TEST - Assertions
// ============================================================================

Then(
  'the shield system test block result should be successful',
  function (world: ShieldSystemWorld) {
    expect(world.shieldSystemTestBlockResult).toBeDefined();
    expect(world.shieldSystemTestBlockResult?.success).toBe(true);
  }
);

Then(
  'the shield system test bearer should have {int} guard',
  function (world: ShieldSystemWorld, expectedGuard: number) {
    expect(world.shieldSystemTestBearer).toBeDefined();
    expect(world.shieldSystemTestBearer!.guard).toBe(expectedGuard);
  }
);

Then(
  'the shield system test block cost should have {int} anyColor bead',
  function (world: ShieldSystemWorld, expected: number) {
    expect(world.shieldSystemTestBlockCost).toBeDefined();
    expect(world.shieldSystemTestBlockCost?.anyColorBeads).toBe(expected);
  }
);

Then('the shield system test block should not be available', function (world: ShieldSystemWorld) {
  expect(world.shieldSystemTestBlockAvailable).toBe(false);
});

Then(
  'the shield system test character defense guard should be {int}',
  function (world: ShieldSystemWorld, expectedGuard: number) {
    expect(world.shieldSystemTestCharacter).toBeDefined();
    expect(world.shieldSystemTestCharacter!.guard).toBe(expectedGuard);
  }
);

Then(
  'the shield system test equip should have thrown an error',
  function (world: ShieldSystemWorld) {
    expect(world.shieldSystemTestEquipError).toBeDefined();
    expect(world.shieldSystemTestEquipError?.message).toContain('Cannot equip off-hand');
  }
);

Then(
  'the shield system test shield should not have attack modifiers',
  function (world: ShieldSystemWorld) {
    expect(world.shieldSystemTestShieldEquipment).toBeDefined();
    const modifiers = world.shieldSystemTestShieldEquipment?.grantedModifiers ?? [];
    // Shield should not have strength or quickStrike modifiers
    const hasAttackModifiers = modifiers.includes('strength') || modifiers.includes('quickStrike');
    expect(hasAttackModifiers).toBe(false);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP
// ============================================================================

Given(
  'a shield system integration grid of {int}x{int}',
  function (world: ShieldSystemWorld, width: number, height: number) {
    world.shieldSystemIntegrationGrid = new BattleGrid(width, height);
  }
);

Given(
  'a shield system integration game context with the grid',
  function (world: ShieldSystemWorld) {
    if (!world.shieldSystemIntegrationGrid) {
      world.shieldSystemIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.shieldSystemIntegrationEntities) {
      world.shieldSystemIntegrationEntities = new Map();
    }
    if (!world.shieldSystemIntegrationBeadHands) {
      world.shieldSystemIntegrationBeadHands = new Map();
    }

    world.shieldSystemIntegrationGameContext = {
      grid: world.shieldSystemIntegrationGrid,
      actorId: 'shield-system-integration-defender',
      getEntity(id: string): Entity | undefined {
        return world.shieldSystemIntegrationEntities?.get(id);
      },
      getBeadHand(entityId: string) {
        return world.shieldSystemIntegrationBeadHands?.get(entityId);
      },
    };
  }
);

Given(
  'a shield system integration defender at position {int},{int} with {int} health and {int} guard',
  function (world: ShieldSystemWorld, x: number, y: number, health: number, guardValue: number) {
    if (!world.shieldSystemIntegrationGrid) {
      world.shieldSystemIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.shieldSystemIntegrationEntities) {
      world.shieldSystemIntegrationEntities = new Map();
    }
    if (!world.shieldSystemIntegrationBeadHands) {
      world.shieldSystemIntegrationBeadHands = new Map();
    }

    const defenderId = 'shield-system-integration-defender';
    world.shieldSystemIntegrationDefender = new Entity(
      defenderId,
      health,
      world.shieldSystemIntegrationGrid
    );
    world.shieldSystemIntegrationDefender.currentHealth = health;
    world.shieldSystemIntegrationDefender.setGuard(guardValue);
    world.shieldSystemIntegrationEntities.set(defenderId, world.shieldSystemIntegrationDefender);
    world.shieldSystemIntegrationGrid.register(defenderId, x, y);

    const beadHand = new PlayerBeadSystem();
    beadHand.setHand({ red: 0, blue: 0, green: 0, white: 0 });
    world.shieldSystemIntegrationBeadHands.set(defenderId, beadHand);
  }
);

Given(
  'a shield system integration attacker at position {int},{int} with {int} power and {int} health',
  function (world: ShieldSystemWorld, x: number, y: number, _power: number, health: number) {
    if (!world.shieldSystemIntegrationGrid) {
      world.shieldSystemIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.shieldSystemIntegrationEntities) {
      world.shieldSystemIntegrationEntities = new Map();
    }

    const attackerId = 'shield-system-integration-attacker';
    world.shieldSystemIntegrationAttacker = new Entity(
      attackerId,
      health,
      world.shieldSystemIntegrationGrid
    );
    world.shieldSystemIntegrationAttacker.currentHealth = health;
    world.shieldSystemIntegrationEntities.set(attackerId, world.shieldSystemIntegrationAttacker);
    world.shieldSystemIntegrationGrid.register(attackerId, x, y);
  }
);

// ============================================================================
// INTEGRATION TEST - Block Effect Execution
// ============================================================================

When('the shield system integration block is triggered', function (world: ShieldSystemWorld) {
  if (!world.shieldSystemIntegrationGameContext || !world.shieldSystemIntegrationDefender) {
    throw new Error('Game context or defender not initialized');
  }
  const effect = new BlockEffect();
  world.shieldSystemIntegrationBlockResult = effect.execute(
    world.shieldSystemIntegrationGameContext,
    { targetId: 'shield-system-integration-defender' },
    {},
    new Map()
  );
});

// ============================================================================
// INTEGRATION TEST - Assertions
// ============================================================================

Then(
  'the shield system integration defender should have {int} guard',
  function (world: ShieldSystemWorld, expectedGuard: number) {
    expect(world.shieldSystemIntegrationDefender).toBeDefined();
    expect(world.shieldSystemIntegrationDefender!.guard).toBe(expectedGuard);
  }
);

Then(
  'the shield system integration block result should be successful',
  function (world: ShieldSystemWorld) {
    expect(world.shieldSystemIntegrationBlockResult).toBeDefined();
    expect(world.shieldSystemIntegrationBlockResult?.success).toBe(true);
  }
);
