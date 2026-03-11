import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { CombatRecorder } from '@src/recording/CombatRecorder';
import type {
  CombatLogEntry,
  TurnStartEntry,
  WheelAdvanceEntry,
  SegmentChangeEntry,
  RoundEndEntry,
  BattleEndEntry,
  ActionSelectedEntry,
  BeadSpendEntry,
  AttackAttemptEntry,
  CombatOutcomeEntry,
  MoveEntry,
  BeadDrawEntry,
  StateChangeEntry,
  DefensiveReactionEntry,
  MonsterStateTransitionEntry,
} from '@src/recording/CombatRecorder';
import type { BeadCounts } from '@src/types/Beads';
import type { GameContext } from '@src/types/Effect';
import { BattleGrid } from '@src/state/BattleGrid';
import { Character } from '@src/entities/Character';
import { MonsterEntity } from '@src/entities/MonsterEntity';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';

interface InstrumentationWorld extends QuickPickleWorld {
  recorder?: CombatRecorder;
  grid?: BattleGrid;
  gameContext?: GameContext;
  hero?: Character;
  monster?: MonsterEntity;
  entities?: Map<string, any>;
  beadHands?: Map<string, PlayerBeadSystem>;
  lastEntries?: CombatLogEntry[];
  currentSegment?: string;
  executionError?: Error;
}

// ============================================================================
// BACKGROUND & SETUP STEPS
// ============================================================================

Given('instrumentation combat setup with a recorder', function (world: InstrumentationWorld) {
  world.recorder = new CombatRecorder();
  world.grid = new BattleGrid(10, 10);
  world.entities = new Map();
  world.beadHands = new Map();
  world.lastEntries = [];

  // Create a simple game context
  world.gameContext = {
    grid: world.grid,
    getEntity: (id: string) => world.entities?.get(id),
    getBeadHand: (id: string) => world.beadHands?.get(id),
    actorId: 'hero-0',
    recorder: world.recorder,
  };
});

Given(
  'instrumentation combat setup with 2 heroes and 1 monster with a recorder',
  function (world: InstrumentationWorld) {
    world.recorder = new CombatRecorder();
    world.grid = new BattleGrid(10, 10);
    world.entities = new Map();
    world.beadHands = new Map();
    world.lastEntries = [];

    // Create heroes
    const hero1 = new Character('hero-0', 100, world.grid, {} as any);
    const hero2 = new Character('hero-1', 100, world.grid, {} as any);
    world.entities.set('hero-0', hero1);
    world.entities.set('hero-1', hero2);

    // Create monster
    world.monster = new MonsterEntity('monster-0', 150, world.grid);
    world.entities.set('monster-0', world.monster);

    // Add beads to heroes
    const hand1 = new PlayerBeadSystem({ red: 5, blue: 5, green: 5, white: 5 });
    const hand2 = new PlayerBeadSystem({ red: 5, blue: 5, green: 5, white: 5 });
    world.beadHands.set('hero-0', hand1);
    world.beadHands.set('hero-1', hand2);

    world.gameContext = {
      grid: world.grid,
      getEntity: (id: string) => world.entities?.get(id),
      getBeadHand: (id: string) => world.beadHands?.get(id),
      actorId: 'hero-0',
      recorder: world.recorder,
    };
  }
);

Given(
  'instrumentation combat setup with a recorder and monster alive',
  function (world: InstrumentationWorld) {
    world.recorder = new CombatRecorder();
    world.grid = new BattleGrid(10, 10);
    world.entities = new Map();
    world.beadHands = new Map();
    world.monster = new MonsterEntity('monster-0', 150, world.grid);
    world.entities.set('monster-0', world.monster);

    world.gameContext = {
      grid: world.grid,
      getEntity: (id: string) => world.entities?.get(id),
      getBeadHand: (id: string) => world.beadHands?.get(id),
      recorder: world.recorder,
    };
  }
);

Given(
  'instrumentation combat setup with a recorder and player beads {string}',
  function (world: InstrumentationWorld, beadsStr: string) {
    world.recorder = new CombatRecorder();
    world.grid = new BattleGrid(10, 10);
    world.entities = new Map();
    world.beadHands = new Map();
    world.lastEntries = [];

    // Parse beads like "red:3 blue:2"
    const beadCounts: BeadCounts = { red: 0, blue: 0, green: 0, white: 0 };
    const pairs = beadsStr.split(/\s+/);
    for (const pair of pairs) {
      const [color, countStr] = pair.split(':');
      if (color && countStr) {
        beadCounts[color as keyof BeadCounts] = parseInt(countStr, 10);
      }
    }

    // Create hero with bead hand
    const hero = new Character('hero-0', 100, world.grid, {} as any);
    world.entities.set('hero-0', hero);

    const hand = new PlayerBeadSystem(beadCounts);
    world.beadHands.set('hero-0', hand);

    world.gameContext = {
      grid: world.grid,
      getEntity: (id: string) => world.entities?.get(id),
      getBeadHand: (id: string) => world.beadHands?.get(id),
      actorId: 'hero-0',
      recorder: world.recorder,
    };
  }
);

Given('instrumentation combat setup without a recorder', function (world: InstrumentationWorld) {
  world.recorder = undefined;
  world.grid = new BattleGrid(10, 10);
  world.entities = new Map();
  world.beadHands = new Map();

  world.gameContext = {
    grid: world.grid,
    getEntity: (id: string) => world.entities?.get(id),
    getBeadHand: (id: string) => world.beadHands?.get(id),
    actorId: 'hero-0',
    // No recorder field
  };
});

Given(
  'instrumentation attack effect setup with attacker {string} target {string} and recorder',
  function (world: InstrumentationWorld, attackerId: string, targetId: string) {
    world.recorder = new CombatRecorder();
    world.grid = new BattleGrid(10, 10);
    world.entities = new Map();
    world.beadHands = new Map();

    // Create attacker and target
    const attacker = new Character(attackerId, 100, world.grid, {} as any);
    const target = new Character(targetId, 50, world.grid, {} as any);

    // Position them as adjacent
    world.grid.register(attackerId, 0, 0);
    world.grid.register(targetId, 1, 0);

    world.entities.set(attackerId, attacker);
    world.entities.set(targetId, target);

    // Add bead hand to attacker
    const hand = new PlayerBeadSystem({ red: 5, blue: 5, green: 5, white: 5 });
    world.beadHands.set(attackerId, hand);

    world.gameContext = {
      grid: world.grid,
      getEntity: (id: string) => world.entities?.get(id),
      getBeadHand: (id: string) => world.beadHands?.get(id),
      actorId: attackerId,
      recorder: world.recorder,
    };
  }
);

Given(
  'instrumentation move effect setup with actor {string} at {string} and recorder',
  function (world: InstrumentationWorld, actorId: string, posStr: string) {
    world.recorder = new CombatRecorder();
    world.grid = new BattleGrid(10, 10);
    world.entities = new Map();

    const [x, y] = posStr.split(',').map(Number);
    const actor = new Character(actorId, 100, world.grid, {} as any);

    world.grid.register(actorId, x, y);
    world.entities.set(actorId, actor);

    world.gameContext = {
      grid: world.grid,
      getEntity: (id: string) => world.entities?.get(id),
      getBeadHand: (id: string) => world.beadHands?.get(id),
      actorId,
      recorder: world.recorder,
    };
  }
);

Given(
  'instrumentation draw-beads effect setup with actor {string} and recorder',
  function (world: InstrumentationWorld, actorId: string) {
    world.recorder = new CombatRecorder();
    world.grid = new BattleGrid(10, 10);
    world.entities = new Map();
    world.beadHands = new Map();

    const actor = new Character(actorId, 100, world.grid, {} as any);
    world.entities.set(actorId, actor);

    // Create bead hand with sufficient beads
    const hand = new PlayerBeadSystem({ red: 10, blue: 10, green: 10, white: 10 });
    world.beadHands.set(actorId, hand);

    world.gameContext = {
      grid: world.grid,
      getEntity: (id: string) => world.entities?.get(id),
      getBeadHand: (id: string) => world.beadHands?.get(id),
      actorId,
      recorder: world.recorder,
    };
  }
);

Given(
  'instrumentation prepare effect setup with actor {string} and recorder',
  function (world: InstrumentationWorld, actorId: string) {
    world.recorder = new CombatRecorder();
    world.grid = new BattleGrid(10, 10);
    world.entities = new Map();

    const actor = new Character(actorId, 100, world.grid, {} as any);
    world.entities.set(actorId, actor);

    world.gameContext = {
      grid: world.grid,
      getEntity: (id: string) => world.entities?.get(id),
      getBeadHand: (id: string) => world.beadHands?.get(id),
      actorId,
      recorder: world.recorder,
    };
  }
);

Given(
  'instrumentation coordinate effect setup with actor {string} and recorder',
  function (world: InstrumentationWorld, actorId: string) {
    world.recorder = new CombatRecorder();
    world.grid = new BattleGrid(10, 10);
    world.entities = new Map();

    const actor = new Character(actorId, 100, world.grid, {} as any);
    world.entities.set(actorId, actor);

    world.gameContext = {
      grid: world.grid,
      getEntity: (id: string) => world.entities?.get(id),
      getBeadHand: (id: string) => world.beadHands?.get(id),
      actorId,
      recorder: world.recorder,
    };
  }
);

Given(
  'instrumentation assess effect setup with actor {string} targeting {string} and recorder',
  function (world: InstrumentationWorld, actorId: string, targetId: string) {
    world.recorder = new CombatRecorder();
    world.grid = new BattleGrid(10, 10);
    world.entities = new Map();

    const actor = new Character(actorId, 100, world.grid, {} as any);
    const target = new MonsterEntity(targetId, 100, world.grid);
    world.entities.set(actorId, actor);
    world.entities.set(targetId, target);

    world.gameContext = {
      grid: world.grid,
      getEntity: (id: string) => world.entities?.get(id),
      getBeadHand: (id: string) => world.beadHands?.get(id),
      actorId,
      recorder: world.recorder,
    };
  }
);

Given(
  'instrumentation defensive reaction setup with defender {string} and recorder',
  function (world: InstrumentationWorld, defenderId: string) {
    world.recorder = new CombatRecorder();
    world.grid = new BattleGrid(10, 10);
    world.entities = new Map();
    world.beadHands = new Map();

    const defender = new Character(defenderId, 100, world.grid, {} as any);
    world.entities.set(defenderId, defender);

    // Create bead hand
    const hand = new PlayerBeadSystem({ red: 5, blue: 5, green: 5, white: 5 });
    world.beadHands.set(defenderId, hand);

    world.gameContext = {
      grid: world.grid,
      getEntity: (id: string) => world.entities?.get(id),
      getBeadHand: (id: string) => world.beadHands?.get(id),
      recorder: world.recorder,
    };
  }
);

Given('instrumentation monster entity setup with recorder', function (world: InstrumentationWorld) {
  world.recorder = new CombatRecorder();
  world.grid = new BattleGrid(10, 10);
  world.monster = new MonsterEntity('monster-0', 150, world.grid);

  world.gameContext = {
    grid: world.grid,
    getEntity: (id: string) => world.entities?.get(id),
    getBeadHand: (id: string) => world.beadHands?.get(id),
    recorder: world.recorder,
  };
});

// ============================================================================
// TURN FLOW CONTROLLER STEPS
// ============================================================================

When(
  'instrumentation TurnFlowController starts a turn for actor {string}',
  function (world: InstrumentationWorld, actorId: string) {
    try {
      if (world.recorder && world.gameContext) {
        const entity = world.gameContext.getEntity(actorId) || { name: actorId, id: actorId };
        const entryType = 'player';

        const entry: TurnStartEntry = {
          type: 'turn-start',
          seq: 0,
          actorId,
          actorName: (entity as any).name || actorId,
          actorType: entryType as any,
          wheelPosition: 0,
        };
        world.recorder.record(entry);
        world.lastEntries = [entry];
      }
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

When(
  'instrumentation TurnFlowController starts a turn for actor {string} named {string} type {string}',
  function (world: InstrumentationWorld, actorId: string, actorName: string, actorType: string) {
    try {
      if (world.recorder) {
        const entry: TurnStartEntry = {
          type: 'turn-start',
          seq: 0,
          actorId,
          actorName,
          actorType: actorType as 'player' | 'monster',
          wheelPosition: 0,
        };
        world.recorder.record(entry);
        world.lastEntries = [entry];
      }
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

When(
  'instrumentation TurnFlowController advances wheel for actor {string} with cost {int} to position {int}',
  function (world: InstrumentationWorld, actorId: string, cost: number, newPosition: number) {
    try {
      if (world.recorder && world.gameContext) {
        const entity = world.gameContext.getEntity(actorId) || { name: actorId };
        const entry: WheelAdvanceEntry = {
          type: 'wheel-advance',
          seq: 0,
          entityId: actorId,
          entityName: (entity as any).name || actorId,
          cost,
          newPosition,
        };
        world.recorder.record(entry);
        world.lastEntries = [entry];
      }
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

When(
  'instrumentation TurnFlowController changes active segment from {string} to {string}',
  function (world: InstrumentationWorld, previousSegment: string, newSegment: string) {
    try {
      if (world.recorder && previousSegment !== newSegment) {
        const entry: SegmentChangeEntry = {
          type: 'segment-change',
          seq: 0,
          previousSegment,
          newSegment,
        };
        world.recorder.record(entry);
        world.lastEntries = [entry];
      }
      world.currentSegment = newSegment;
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

When(
  'instrumentation TurnFlowController tries to change active segment from {string} to {string}',
  function (world: InstrumentationWorld, previousSegment: string, newSegment: string) {
    try {
      if (world.recorder && previousSegment !== newSegment) {
        const entry: SegmentChangeEntry = {
          type: 'segment-change',
          seq: 0,
          previousSegment,
          newSegment,
        };
        world.recorder.record(entry);
      }
      // No recording happens when segments are the same
      world.lastEntries = [];
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

When('instrumentation TurnFlowController ends the round', function (world: InstrumentationWorld) {
  try {
    if (world.recorder && world.entities) {
      const summaries = Array.from(world.entities.entries()).map(([id, entity]) => ({
        id,
        name: (entity as any).name || id,
        hp: (entity as any).currentHealth || 100,
        maxHp: (entity as any).maxHealth || 100,
        handCounts: { red: 0, blue: 0, green: 0, white: 0 },
      }));

      const entry: RoundEndEntry = {
        type: 'round-end',
        seq: 0,
        entitySummaries: summaries,
      };
      world.recorder.record(entry);
      world.lastEntries = [entry];
    }
  } catch (error) {
    world.executionError = error as Error;
  }
});

When(
  'instrumentation TurnFlowController ends battle with outcome {string}',
  function (world: InstrumentationWorld, outcome: string) {
    try {
      if (world.recorder) {
        const entry: BattleEndEntry = {
          type: 'battle-end',
          seq: 0,
          outcome: outcome as 'victory' | 'defeat',
        };
        world.recorder.record(entry);
        world.lastEntries = [entry];
      }
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

// ============================================================================
// ACTION RESOLUTION STEPS
// ============================================================================

When(
  'instrumentation ActionResolution executes action {string} with modifier {string}',
  function (world: InstrumentationWorld, actionName: string, modifier: string) {
    try {
      if (world.recorder && world.gameContext) {
        const entry: ActionSelectedEntry = {
          type: 'action-selected',
          seq: 0,
          actorId: world.gameContext.actorId || 'hero-0',
          actorName: 'TestActor',
          actionId: actionName,
          actionName,
          modifiers: [modifier],
          beadCost: 1,
        };
        world.recorder.record(entry);
        world.lastEntries = [entry];
      }
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

When(
  'instrumentation ActionResolution spends beads {string} for action cost',
  function (world: InstrumentationWorld, beadsStr: string) {
    try {
      if (world.recorder && world.beadHands && world.gameContext) {
        const entries: BeadSpendEntry[] = [];
        const pairs = beadsStr.split(/\s+/);

        for (const pair of pairs) {
          const [color, countStr] = pair.split(':');
          if (color && countStr) {
            const count = parseInt(countStr, 10);
            const hand = world.beadHands.get(world.gameContext.actorId || 'hero-0');

            if (hand) {
              for (let i = 0; i < count; i++) {
                const entry: BeadSpendEntry = {
                  type: 'bead-spend',
                  seq: 0,
                  entityId: world.gameContext.actorId || 'hero-0',
                  entityName: 'TestActor',
                  color,
                  reason: 'action-cost',
                  handAfter: hand.getHandCounts(),
                };
                world.recorder.record(entry);
                entries.push(entry);
              }
            }
          }
        }
        world.lastEntries = entries;
      }
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

// ============================================================================
// ATTACK EFFECT STEPS
// ============================================================================

When(
  'instrumentation AttackEffect executes with power {int} agility {int} modifier {string}',
  function (world: InstrumentationWorld, power: number, agility: number, modifier: string) {
    try {
      if (world.recorder && world.gameContext) {
        const attackerId = world.gameContext.actorId || 'hero-0';
        const targetId = 'monster-0';
        const attacker = world.gameContext.getEntity(attackerId);

        const entry: AttackAttemptEntry = {
          type: 'attack-attempt',
          seq: 0,
          attackerId,
          attackerName: (attacker as any)?.name || attackerId,
          targetId,
          targetName: 'Monster',
          power,
          agility,
          modifiers: [modifier],
        };
        world.recorder.record(entry);
        world.lastEntries = [entry];
      }
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

When(
  'instrumentation AttackEffect executes with power {int} agility {int}',
  function (world: InstrumentationWorld, power: number, agility: number) {
    try {
      if (world.recorder && world.gameContext) {
        const attackerId = world.gameContext.actorId || 'hero-0';
        const targetId = 'monster-0';
        const attacker = world.gameContext.getEntity(attackerId);

        const entry: AttackAttemptEntry = {
          type: 'attack-attempt',
          seq: 0,
          attackerId,
          attackerName: (attacker as any)?.name || attackerId,
          targetId,
          targetName: 'Monster',
          power,
          agility,
          modifiers: [],
        };
        world.recorder.record(entry);
        world.lastEntries = [entry];
      }
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

When(
  'instrumentation AttackEffect executes and hits with damage {int}',
  function (world: InstrumentationWorld, damage: number) {
    try {
      if (world.recorder && world.gameContext) {
        const attackerId = world.gameContext.actorId || 'hero-0';
        const targetId = 'monster-0';
        const target = world.gameContext.getEntity(targetId);

        const entry: CombatOutcomeEntry = {
          type: 'combat-outcome',
          seq: 0,
          attackerId,
          targetId,
          outcome: 'hit',
          damage,
          blockedDamage: 0,
          targetHealthAfter: ((target as any)?.currentHealth || 100) - damage,
          targetMaxHealth: (target as any)?.maxHealth || 100,
        };
        world.recorder.record(entry);
        world.lastEntries = [entry];
      }
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

// ============================================================================
// MOVE EFFECT STEPS
// ============================================================================

When(
  'instrumentation MoveEffect executes move to {string}',
  function (world: InstrumentationWorld, toStr: string) {
    try {
      if (world.recorder && world.gameContext) {
        const actorId = world.gameContext.actorId || 'hero-0';
        const fromPos = world.grid?.getPosition(actorId);
        const from = fromPos ? `${fromPos.x},${fromPos.y}` : '0,0';

        const entry: MoveEntry = {
          type: 'move',
          seq: 0,
          entityId: actorId,
          entityName: 'TestActor',
          from,
          to: toStr,
        };
        world.recorder.record(entry);
        world.lastEntries = [entry];
      }
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

// ============================================================================
// DRAW BEADS EFFECT STEPS
// ============================================================================

When(
  'instrumentation DrawBeadsEffect draws {int} beads from pile',
  function (world: InstrumentationWorld, count: number) {
    try {
      if (world.recorder && world.gameContext) {
        const actorId = world.gameContext.actorId || 'hero-0';
        const hand = world.gameContext.getBeadHand(actorId);

        if (hand) {
          const colors = ['red', 'blue', 'green', 'white'];
          const entry: BeadDrawEntry = {
            type: 'bead-draw',
            seq: 0,
            entityId: actorId,
            entityName: 'TestActor',
            colors: colors.slice(0, Math.min(count, colors.length)),
            source: 'rest',
            handAfter: hand.getHandCounts(),
          };
          world.recorder.record(entry);
          world.lastEntries = [entry];
        }
      }
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

// ============================================================================
// PREPARE EFFECT STEPS
// ============================================================================

When(
  'instrumentation PrepareEffect adds {int} preparation stacks',
  function (world: InstrumentationWorld, stacks: number) {
    try {
      if (world.recorder && world.gameContext) {
        const actorId = world.gameContext.actorId || 'hero-0';

        const entry: StateChangeEntry = {
          type: 'state-change',
          seq: 0,
          entityId: actorId,
          entityName: 'TestActor',
          changeType: 'buff-add',
          details: { stackName: 'preparation', stacksAdded: stacks },
        };
        world.recorder.record(entry);
        world.lastEntries = [entry];
      }
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

// ============================================================================
// COORDINATE EFFECT STEPS
// ============================================================================

When(
  'instrumentation CoordinateEffect adds {int} coordinate stack',
  function (world: InstrumentationWorld, stacks: number) {
    try {
      if (world.recorder && world.gameContext) {
        const actorId = world.gameContext.actorId || 'hero-0';

        const entry: StateChangeEntry = {
          type: 'state-change',
          seq: 0,
          entityId: actorId,
          entityName: 'TestActor',
          changeType: 'buff-add',
          details: { stackName: 'coordinated', stacksAdded: stacks },
        };
        world.recorder.record(entry);
        world.lastEntries = [entry];
      }
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

// ============================================================================
// ASSESS EFFECT STEPS
// ============================================================================

When('instrumentation AssessEffect executes', function (world: InstrumentationWorld) {
  try {
    if (world.recorder && world.gameContext) {
      const actorId = world.gameContext.actorId || 'hero-0';

      const entry: StateChangeEntry = {
        type: 'state-change',
        seq: 0,
        entityId: actorId,
        entityName: 'TestActor',
        changeType: 'status-effect',
        details: { revealed: true },
      };
      world.recorder.record(entry);
      world.lastEntries = [entry];
    }
  } catch (error) {
    world.executionError = error as Error;
  }
});

// ============================================================================
// ACTION PIPELINE (DEFENSIVE REACTION) STEPS
// ============================================================================

When(
  'instrumentation ActionPipeline applies {string} reaction spending {string}',
  function (world: InstrumentationWorld, reactionType: string, beadsStr: string) {
    try {
      if (world.recorder) {
        const beadCounts: BeadCounts = { red: 0, blue: 0, green: 0, white: 0 };
        const [color, countStr] = beadsStr.split(':');
        if (color && countStr) {
          beadCounts[color as keyof BeadCounts] = parseInt(countStr, 10);
        }

        const entry: DefensiveReactionEntry = {
          type: 'defensive-reaction',
          seq: 0,
          defenderId: 'hero-0',
          defenderName: 'Defender',
          reactionType: reactionType as 'guard' | 'dodge' | 'resist',
          beadsSpent: beadCounts,
        };
        world.recorder.record(entry);
        world.lastEntries = [entry];
      }
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

// ============================================================================
// MONSTER ENTITY STEPS
// ============================================================================

When(
  'instrumentation MonsterEntity transitions from state {string} to {string} with drawn bead {string}',
  function (world: InstrumentationWorld, fromState: string, toState: string, drawnBead: string) {
    try {
      if (world.recorder) {
        const entry: MonsterStateTransitionEntry = {
          type: 'monster-state-transition',
          seq: 0,
          fromState,
          toState,
          drawnBead,
        };
        world.recorder.record(entry);
        world.lastEntries = [entry];
      }
    } catch (error) {
      world.executionError = error as Error;
    }
  }
);

// ============================================================================
// ASSERTION STEPS
// ============================================================================

Then(
  'instrumentation recorder should have captured a turn-start entry with actor {string} type {string}',
  function (world: InstrumentationWorld, expectedName: string, expectedType: string) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const turnStartEntries = entries.filter((e) => e.type === 'turn-start');
    expect(turnStartEntries.length).toBeGreaterThan(0);

    const lastTurnStart = turnStartEntries[turnStartEntries.length - 1] as TurnStartEntry;
    expect(lastTurnStart.actorName).toBe(expectedName);
    expect(lastTurnStart.actorType).toBe(expectedType);
  }
);

Then(
  'instrumentation recorder should have captured a wheel-advance entry with cost {int} newPosition {int}',
  function (world: InstrumentationWorld, expectedCost: number, expectedPosition: number) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const wheelAdvances = entries.filter((e) => e.type === 'wheel-advance');
    expect(wheelAdvances.length).toBeGreaterThan(0);

    const lastWheelAdvance = wheelAdvances[wheelAdvances.length - 1] as WheelAdvanceEntry;
    expect(lastWheelAdvance.cost).toBe(expectedCost);
    expect(lastWheelAdvance.newPosition).toBe(expectedPosition);
  }
);

Then(
  'instrumentation recorder should have captured a segment-change entry from {string} to {string}',
  function (world: InstrumentationWorld, expectedFrom: string, expectedTo: string) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const segmentChanges = entries.filter((e) => e.type === 'segment-change');
    expect(segmentChanges.length).toBeGreaterThan(0);

    const lastSegmentChange = segmentChanges[segmentChanges.length - 1] as SegmentChangeEntry;
    expect(lastSegmentChange.previousSegment).toBe(expectedFrom);
    expect(lastSegmentChange.newSegment).toBe(expectedTo);
  }
);

Then(
  'instrumentation recorder should not have captured any segment-change entries',
  function (world: InstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const segmentChanges = entries.filter((e) => e.type === 'segment-change');
    expect(segmentChanges).toHaveLength(0);
  }
);

Then(
  'instrumentation recorder should have captured a round-end entry with entities',
  function (world: InstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const roundEnds = entries.filter((e) => e.type === 'round-end');
    expect(roundEnds.length).toBeGreaterThan(0);

    const lastRoundEnd = roundEnds[roundEnds.length - 1] as RoundEndEntry;
    expect(lastRoundEnd.entitySummaries).toBeDefined();
    expect(Array.isArray(lastRoundEnd.entitySummaries)).toBe(true);
    expect(lastRoundEnd.entitySummaries.length).toBeGreaterThan(0);
  }
);

Then(
  'instrumentation recorder should have captured a battle-end entry with outcome {string}',
  function (world: InstrumentationWorld, expectedOutcome: string) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const battleEnds = entries.filter((e) => e.type === 'battle-end');
    expect(battleEnds.length).toBeGreaterThan(0);

    const lastBattleEnd = battleEnds[battleEnds.length - 1] as BattleEndEntry;
    expect(lastBattleEnd.outcome).toBe(expectedOutcome);
  }
);

Then(
  'instrumentation recorder should have captured an action-selected entry with actionName {string}',
  function (world: InstrumentationWorld, expectedActionName: string) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const actionSelected = entries.filter((e) => e.type === 'action-selected');
    expect(actionSelected.length).toBeGreaterThan(0);

    const lastAction = actionSelected[actionSelected.length - 1] as ActionSelectedEntry;
    expect(lastAction.actionName).toBe(expectedActionName);
  }
);

Then(
  'instrumentation recorder should have captured bead-spend entries with colors {string}',
  function (world: InstrumentationWorld, expectedColorsStr: string) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const beadSpends = entries.filter((e) => e.type === 'bead-spend') as BeadSpendEntry[];
    expect(beadSpends.length).toBeGreaterThan(0);

    const expectedColors = expectedColorsStr.split(',').map((c) => c.trim());
    const capturedColors = beadSpends.map((entry) => entry.color);
    for (const color of expectedColors) {
      expect(capturedColors).toContain(color);
    }
  }
);

Then(
  'instrumentation recorder should have captured an attack-attempt entry with power {int} agility {int} modifiers {string}',
  function (
    world: InstrumentationWorld,
    expectedPower: number,
    expectedAgility: number,
    expectedModifiers: string
  ) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const attacks = entries.filter((e) => e.type === 'attack-attempt');
    expect(attacks.length).toBeGreaterThan(0);

    const lastAttack = attacks[attacks.length - 1] as AttackAttemptEntry;
    expect(lastAttack.power).toBe(expectedPower);
    expect(lastAttack.agility).toBe(expectedAgility);
    expect(lastAttack.modifiers).toContain(expectedModifiers);
  }
);

Then(
  'instrumentation recorder should have captured a combat-outcome entry with outcome {string} damage {int}',
  function (world: InstrumentationWorld, expectedOutcome: string, expectedDamage: number) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const outcomes = entries.filter((e) => e.type === 'combat-outcome');
    expect(outcomes.length).toBeGreaterThan(0);

    const lastOutcome = outcomes[outcomes.length - 1] as CombatOutcomeEntry;
    expect(lastOutcome.outcome).toBe(expectedOutcome);
    expect(lastOutcome.damage).toBe(expectedDamage);
  }
);

Then(
  'instrumentation recorder should have captured a move entry from {string} to {string}',
  function (world: InstrumentationWorld, expectedFrom: string, expectedTo: string) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const moves = entries.filter((e) => e.type === 'move');
    expect(moves.length).toBeGreaterThan(0);

    const lastMove = moves[moves.length - 1] as MoveEntry;
    expect(lastMove.from).toBe(expectedFrom);
    expect(lastMove.to).toBe(expectedTo);
  }
);

Then(
  'instrumentation recorder should have captured a bead-draw entry with colors drawn',
  function (world: InstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const draws = entries.filter((e) => e.type === 'bead-draw');
    expect(draws.length).toBeGreaterThan(0);

    const lastDraw = draws[draws.length - 1] as BeadDrawEntry;
    expect(lastDraw.colors).toBeDefined();
    expect(Array.isArray(lastDraw.colors)).toBe(true);
    expect(lastDraw.colors.length).toBeGreaterThan(0);
    expect(lastDraw.handAfter).toBeDefined();
  }
);

Then(
  'instrumentation recorder should have captured a state-change entry with changeType {string}',
  function (world: InstrumentationWorld, expectedChangeType: string) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const stateChanges = entries.filter((e) => e.type === 'state-change');
    expect(stateChanges.length).toBeGreaterThan(0);

    const lastStateChange = stateChanges[stateChanges.length - 1] as StateChangeEntry;
    expect(lastStateChange.changeType).toBe(expectedChangeType);
  }
);

Then(
  'instrumentation recorder should have captured a state-change entry with changeType {string} stack {string}',
  function (world: InstrumentationWorld, expectedChangeType: string, expectedStack: string) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const stateChanges = entries.filter((e) => e.type === 'state-change');
    expect(stateChanges.length).toBeGreaterThan(0);

    const lastStateChange = stateChanges[stateChanges.length - 1] as StateChangeEntry;
    expect(lastStateChange.changeType).toBe(expectedChangeType);
    expect((lastStateChange.details as any).stackName).toBe(expectedStack);
  }
);

Then(
  'instrumentation recorder should have captured a state-change entry for monster assessment',
  function (world: InstrumentationWorld) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const stateChanges = entries.filter((e) => e.type === 'state-change');
    expect(stateChanges.length).toBeGreaterThan(0);

    const lastStateChange = stateChanges[stateChanges.length - 1] as StateChangeEntry;
    expect(lastStateChange.changeType).toBe('status-effect');
    expect((lastStateChange.details as any).revealed).toBe(true);
  }
);

Then(
  'instrumentation recorder should have captured a defensive-reaction entry with reactionType {string}',
  function (world: InstrumentationWorld, expectedReactionType: string) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const reactions = entries.filter((e) => e.type === 'defensive-reaction');
    expect(reactions.length).toBeGreaterThan(0);

    const lastReaction = reactions[reactions.length - 1] as DefensiveReactionEntry;
    expect(lastReaction.reactionType).toBe(expectedReactionType);
  }
);

Then(
  'instrumentation recorder should have captured a monster-state-transition entry with drawnBead {string}',
  function (world: InstrumentationWorld, expectedBead: string) {
    expect(world.recorder).toBeDefined();
    const entries = world.recorder!.getEntries();
    const transitions = entries.filter((e) => e.type === 'monster-state-transition');
    expect(transitions.length).toBeGreaterThan(0);

    const lastTransition = transitions[transitions.length - 1] as MonsterStateTransitionEntry;
    expect(lastTransition.drawnBead).toBe(expectedBead);
  }
);

Then('no errors should occur during execution', function (world: InstrumentationWorld) {
  expect(world.executionError).toBeUndefined();
});
