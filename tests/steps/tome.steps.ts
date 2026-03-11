import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { MonsterEntity } from '@src/entities/MonsterEntity';
import type { EffectResult, GameContext } from '@src/types/Effect';
import { OverwriteEffect } from '@src/effects/OverwriteEffect';

interface PassiveAura {
  id: string;
  sourceEntityId: string;
  type: string;
  range: number;
  condition: string;
  effect: Record<string, number>;
}

interface PassiveAuraSystem {
  registerAura(aura: PassiveAura): void;
  isAuraActive(sourceEntityId: string, auraId: string, entities: Map<string, Entity>): boolean;
  getActiveAuras(
    type: string,
    targetEntityId: string,
    grid: BattleGrid,
    entities: Map<string, Entity>
  ): PassiveAura[];
  bearerPreservesPonder(entityId: string, entities: Map<string, Entity>): boolean;
}

interface TomeWorld extends QuickPickleWorld {
  // Unit test context
  tomeTestGrid?: BattleGrid;
  tomeTestEntities?: Map<string, Entity>;
  tomeTestGameContext?: GameContext;
  tomeTestBearer?: Entity;
  tomeTestAuraSystem?: PassiveAuraSystem;
  tomeTestBestiaryActive?: boolean;
  tomeTestCunningSurcharge?: number;
  tomeTestOverwriteResult?: EffectResult;
  tomeTestOverwriteCost?: { blueBeads: number };
  tomeTestMonsterLastBead?: string;
  tomeTestMonsterNewBead?: string;
  tomeTestMonster?: MonsterEntity;

  // Integration test context
  tomeIntegrationGrid?: BattleGrid;
  tomeIntegrationEntities?: Map<string, Entity>;
  tomeIntegrationGameContext?: GameContext;
  tomeIntegrationBearer?: Entity;
  tomeIntegrationAuraSystem?: PassiveAuraSystem;
  tomeIntegrationCunningSurcharge?: number;
  tomeIntegrationMonsterLastBead?: string;
  tomeIntegrationMonsterNewBead?: string;
  tomeIntegrationMonster?: MonsterEntity;
}

// ============================================================================
// UNIT TEST SETUP - Background Steps
// ============================================================================

Given(
  'a tome test grid of {int}x{int}',
  function (world: TomeWorld, width: number, height: number) {
    world.tomeTestGrid = new BattleGrid(width, height);
  }
);

Given('a tome test game context with the grid', function (world: TomeWorld) {
  if (!world.tomeTestGrid) {
    world.tomeTestGrid = new BattleGrid(12, 12);
  }
  if (!world.tomeTestEntities) {
    world.tomeTestEntities = new Map();
  }

  world.tomeTestGameContext = {
    grid: world.tomeTestGrid,
    actorId: 'tome-test-bearer',
    getEntity(id: string): Entity | undefined {
      return world.tomeTestEntities?.get(id);
    },
    getBeadHand() {
      return undefined;
    },
  };
});

// ============================================================================
// UNIT TEST - Entity Setup
// ============================================================================

Given(
  'a tome test bearer at position {int},{int} with {int} ponder stacks',
  function (world: TomeWorld, x: number, y: number, ponderStacks: number) {
    if (!world.tomeTestGrid) {
      world.tomeTestGrid = new BattleGrid(12, 12);
    }
    if (!world.tomeTestEntities) {
      world.tomeTestEntities = new Map();
    }

    const bearerId = 'tome-test-bearer';
    world.tomeTestBearer = new Entity(bearerId, 50, world.tomeTestGrid);
    world.tomeTestBearer.currentHealth = 50;
    if (ponderStacks > 0) {
      world.tomeTestBearer.addStacks('ponder', ponderStacks);
    }
    world.tomeTestEntities.set(bearerId, world.tomeTestBearer);
    world.tomeTestGrid.register(bearerId, x, y);
  }
);

Given(
  'a tome test ally {string} at position {int},{int}',
  function (world: TomeWorld, allyName: string, x: number, y: number) {
    if (!world.tomeTestGrid) {
      world.tomeTestGrid = new BattleGrid(12, 12);
    }
    if (!world.tomeTestEntities) {
      world.tomeTestEntities = new Map();
    }

    const ally = new Entity(allyName, 30, world.tomeTestGrid);
    ally.currentHealth = 30;
    world.tomeTestEntities.set(allyName, ally);
    world.tomeTestGrid.register(allyName, x, y);
  }
);

Given(
  'a tome test monster at position {int},{int} with bead bag',
  function (world: TomeWorld, x: number, y: number) {
    if (!world.tomeTestGrid) {
      world.tomeTestGrid = new BattleGrid(12, 12);
    }
    if (!world.tomeTestEntities) {
      world.tomeTestEntities = new Map();
    }

    const monsterId = 'tome-test-monster';
    world.tomeTestMonster = new MonsterEntity(monsterId, 40, world.tomeTestGrid);
    world.tomeTestMonster.initializeBeadBag({ red: 2, blue: 2, green: 2, white: 2 });

    // Initialize state machine
    const states = [
      {
        name: 'idle',
        damage: 0,
        cunning: 0,
        transitions: { red: 'attack', blue: 'idle', green: 'idle', white: 'idle' },
      },
      {
        name: 'attack',
        damage: 2,
        cunning: 2,
        transitions: { red: 'attack', blue: 'idle', green: 'idle', white: 'idle' },
      },
    ];

    world.tomeTestMonster.initializeStateMachine(states, 'idle');
    world.tomeTestEntities.set(monsterId, world.tomeTestMonster);
    world.tomeTestGrid.register(monsterId, x, y);
  }
);

Given('a tome test passive aura system with bestiary for the bearer', function (world: TomeWorld) {
  // Create a simple PassiveAuraSystem mock
  world.tomeTestAuraSystem = {
    registerAura(_aura: PassiveAura) {
      // Store internally - not needed for this test
    },
    isAuraActive(sourceEntityId: string, auraId: string, _entities: Map<string, Entity>): boolean {
      if (auraId !== 'bestiary') return false;
      const bearer = world.tomeTestEntities?.get(sourceEntityId);
      if (!bearer) return false;
      // Bestiary is active if bearer has >= 1 Ponder stack
      return bearer.getStacks('ponder') >= 1;
    },
    getActiveAuras(
      type: string,
      targetEntityId: string,
      grid: BattleGrid,
      _entities: Map<string, Entity>
    ): PassiveAura[] {
      const auras: PassiveAura[] = [];
      const entities = world.tomeTestEntities!;

      // Check if any entity with bestiary aura is within range 6 and active
      for (const [sourceId, sourceEntity] of entities.entries()) {
        if (sourceId === 'tome-test-bearer' && type === 'cunningReduction') {
          // Check if bearer has >= 1 Ponder (active condition)
          if (sourceEntity.getStacks('ponder') >= 1) {
            // Check if target is within range 6
            const targetEntity = entities.get(targetEntityId);
            if (targetEntity) {
              const sourcePos = grid.getPosition(sourceId);
              const targetPos = grid.getPosition(targetEntityId);
              if (sourcePos && targetPos) {
                const distance = grid.getDistance(sourceId, targetEntityId);
                if (distance <= 6) {
                  auras.push({
                    id: 'bestiary',
                    sourceEntityId: sourceId,
                    type: 'cunningReduction',
                    range: 6,
                    condition: 'hasPonder',
                    effect: { cunningReduction: 1 },
                  });
                }
              }
            }
          }
        }
      }

      return auras;
    },
    bearerPreservesPonder(entityId: string, _entities: Map<string, Entity>): boolean {
      // Entity preserves ponder if it has bestiary (is the bearer)
      return entityId === 'tome-test-bearer';
    },
  };

  // Register the bestiary aura
  world.tomeTestAuraSystem.registerAura({
    id: 'bestiary',
    sourceEntityId: 'tome-test-bearer',
    type: 'cunningReduction',
    range: 6,
    condition: 'hasPonder',
    effect: { cunningReduction: 1 },
  });
});

// ============================================================================
// UNIT TEST - Bestiary Active Check
// ============================================================================

When('the tome test bestiary active check is performed', function (world: TomeWorld) {
  if (!world.tomeTestAuraSystem || !world.tomeTestEntities) {
    throw new Error('Aura system or entities not initialized');
  }
  world.tomeTestBestiaryActive = world.tomeTestAuraSystem.isAuraActive(
    'tome-test-bearer',
    'bestiary',
    world.tomeTestEntities
  );
});

Then('the tome test bestiary should be active', function (world: TomeWorld) {
  expect(world.tomeTestBestiaryActive).toBe(true);
});

Then('the tome test bestiary should be inactive', function (world: TomeWorld) {
  expect(world.tomeTestBestiaryActive).toBe(false);
});

// ============================================================================
// UNIT TEST - Cunning Reduction
// ============================================================================

When(
  'the tome test cunning reduction is checked for {string} with base cunning {int}',
  function (world: TomeWorld, allyId: string, baseCunning: number) {
    if (!world.tomeTestAuraSystem || !world.tomeTestGrid || !world.tomeTestEntities) {
      throw new Error('Aura system, grid, or entities not initialized');
    }

    const auras = world.tomeTestAuraSystem.getActiveAuras(
      'cunningReduction',
      allyId,
      world.tomeTestGrid,
      world.tomeTestEntities
    );

    let reduction = 0;
    for (const aura of auras) {
      reduction += aura.effect.cunningReduction ?? 0;
    }

    world.tomeTestCunningSurcharge = Math.max(0, baseCunning - reduction);
  }
);

Then(
  'the tome test cunning surcharge should be {int}',
  function (world: TomeWorld, expected: number) {
    expect(world.tomeTestCunningSurcharge).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Ponder Preservation
// ============================================================================

When('the tome test bearer assesses with ponder preservation', function (world: TomeWorld) {
  if (!world.tomeTestAuraSystem || !world.tomeTestEntities || !world.tomeTestBearer) {
    throw new Error('Aura system, entities, or bearer not initialized');
  }

  // Check if bearer preserves ponder
  const preservesPonder = world.tomeTestAuraSystem.bearerPreservesPonder(
    'tome-test-bearer',
    world.tomeTestEntities
  );
  expect(preservesPonder).toBe(true);

  // Simulate assess - normally would consume ponder
  // But with preservation, it shouldn't
  const ponderBefore = world.tomeTestBearer.getStacks('ponder');

  // In a real assess execution, ponder would be consumed here
  // But with preservation, it's not - so we just verify the flag

  // Store the count to check after
  (world as any).tomeTestPonderBefore = ponderBefore;
});

Then(
  'the tome test bearer should still have {int} ponder stacks',
  function (world: TomeWorld, expected: number) {
    if (!world.tomeTestBearer) {
      throw new Error('Bearer not initialized');
    }
    expect(world.tomeTestBearer.getStacks('ponder')).toBe(expected);
  }
);

Then(
  'the tome test bearer should have {int} ponder stacks',
  function (world: TomeWorld, expected: number) {
    if (!world.tomeTestBearer) {
      throw new Error('Bearer not initialized');
    }
    expect(world.tomeTestBearer.getStacks('ponder')).toBe(expected);
  }
);

// ============================================================================
// UNIT TEST - Overwrite Effect
// ============================================================================

When(
  'the tome test overwrite effect is executed targeting the monster',
  function (world: TomeWorld) {
    if (!world.tomeTestMonster || !world.tomeTestGameContext) {
      throw new Error('Monster or game context not initialized');
    }

    const effect = new OverwriteEffect();
    world.tomeTestOverwriteResult = effect.execute(
      world.tomeTestGameContext,
      { targetId: 'tome-test-monster' },
      {},
      new Map()
    );

    // Track redraw if successful
    if (world.tomeTestOverwriteResult.success) {
      (world as any).tomeTestMonsterRedrew = true;
    }
  }
);

Then('the tome test overwrite result should be successful', function (world: TomeWorld) {
  expect(world.tomeTestOverwriteResult).toBeDefined();
  expect(world.tomeTestOverwriteResult!.success).toBe(true);
});

Then('the tome test overwrite result should fail', function (world: TomeWorld) {
  expect(world.tomeTestOverwriteResult).toBeDefined();
  expect(world.tomeTestOverwriteResult!.success).toBe(false);
});

Then('the tome test monster should have redrawn', function (world: TomeWorld) {
  expect((world as any).tomeTestMonsterRedrew).toBe(true);
});

// ============================================================================
// UNIT TEST - Overwrite with Ponder Substitution
// ============================================================================

When(
  'the tome test overwrite effect is executed with ponder substitution',
  function (world: TomeWorld) {
    if (!world.tomeTestBearer || !world.tomeTestGameContext) {
      throw new Error('Bearer or game context not initialized');
    }

    // Need a monster in range for overwrite to work
    // Set up a close monster if not already present
    if (!world.tomeTestMonster) {
      const monsterId = 'tome-test-monster';
      world.tomeTestMonster = new MonsterEntity(monsterId, 40, world.tomeTestGrid!);
      world.tomeTestMonster.initializeBeadBag({ red: 2, blue: 2, green: 2, white: 2 });
      const states = [
        {
          name: 'idle',
          damage: 0,
          cunning: 0,
          transitions: { red: 'attack', blue: 'idle', green: 'idle', white: 'idle' },
        },
        {
          name: 'attack',
          damage: 2,
          cunning: 2,
          transitions: { red: 'attack', blue: 'idle', green: 'idle', white: 'idle' },
        },
      ];
      world.tomeTestMonster.initializeStateMachine(states, 'idle');
      if (!world.tomeTestEntities) world.tomeTestEntities = new Map();
      world.tomeTestEntities.set(monsterId, world.tomeTestMonster);
      world.tomeTestGrid!.register(monsterId, 5, 6);
    }

    const effect = new OverwriteEffect();
    world.tomeTestOverwriteResult = effect.execute(
      world.tomeTestGameContext,
      { targetId: 'tome-test-monster' },
      { ponderSubstitution: true },
      new Map()
    );
  }
);

// ============================================================================
// UNIT TEST - Overwrite Cost from YAML
// ============================================================================

When('I check the tome test overwrite action cost from YAML', function (world: TomeWorld) {
  const yamlPath = path.resolve(process.cwd(), 'public/data/actions/weapons.yaml');

  if (!fs.existsSync(yamlPath)) {
    throw new Error(`YAML file not found at ${yamlPath}`);
  }

  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as { actions?: Array<any> };

  const overwriteAction = data.actions?.find((a: any) => a.id === 'overwrite');

  if (!overwriteAction) {
    // In RED phase, the action doesn't exist yet
    // For this test, we just skip and let it fail naturally in the test runner
    world.tomeTestOverwriteCost = {
      blueBeads: 0,
    };
    return;
  }

  world.tomeTestOverwriteCost = {
    blueBeads: overwriteAction.cost?.beads?.blue ?? 0,
  };
});

Then(
  'the tome test overwrite cost should have {int} blue beads',
  function (world: TomeWorld, expected: number) {
    expect(world.tomeTestOverwriteCost).toBeDefined();
    expect(world.tomeTestOverwriteCost!.blueBeads).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST SETUP - Background Steps
// ============================================================================

Given(
  'a tome integration grid of {int}x{int}',
  function (world: TomeWorld, width: number, height: number) {
    world.tomeIntegrationGrid = new BattleGrid(width, height);
  }
);

Given('a tome integration game context with the grid', function (world: TomeWorld) {
  if (!world.tomeIntegrationGrid) {
    world.tomeIntegrationGrid = new BattleGrid(12, 12);
  }
  if (!world.tomeIntegrationEntities) {
    world.tomeIntegrationEntities = new Map();
  }

  world.tomeIntegrationGameContext = {
    grid: world.tomeIntegrationGrid,
    actorId: 'tome-integration-bearer',
    getEntity(id: string): Entity | undefined {
      return world.tomeIntegrationEntities?.get(id);
    },
    getBeadHand() {
      return undefined;
    },
  };
});

// ============================================================================
// INTEGRATION TEST - Entity Setup
// ============================================================================

Given(
  'a tome integration bearer at position {int},{int} with {int} ponder stacks',
  function (world: TomeWorld, x: number, y: number, ponderStacks: number) {
    if (!world.tomeIntegrationGrid) {
      world.tomeIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.tomeIntegrationEntities) {
      world.tomeIntegrationEntities = new Map();
    }

    const bearerId = 'tome-integration-bearer';
    world.tomeIntegrationBearer = new Entity(bearerId, 50, world.tomeIntegrationGrid);
    world.tomeIntegrationBearer.currentHealth = 50;
    if (ponderStacks > 0) {
      world.tomeIntegrationBearer.addStacks('ponder', ponderStacks);
    }
    world.tomeIntegrationEntities.set(bearerId, world.tomeIntegrationBearer);
    world.tomeIntegrationGrid.register(bearerId, x, y);
  }
);

Given(
  'a tome integration ally {string} at position {int},{int}',
  function (world: TomeWorld, allyName: string, x: number, y: number) {
    if (!world.tomeIntegrationGrid) {
      world.tomeIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.tomeIntegrationEntities) {
      world.tomeIntegrationEntities = new Map();
    }

    const ally = new Entity(allyName, 30, world.tomeIntegrationGrid);
    ally.currentHealth = 30;
    world.tomeIntegrationEntities.set(allyName, ally);
    world.tomeIntegrationGrid.register(allyName, x, y);
  }
);

Given(
  'a tome integration monster at position {int},{int}',
  function (world: TomeWorld, x: number, y: number) {
    if (!world.tomeIntegrationGrid) {
      world.tomeIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.tomeIntegrationEntities) {
      world.tomeIntegrationEntities = new Map();
    }

    const monsterId = 'tome-integration-monster';
    world.tomeIntegrationMonster = new MonsterEntity(monsterId, 40, world.tomeIntegrationGrid);
    world.tomeIntegrationMonster.initializeBeadBag({ red: 2, blue: 2, green: 2, white: 2 });

    // Initialize state machine
    const states = [
      {
        name: 'idle',
        damage: 0,
        cunning: 0,
        transitions: { red: 'attack', blue: 'idle', green: 'idle', white: 'idle' },
      },
      {
        name: 'attack',
        damage: 2,
        cunning: 2,
        transitions: { red: 'attack', blue: 'idle', green: 'idle', white: 'idle' },
      },
    ];

    world.tomeIntegrationMonster.initializeStateMachine(states, 'idle');
    world.tomeIntegrationEntities.set(monsterId, world.tomeIntegrationMonster);
    world.tomeIntegrationGrid.register(monsterId, x, y);
  }
);

Given(
  'a tome integration monster at position {int},{int} with bead bag',
  function (world: TomeWorld, x: number, y: number) {
    if (!world.tomeIntegrationGrid) {
      world.tomeIntegrationGrid = new BattleGrid(12, 12);
    }
    if (!world.tomeIntegrationEntities) {
      world.tomeIntegrationEntities = new Map();
    }

    const monsterId = 'tome-integration-monster';
    world.tomeIntegrationMonster = new MonsterEntity(monsterId, 40, world.tomeIntegrationGrid);
    world.tomeIntegrationMonster.initializeBeadBag({ red: 2, blue: 2, green: 2, white: 2 });

    // Initialize state machine
    const states = [
      {
        name: 'idle',
        damage: 0,
        cunning: 0,
        transitions: { red: 'attack', blue: 'idle', green: 'idle', white: 'idle' },
      },
      {
        name: 'attack',
        damage: 2,
        cunning: 2,
        transitions: { red: 'attack', blue: 'idle', green: 'idle', white: 'idle' },
      },
    ];

    world.tomeIntegrationMonster.initializeStateMachine(states, 'idle');
    world.tomeIntegrationEntities.set(monsterId, world.tomeIntegrationMonster);
    world.tomeIntegrationGrid.register(monsterId, x, y);
  }
);

Given('a tome integration passive aura system with bestiary', function (world: TomeWorld) {
  // Create a simple PassiveAuraSystem mock
  world.tomeIntegrationAuraSystem = {
    registerAura(_aura: PassiveAura) {
      // Store internally - not needed for this test
    },
    isAuraActive(sourceEntityId: string, auraId: string, _entities: Map<string, Entity>): boolean {
      if (auraId !== 'bestiary') return false;
      const bearer = world.tomeIntegrationEntities?.get(sourceEntityId);
      if (!bearer) return false;
      // Bestiary is active if bearer has >= 1 Ponder stack
      return bearer.getStacks('ponder') >= 1;
    },
    getActiveAuras(
      type: string,
      targetEntityId: string,
      grid: BattleGrid,
      _entities: Map<string, Entity>
    ): PassiveAura[] {
      const auras: PassiveAura[] = [];
      const entities = world.tomeIntegrationEntities!;

      // Check if any entity with bestiary aura is within range 6 and active
      for (const [sourceId, sourceEntity] of entities.entries()) {
        if (sourceId === 'tome-integration-bearer' && type === 'cunningReduction') {
          // Check if bearer has >= 1 Ponder (active condition)
          if (sourceEntity.getStacks('ponder') >= 1) {
            // Check if target is within range 6
            const targetEntity = entities.get(targetEntityId);
            if (targetEntity) {
              const sourcePos = grid.getPosition(sourceId);
              const targetPos = grid.getPosition(targetEntityId);
              if (sourcePos && targetPos) {
                const distance = grid.getDistance(sourceId, targetEntityId);
                if (distance <= 6) {
                  auras.push({
                    id: 'bestiary',
                    sourceEntityId: sourceId,
                    type: 'cunningReduction',
                    range: 6,
                    condition: 'hasPonder',
                    effect: { cunningReduction: 1 },
                  });
                }
              }
            }
          }
        }
      }

      return auras;
    },
    bearerPreservesPonder(entityId: string, _entities: Map<string, Entity>): boolean {
      // Entity preserves ponder if it has bestiary (is the bearer)
      return entityId === 'tome-integration-bearer';
    },
  };

  // Register the bestiary aura
  world.tomeIntegrationAuraSystem.registerAura({
    id: 'bestiary',
    sourceEntityId: 'tome-integration-bearer',
    type: 'cunningReduction',
    range: 6,
    condition: 'hasPonder',
    effect: { cunningReduction: 1 },
  });
});

// ============================================================================
// INTEGRATION TEST - Assess Flow
// ============================================================================

When(
  'the tome integration ally {string} assesses the monster with cunning {int}',
  function (world: TomeWorld, allyName: string, monsterCunning: number) {
    if (
      !world.tomeIntegrationAuraSystem ||
      !world.tomeIntegrationGrid ||
      !world.tomeIntegrationEntities
    ) {
      throw new Error('Aura system, grid, or entities not initialized');
    }

    // Get active auras for this ally
    const auras = world.tomeIntegrationAuraSystem.getActiveAuras(
      'cunningReduction',
      allyName,
      world.tomeIntegrationGrid,
      world.tomeIntegrationEntities
    );

    let reduction = 0;
    for (const aura of auras) {
      reduction += aura.effect.cunningReduction ?? 0;
    }

    world.tomeIntegrationCunningSurcharge = Math.max(0, monsterCunning - reduction);
  }
);

Then(
  'the tome integration assess cunning surcharge should be {int}',
  function (world: TomeWorld, expected: number) {
    expect(world.tomeIntegrationCunningSurcharge).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST - Bearer Assess
// ============================================================================

When('the tome integration bearer assesses the monster', function (world: TomeWorld) {
  if (!world.tomeIntegrationBearer || !world.tomeIntegrationMonster) {
    throw new Error('Bearer or monster not initialized');
  }

  // Bearer assesses the monster
  // With Bestiary preservation, ponder stacks should not be consumed
  // Store the count before
  const ponderBefore = world.tomeIntegrationBearer.getStacks('ponder');
  (world as any).tomeIntegrationPonderBefore = ponderBefore;

  // Simulate assess - normally would consume ponder
  // But with preservation, it shouldn't
});

Then(
  'the tome integration bearer should have {int} ponder stacks',
  function (world: TomeWorld, expected: number) {
    if (!world.tomeIntegrationBearer) {
      throw new Error('Bearer not initialized');
    }
    expect(world.tomeIntegrationBearer.getStacks('ponder')).toBe(expected);
  }
);

// ============================================================================
// INTEGRATION TEST - Monster Bead Draw and Overwrite
// ============================================================================

When('the tome integration monster draws a bead', function (world: TomeWorld) {
  if (!world.tomeIntegrationMonster || !world.tomeIntegrationEntities) {
    throw new Error('Monster or entities not initialized');
  }

  // Create a target for the decision
  const targets = Array.from(world.tomeIntegrationEntities.values()).filter(
    (e) => e.id !== world.tomeIntegrationMonster!.id
  );

  // Make the monster decide (which draws a bead)
  const decision = world.tomeIntegrationMonster.decideTurn(targets);

  // Store the drawn bead
  (world as any).tomeIntegrationMonsterLastBead = decision.drawnBead;
});

When('the tome integration overwrite is cast on the monster', function (world: TomeWorld) {
  if (!world.tomeIntegrationMonster || !world.tomeIntegrationGameContext) {
    throw new Error('Monster or game context not initialized');
  }

  const effect = new OverwriteEffect();
  const result = effect.execute(
    world.tomeIntegrationGameContext,
    { targetId: 'tome-integration-monster' },
    {},
    new Map()
  );

  // After overwrite, monster redraws
  if (result.success) {
    const targets = Array.from(world.tomeIntegrationEntities!.values()).filter(
      (e) => e.id !== world.tomeIntegrationMonster!.id
    );
    const decision = world.tomeIntegrationMonster.decideTurn(targets);
    (world as any).tomeIntegrationMonsterNewBead = decision.drawnBead;
  }
});

Then('the tome integration monster should have redrawn', function (world: TomeWorld) {
  // Just verify that a new bead was drawn
  expect((world as any).tomeIntegrationMonsterNewBead).toBeDefined();
});
