import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { Action, type HydratedEffect } from '@src/models/Action';
import type { ActionDefinition } from '@src/types/ActionDefinition';
import type { ParameterPrompt } from '@src/types/ParameterPrompt';
import type { GameContext, EffectResult } from '@src/types/Effect';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { MoveEffect } from '@src/effects/MoveEffect';

interface ActionWorld extends QuickPickleWorld {
  actionDefinition?: ActionDefinition;
  action?: Action;
  collectedPrompts?: ParameterPrompt[];
  grid?: BattleGrid;
  entities?: Map<string, Entity>;
  gameContext?: GameContext;
  effectResult?: EffectResult;
}

/**
 * Helper to create a minimal ActionDefinition with given parameters.
 */
function createActionDefinition(params: Array<{ key: string; type: string }>): ActionDefinition {
  return {
    id: 'test-action',
    name: 'Test Action',
    cost: { time: 1 },
    parameters: params.map((p) => {
      if (p.type === 'tile') {
        return {
          type: 'tile' as const,
          key: p.key,
          prompt: `Select ${p.key}`,
        };
      } else if (p.type === 'entity') {
        return {
          type: 'entity' as const,
          key: p.key,
          prompt: `Select ${p.key}`,
          filter: 'any' as const,
        };
      } else if (p.type === 'option') {
        return {
          type: 'option' as const,
          key: p.key,
          prompt: `Select ${p.key}`,
          options: [],
        };
      }
      throw new Error(`Unknown parameter type: ${p.type}`);
    }),
    effects: [],
  };
}

// ===== Given Steps =====
// NOTE: 'an action definition with parameters:' is reused from action-resolution.steps.ts
// NOTE: 'an action definition with parameters: <empty>' is reused from action-resolution.steps.ts

Given('an action definition with no parameters', function (world: ActionWorld) {
  // Alias for the existing step
  world.actionDefinition = createActionDefinition([]);
});

Given('an action definition with parameters in order:', function (world: ActionWorld, table: any) {
  // This creates the parameters in the exact order from the table
  const params = table.hashes().map((row: any) => ({
    key: row.key,
    type: row.type,
  }));
  world.actionDefinition = createActionDefinition(params);
});

Given('an Action created from the definition', function (world: ActionWorld) {
  if (!world.actionDefinition) {
    world.actionDefinition = createActionDefinition([]);
  }

  // Create Action with the definition, empty effects, and a dummy contextFactory
  const dummyContextFactory = (_actorId: string): GameContext => ({
    grid: {} as any,
    getEntity: () => undefined,
    getBeadHand: () => undefined,
  });

  world.action = new Action(world.actionDefinition, [], dummyContextFactory);
});

// ===== When Steps =====

When('I iterate over the action parametrize generator', function (world: ActionWorld) {
  if (!world.action) {
    throw new Error('Action not initialized');
  }

  if (!world.collectedPrompts) {
    world.collectedPrompts = [];
  }

  // Call parametrize() generator and collect all prompts
  for (const prompt of world.action.parametrize()) {
    world.collectedPrompts.push(prompt);
  }
});

// ===== Then Steps =====

Then('I receive {int} prompts', function (world: ActionWorld, expectedCount: number) {
  expect(world.collectedPrompts).toBeDefined();
  expect(world.collectedPrompts!.length).toBe(expectedCount);
});

Then(
  'prompt {int} has key {string} and type {string}',
  function (world: ActionWorld, index: number, expectedKey: string, expectedType: string) {
    expect(world.collectedPrompts).toBeDefined();
    const prompt = world.collectedPrompts![index - 1];
    expect(prompt).toBeDefined();
    expect(prompt.key).toBe(expectedKey);
    expect(prompt.type).toBe(expectedType);
  }
);

Then(
  'prompt {int} has type {string}',
  function (world: ActionWorld, index: number, expectedType: string) {
    expect(world.collectedPrompts).toBeDefined();
    const prompt = world.collectedPrompts![index - 1];
    expect(prompt).toBeDefined();
    expect(prompt.type).toBe(expectedType);
  }
);

// ===== Step 3.3: applyEffects() Tests =====
// NOTE: 'a battle grid of size {int}x{int}' is reused from battle-grid.steps.ts
// NOTE: 'an entity {string} with {int} health registered at position {int},{int}' is reused from entity.steps.ts

Given(
  'a game context with the grid and actor {string}',
  function (world: ActionWorld, actorId: string) {
    if (!world.grid) {
      world.grid = new BattleGrid(9, 9);
    }
    if (!world.entities) {
      world.entities = new Map();
    }

    world.gameContext = {
      grid: world.grid,
      actorId,
      getEntity(id: string) {
        return world.entities?.get(id);
      },
      getBeadHand(_entityId: string) {
        return undefined;
      },
    };
  }
);

Given(
  'an action with a move effect to position {int},{int}',
  function (world: ActionWorld, x: number, y: number) {
    if (!world.gameContext) {
      throw new Error('GameContext not initialized');
    }

    // Create a hydrated MoveEffect
    const moveEffect: HydratedEffect = {
      id: 'move-effect-1',
      type: 'move',
      params: {
        destination: { x, y },
      },
      effect: new MoveEffect(),
    };

    // Create ActionDefinition
    const def: ActionDefinition = {
      id: 'test-move-action',
      name: 'Test Move Action',
      cost: { time: 1 },
      parameters: [],
      effects: [
        {
          id: 'move-effect-1',
          type: 'move',
          params: { destination: { x, y } },
        },
      ],
    };

    // Create contextFactory
    const contextFactory = (_actorId: string): GameContext => world.gameContext!;

    // Create Action with hydrated effects
    world.action = new Action(def, [moveEffect], contextFactory);
  }
);

When('I call applyEffects with empty params', function (world: ActionWorld) {
  if (!world.action) {
    throw new Error('Action not initialized');
  }

  if (!world.gameContext) {
    throw new Error('GameContext not initialized');
  }

  // Call applyEffects with empty params
  const params = new Map<string, unknown>();
  world.effectResult = world.action.applyEffects(params, world.gameContext);
});

Then('the effect result is successful', function (world: ActionWorld) {
  expect(world.effectResult).toBeDefined();
  expect(world.effectResult!.success).toBe(true);
});

Then('the effect result is not successful', function (world: ActionWorld) {
  expect(world.effectResult).toBeDefined();
  expect(world.effectResult!.success).toBe(false);
});

Then('the effect result contains animation events', function (world: ActionWorld) {
  expect(world.effectResult).toBeDefined();
  expect(world.effectResult!.events).toBeDefined();
  expect(world.effectResult!.events.length).toBeGreaterThan(0);
});

Then(
  'entity {string} is at position {int},{int}',
  function (world: ActionWorld, entityId: string, x: number, y: number) {
    expect(world.grid).toBeDefined();
    const pos = world.grid!.getPosition(entityId);
    expect(pos).not.toBeNull();
    expect(pos!.x).toBe(x);
    expect(pos!.y).toBe(y);
  }
);

// ===== Step 3.4: applyEffects() - effect chaining tests =====

Given(
  'an action with a move effect using parameter reference {string}',
  function (world: ActionWorld, paramRef: string) {
    if (!world.gameContext) {
      throw new Error('GameContext not initialized');
    }

    // Create a hydrated MoveEffect with a parameter reference instead of a fixed position
    const moveEffect: HydratedEffect = {
      id: 'move-effect-1',
      type: 'move',
      params: {
        destination: paramRef, // e.g., "$target"
      },
      effect: new MoveEffect(),
    };

    // Create ActionDefinition
    const def: ActionDefinition = {
      id: 'test-paramref-action',
      name: 'Test Param Ref Action',
      cost: { time: 1 },
      parameters: [],
      effects: [
        {
          id: 'move-effect-1',
          type: 'move',
          params: { destination: paramRef },
        },
      ],
    };

    // Create contextFactory
    const contextFactory = (_actorId: string): GameContext => world.gameContext!;

    // Create Action with hydrated effects
    world.action = new Action(def, [moveEffect], contextFactory);
  }
);

When('I call applyEffects with params:', function (world: ActionWorld, table: any) {
  if (!world.action) {
    throw new Error('Action not initialized');
  }

  if (!world.gameContext) {
    throw new Error('GameContext not initialized');
  }

  // Parse table rows into a Map
  const params = new Map<string, unknown>();
  const rows = table.hashes();

  for (const row of rows) {
    const key = row.key;
    const value = row.value;

    // Parse position strings like "5,5" into { x: 5, y: 5 }
    if (value.includes(',')) {
      const parts = value.split(',');
      const x = parseInt(parts[0], 10);
      const y = parseInt(parts[1], 10);
      params.set(key, { x, y });
    } else {
      params.set(key, value);
    }
  }

  world.effectResult = world.action.applyEffects(params, world.gameContext);
});

Given(
  'an action with two move effects where second uses {string}',
  function (world: ActionWorld, chainRef: string) {
    if (!world.gameContext) {
      throw new Error('GameContext not initialized');
    }

    // Effect 1: Move to position 5,5 (intermediate position)
    const moveEffect1: HydratedEffect = {
      id: 'move1',
      type: 'move',
      params: {
        destination: { x: 5, y: 5 },
      },
      effect: new MoveEffect(),
    };

    // Effect 2: Move using a reference to the first effect's destination
    // $move1.destination will resolve to { x: 5, y: 5 } from move1's result.data
    // This tests that the reference is correctly resolved from chainResults
    const moveEffect2: HydratedEffect = {
      id: 'move2',
      type: 'move',
      params: {
        destination: chainRef, // e.g., "$move1.destination" resolves to { x: 5, y: 5 }
      },
      effect: new MoveEffect(),
    };

    // Create ActionDefinition
    const def: ActionDefinition = {
      id: 'test-chain-action',
      name: 'Test Chain Action',
      cost: { time: 1 },
      parameters: [],
      effects: [
        {
          id: 'move1',
          type: 'move',
          params: { destination: { x: 5, y: 5 } },
        },
        {
          id: 'move2',
          type: 'move',
          params: { destination: chainRef },
        },
      ],
    };

    // Create contextFactory
    const contextFactory = (_actorId: string): GameContext => world.gameContext!;

    // Create Action with hydrated effects
    world.action = new Action(def, [moveEffect1, moveEffect2], contextFactory);
  }
);

// ===== Step 3.5: applyEffects() - early termination tests =====

Given('an action with two effects where first fails', function (world: ActionWorld) {
  if (!world.gameContext) {
    throw new Error('GameContext not initialized');
  }

  // Effect 1: Move to blocked position (4,4) where blocker is - will FAIL
  const moveEffect1: HydratedEffect = {
    id: 'move1',
    type: 'move',
    params: {
      destination: { x: 4, y: 4 }, // blocker is here
    },
    effect: new MoveEffect(),
  };

  // Effect 2: Move to 5,5 - should NOT execute because effect 1 fails
  const moveEffect2: HydratedEffect = {
    id: 'move2',
    type: 'move',
    params: {
      destination: { x: 5, y: 5 },
    },
    effect: new MoveEffect(),
  };

  // Create ActionDefinition
  const def: ActionDefinition = {
    id: 'test-early-termination-action',
    name: 'Test Early Termination Action',
    cost: { time: 1 },
    parameters: [],
    effects: [
      {
        id: 'move1',
        type: 'move',
        params: { destination: { x: 4, y: 4 } },
      },
      {
        id: 'move2',
        type: 'move',
        params: { destination: { x: 5, y: 5 } },
      },
    ],
  };

  // Create contextFactory
  const contextFactory = (_actorId: string): GameContext => world.gameContext!;

  // Create Action with hydrated effects
  world.action = new Action(def, [moveEffect1, moveEffect2], contextFactory);
});

Given(
  'an action with two successful move effects to {int},{int} then {int},{int}',
  function (world: ActionWorld, x1: number, y1: number, x2: number, y2: number) {
    if (!world.gameContext) {
      throw new Error('GameContext not initialized');
    }

    // Effect 1: Move to first position
    const moveEffect1: HydratedEffect = {
      id: 'move1',
      type: 'move',
      params: {
        destination: { x: x1, y: y1 },
      },
      effect: new MoveEffect(),
    };

    // Effect 2: Move to second position
    const moveEffect2: HydratedEffect = {
      id: 'move2',
      type: 'move',
      params: {
        destination: { x: x2, y: y2 },
      },
      effect: new MoveEffect(),
    };

    // Create ActionDefinition
    const def: ActionDefinition = {
      id: 'test-two-success-action',
      name: 'Test Two Success Action',
      cost: { time: 1 },
      parameters: [],
      effects: [
        {
          id: 'move1',
          type: 'move',
          params: { destination: { x: x1, y: y1 } },
        },
        {
          id: 'move2',
          type: 'move',
          params: { destination: { x: x2, y: y2 } },
        },
      ],
    };

    // Create contextFactory
    const contextFactory = (_actorId: string): GameContext => world.gameContext!;

    // Create Action with hydrated effects
    world.action = new Action(def, [moveEffect1, moveEffect2], contextFactory);
  }
);

Then(
  'the effect result contains {int} move events',
  function (world: ActionWorld, expectedCount: number) {
    expect(world.effectResult).toBeDefined();
    expect(world.effectResult!.events).toBeDefined();

    const moveEvents = world.effectResult!.events.filter((event) => event.type === 'move');
    expect(moveEvents).toHaveLength(expectedCount);
  }
);
