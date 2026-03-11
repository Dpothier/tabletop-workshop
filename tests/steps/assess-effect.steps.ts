import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { EffectResult } from '@src/types/Effect';
import { MonsterEntity } from '@src/entities/MonsterEntity';

interface AssessEffectWorld extends QuickPickleWorld {
  assessEffectResult?: EffectResult;
  entities?: Map<string, any>;
  gameContext?: Record<string, any>;
  grid?: any;
}

// Setup: Actor assignment
Given('the actor is {string}', function (world: AssessEffectWorld, actorId: string) {
  if (!world.gameContext) {
    throw new Error('Game context not initialized. Run "Given a game context with the grid" first');
  }
  (world as any).gameContext.actorId = actorId;
});

// Setup: Monster with state machine that has cunning
Given(
  'a monster {string} with {int} health and cunning state machine at position {int},{int}',
  function (world: AssessEffectWorld, monsterId: string, health: number, x: number, y: number) {
    // Ensure entities map exists
    if (!(world as any).entities) {
      (world as any).entities = new Map();
    }

    // Ensure grid exists
    if (!(world as any).grid) {
      throw new Error(
        'Battle grid not initialized. Run "Given a battle grid of size {int}x{int}" first'
      );
    }

    // Register the monster on the grid
    (world as any).grid.register(monsterId, x, y);

    // Create MonsterEntity
    const monster = new MonsterEntity(monsterId, health, (world as any).grid);

    // Initialize bead bag
    monster.initializeBeadBag({ red: 2, blue: 2, green: 2, white: 2 });

    // Initialize state machine with states that have cunning property
    // Note: We extend the MonsterStateDefinition to include cunning
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

    monster.initializeStateMachine(states, 'idle');

    // Store the monster in the entities map
    (world as any).entities.set(monsterId, monster);
  }
);

// Setup: Monster that has already acted (has a last completed action with cunning)
Given(
  'the monster {string} has completed an action with cunning {int}',
  function (world: AssessEffectWorld, monsterId: string, cunning: number) {
    const monster = (world as any).entities?.get(monsterId) as MonsterEntity;
    if (!monster) {
      throw new Error(
        `Monster "${monsterId}" not found. Register it with the previous step first.`
      );
    }

    // Directly set the internal cunning value to avoid randomness from decideTurn
    (monster as any).lastCompletedStateCunning = cunning;
  }
);

// Setup: Entity has ponder stacks
Given(
  'the entity {string} has {int} ponder stacks',
  function (world: AssessEffectWorld, entityId: string, count: number) {
    const entity = (world as any).entities?.get(entityId);
    if (!entity) {
      throw new Error(`Entity "${entityId}" not found. Register it first.`);
    }

    entity.addStacks('ponder', count);
  }
);

// Execute assess effect
When(
  'I execute AssessEffect on target {string}',
  async function (world: AssessEffectWorld, targetId: string) {
    const { AssessEffect } = await import('@src/effects/AssessEffect');
    const effect = new AssessEffect();

    const result = effect.execute((world as any).gameContext!, { targetId }, {}, new Map());
    (world as any).assessEffectResult = result instanceof Promise ? await result : result;
  }
);

// Execute assess with ponder payment
When(
  'I execute AssessEffect on target {string} paying with ponder',
  async function (world: AssessEffectWorld, targetId: string) {
    const { AssessEffect } = await import('@src/effects/AssessEffect');
    const effect = new AssessEffect();

    const result = effect.execute(
      (world as any).gameContext!,
      { targetId, payWithPonder: true },
      {},
      new Map()
    );
    (world as any).assessEffectResult = result instanceof Promise ? await result : result;
  }
);

// Result assertions
Then('the assess effect result should be successful', function (world: AssessEffectWorld) {
  expect((world as any).assessEffectResult).toBeDefined();
  expect((world as any).assessEffectResult!.success).toBe(true);
});

Then('the assess effect result should fail', function (world: AssessEffectWorld) {
  expect((world as any).assessEffectResult).toBeDefined();
  expect((world as any).assessEffectResult!.success).toBe(false);
});

Then(
  'the assess effect reason should be {string}',
  function (world: AssessEffectWorld, expectedReason: string) {
    expect((world as any).assessEffectResult).toBeDefined();
    expect((world as any).assessEffectResult!.reason).toBe(expectedReason);
  }
);

Then(
  'the assess result should contain next action information',
  function (world: AssessEffectWorld) {
    expect((world as any).assessEffectResult).toBeDefined();
    expect((world as any).assessEffectResult!.data).toBeDefined();
    // The result should contain information about next action
    const data = (world as any).assessEffectResult!.data;
    expect(data.nextBead || data.nextAction || data.state).toBeDefined();
  }
);

Then(
  'the assess result additional cost should be {int}',
  function (world: AssessEffectWorld, expectedCost: number) {
    expect((world as any).assessEffectResult).toBeDefined();
    const additionalCost = (world as any).assessEffectResult!.data.additionalCost;
    expect(additionalCost).toBe(expectedCost);
  }
);

Then('the assess result should be public', function (world: AssessEffectWorld) {
  expect((world as any).assessEffectResult).toBeDefined();
  expect((world as any).assessEffectResult!.data.isPublic).toBe(true);
});

Then(
  'the entity {string} should have {int} ponder stacks remaining',
  function (world: AssessEffectWorld, entityId: string, expectedCount: number) {
    const entity = (world as any).entities?.get(entityId);
    expect(entity).toBeDefined();
    const currentStacks = entity.getStacks('ponder');
    expect(currentStacks).toBe(expectedCount);
  }
);

// YAML loading and cost assertion steps are shared from coordinate.steps.ts
