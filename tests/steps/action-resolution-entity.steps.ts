import { Given, When, Then } from 'quickpickle';
import { expect, vi } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { Action, type HydratedEffect } from '@src/models/Action';
import type { ActionDefinition } from '@src/types/ActionDefinition';
import type { GameContext, Effect, EffectResult } from '@src/types/Effect';
import type { BattleAdapter } from '@src/types/BattleAdapter';
import type { AnimationEvent } from '@src/types/AnimationEvent';
import type { EntityPrompt, ParameterPrompt } from '@src/types/ParameterPrompt';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { ActionResolution } from '@src/systems/ActionResolution';
import { EffectRegistry } from '@src/systems/EffectRegistry';
import { AttackEffect } from '@src/effects/AttackEffect';
import { MoveEffect } from '@src/effects/MoveEffect';

interface ActionResolutionEntityWorld extends QuickPickleWorld {
  mockAdapter?: BattleAdapter & {
    promptEntity?: ReturnType<typeof vi.fn>;
  };
  grid?: BattleGrid;
  entities?: Map<string, Entity>;
  gameContext?: GameContext;
  action?: Action;
  actionResolution?: ActionResolution;
  executeResult?: {
    cancelled: boolean;
    success: boolean;
    reason?: string;
    events: AnimationEvent[];
  };
  capturedParams?: Record<string, unknown>;
  entityPromptCalls?: EntityPrompt[];
  entityPromptReturnValues?: Array<string | null>;
  lastEntityPromptCall?: EntityPrompt;
}

// ===== Background Steps =====
// NOTE: 'a battle grid of size {int}x{int}' is defined in battle-grid.steps.ts
// NOTE: 'a game context with the grid' is defined in effects.steps.ts
// NOTE: 'an effect registry' is defined in effects.steps.ts

Given('a mock BattleAdapter with entity prompt support', function (world: ActionResolutionEntityWorld) {
  world.mockAdapter = {
    promptTile: vi.fn(),
    promptOptions: vi.fn(),
    promptEntity: vi.fn(),
    animate: vi.fn(async () => {}),
    log: vi.fn(),
    showPlayerTurn: vi.fn(),
    awaitPlayerAction: vi.fn(),
    transition: vi.fn(),
    delay: vi.fn(),
    notifyBeadsChanged: vi.fn(),
  } as unknown as BattleAdapter & { promptEntity?: ReturnType<typeof vi.fn> };

  world.entityPromptCalls = [];
  world.entityPromptReturnValues = [];
});

// ===== Entity Parameter Action Setup =====

Given(
  'an action with entity parameter {string} with filter {string}',
  function (world: ActionResolutionEntityWorld, paramKey: string, filter: string) {
    if (!world.gameContext) {
      throw new Error('GameContext not initialized');
    }

    // Create a mock effect that captures received parameters
    const capturedParams: Record<string, unknown> = {};
    world.capturedParams = capturedParams;

    const mockEffect: Effect = {
      execute(
        _context: GameContext,
        params: Record<string, unknown>,
        _modifiers: Record<string, unknown>,
        _chainResults: Map<string, EffectResult>
      ): EffectResult {
        // Capture all parameters
        Object.assign(capturedParams, params);
        return {
          success: true,
          data: {},
          events: [],
        };
      },
    };

    const hydrated: HydratedEffect = {
      id: 'entity-effect',
      type: 'mock',
      params: { target: `$${paramKey}` },
      effect: mockEffect,
    };

    const def: ActionDefinition = {
      id: 'entity-action',
      name: 'Entity Action',
      cost: { time: 1 },
      category: 'other',
      parameters: [
        {
          type: 'entity',
          key: paramKey,
          prompt: `Select ${paramKey}`,
          filter: filter as 'enemy' | 'ally' | 'any',
        } as EntityPrompt,
      ],
      effects: [
        {
          id: 'entity-effect',
          type: 'mock',
          params: { target: `$${paramKey}` },
        },
      ],
    };

    const contextFactory = (_actorId: string): GameContext => world.gameContext!;
    world.action = new Action(def, [hydrated], contextFactory);
  }
);

Given(
  'an action with entity parameter {string} with filter {string} and range {int}',
  function (world: ActionResolutionEntityWorld, paramKey: string, filter: string, range: number) {
    if (!world.gameContext) {
      throw new Error('GameContext not initialized');
    }

    // Create a mock effect that captures received parameters
    const capturedParams: Record<string, unknown> = {};
    world.capturedParams = capturedParams;

    const mockEffect: Effect = {
      execute(
        _context: GameContext,
        params: Record<string, unknown>,
        _modifiers: Record<string, unknown>,
        _chainResults: Map<string, EffectResult>
      ): EffectResult {
        // Capture all parameters
        Object.assign(capturedParams, params);
        return {
          success: true,
          data: {},
          events: [],
        };
      },
    };

    const hydrated: HydratedEffect = {
      id: 'entity-effect',
      type: 'mock',
      params: { target: `$${paramKey}` },
      effect: mockEffect,
    };

    const def: ActionDefinition = {
      id: 'entity-action',
      name: 'Entity Action',
      cost: { time: 1 },
      category: 'other',
      parameters: [
        {
          type: 'entity',
          key: paramKey,
          prompt: `Select ${paramKey}`,
          filter: filter as 'enemy' | 'ally' | 'any',
          range,
        } as EntityPrompt,
      ],
      effects: [
        {
          id: 'entity-effect',
          type: 'mock',
          params: { target: `$${paramKey}` },
        },
      ],
    };

    const contextFactory = (_actorId: string): GameContext => world.gameContext!;
    world.action = new Action(def, [hydrated], contextFactory);
  }
);

Given(
  'an action with two entity parameters:',
  function (world: ActionResolutionEntityWorld, table: any) {
    if (!world.gameContext) {
      throw new Error('GameContext not initialized');
    }

    // Create a mock effect that captures received parameters
    const capturedParams: Record<string, unknown> = {};
    world.capturedParams = capturedParams;

    const mockEffect: Effect = {
      execute(
        _context: GameContext,
        params: Record<string, unknown>,
        _modifiers: Record<string, unknown>,
        _chainResults: Map<string, EffectResult>
      ): EffectResult {
        // Capture all parameters
        Object.assign(capturedParams, params);
        return {
          success: true,
          data: {},
          events: [],
        };
      },
    };

    const hydrated: HydratedEffect = {
      id: 'multi-entity-effect',
      type: 'mock',
      params: {},
      effect: mockEffect,
    };

    const params = table.hashes();
    const paramDefs: ParameterPrompt[] = params.map((row: any) => ({
      type: 'entity',
      key: row.key,
      prompt: `Select ${row.key}`,
      optional: false,
      filter: row.filter as 'enemy' | 'ally' | 'any',
    }));

    const def: ActionDefinition = {
      id: 'multi-entity-action',
      name: 'Multi Entity Action',
      cost: { time: 1 },
      category: 'other',
      parameters: paramDefs,
      effects: [
        {
          id: 'multi-entity-effect',
          type: 'mock',
          params: {},
        },
      ],
    };

    const contextFactory = (_actorId: string): GameContext => world.gameContext!;
    world.action = new Action(def, [hydrated], contextFactory);
  }
);

Given('the action has effects:', function (world: ActionResolutionEntityWorld, table: any) {
  if (!world.action) {
    throw new Error('Action must be set up before adding effects');
  }

  if (!world.gameContext) {
    throw new Error('GameContext must be set up before adding effects');
  }

  // Set up effect registry with real effects
  const effectRegistry = new EffectRegistry();
  effectRegistry.register('attack', new AttackEffect());
  effectRegistry.register('move', new MoveEffect());

  // Parse effects from table
  const effectDefs = table.hashes().map((row: any) => ({
    id: row.id,
    type: row.type,
    params: parseParamsString(row.params),
  }));

  // Hydrate effects
  const hydratedEffects = effectDefs.map((def: any) => {
    const effect = effectRegistry.get(def.type);
    if (!effect) {
      throw new Error(`Unknown effect type: ${def.type}`);
    }
    return {
      id: def.id,
      type: def.type,
      params: def.params,
      effect: effect,
    };
  });

  // Update action definition with effects
  const actionDef = {
    ...world.action!.definition,
    effects: effectDefs,
  };

  // Recreate action with hydrated effects
  const contextFactory = (_actorId: string): GameContext => world.gameContext!;
  world.action = new Action(actionDef, hydratedEffects, contextFactory);
});

// ===== Entity Setup Steps =====

Given(
  'hero {string} at position {int},{int}',
  function (world: ActionResolutionEntityWorld, heroId: string, x: number, y: number) {
    if (!world.entities) {
      world.entities = new Map();
    }

    const hero = new Entity(heroId, 10, world.grid!);
    if (world.grid) {
      world.grid.register(heroId, x, y);
    }
    world.entities.set(heroId, hero);
  }
);

Given(
  'hero {string} with {int} health at position {int},{int}',
  function (world: ActionResolutionEntityWorld, heroId: string, health: number, x: number, y: number) {
    if (!world.entities) {
      world.entities = new Map();
    }

    const hero = new Entity(heroId, health, world.grid!);
    if (world.grid) {
      world.grid.register(heroId, x, y);
    }
    world.entities.set(heroId, hero);
  }
);

Given(
  'monster {string} at position {int},{int}',
  function (world: ActionResolutionEntityWorld, monsterId: string, x: number, y: number) {
    if (!world.entities) {
      world.entities = new Map();
    }

    const monster = new Entity(monsterId, 10, world.grid!);
    if (world.grid) {
      world.grid.register(monsterId, x, y);
    }
    world.entities.set(monsterId, monster);
  }
);

Given(
  'monster {string} with {int} health at position {int},{int}',
  function (world: ActionResolutionEntityWorld, monsterId: string, health: number, x: number, y: number) {
    if (!world.entities) {
      world.entities = new Map();
    }

    const monster = new Entity(monsterId, health, world.grid!);
    if (world.grid) {
      world.grid.register(monsterId, x, y);
    }
    world.entities.set(monsterId, monster);
  }
);

Given(
  'hero {string} at position {int},{int} and hero {string} at position {int},{int}',
  function (
    world: ActionResolutionEntityWorld,
    hero1Id: string,
    x1: number,
    y1: number,
    hero2Id: string,
    x2: number,
    y2: number
  ) {
    if (!world.entities) {
      world.entities = new Map();
    }

    const hero1 = new Entity(hero1Id, 10, world.grid!);
    if (world.grid) {
      world.grid.register(hero1Id, x1, y1);
    }
    world.entities.set(hero1Id, hero1);

    const hero2 = new Entity(hero2Id, 10, world.grid!);
    if (world.grid) {
      world.grid.register(hero2Id, x2, y2);
    }
    world.entities.set(hero2Id, hero2);
  }
);

// ===== Adapter Mock Setup =====

Given(
  'adapter.promptEntity will return entity {string} when prompted',
  function (world: ActionResolutionEntityWorld, entityId: string) {
    if (!world.mockAdapter || !world.mockAdapter.promptEntity) {
      throw new Error('BattleAdapter not initialized');
    }

    world.entityPromptReturnValues = [entityId];
    (world.mockAdapter.promptEntity as any).mockResolvedValue(entityId);
  }
);

Given(
  'adapter.promptEntity will return null when prompted for entity',
  function (world: ActionResolutionEntityWorld) {
    if (!world.mockAdapter || !world.mockAdapter.promptEntity) {
      throw new Error('BattleAdapter not initialized');
    }

    world.entityPromptReturnValues = [];
    (world.mockAdapter.promptEntity as any).mockResolvedValue(null);
  }
);

Given(
  'adapter.promptEntity will return entity {string} then entity {string} when prompted',
  function (world: ActionResolutionEntityWorld, entityId1: string, entityId2: string) {
    if (!world.mockAdapter || !world.mockAdapter.promptEntity) {
      throw new Error('BattleAdapter not initialized');
    }

    world.entityPromptReturnValues = [entityId1, entityId2];
    let callCount = 0;
    (world.mockAdapter.promptEntity as any).mockImplementation(async () => {
      const result = world.entityPromptReturnValues![callCount];
      callCount++;
      return result;
    });
  }
);

// ===== ActionResolution Setup and Execution =====

Given(
  'an ActionResolution with the action and adapter for entity testing',
  function (world: ActionResolutionEntityWorld) {
    if (!world.action) {
      throw new Error('Action not initialized');
    }

    if (!world.mockAdapter) {
      throw new Error('BattleAdapter not initialized');
    }

    if (!world.gameContext) {
      throw new Error('GameContext not initialized');
    }

    world.actionResolution = new ActionResolution(
      world.action,
      'hero-0',
      world.gameContext,
      world.mockAdapter
    );
  }
);

When('I execute the action resolution', async function (world: ActionResolutionEntityWorld) {
  // Set up game context if not already done
  if (!world.gameContext) {
    world.gameContext = {
      grid: world.grid || new BattleGrid(9, 9),
      actorId: 'hero-0',
      getEntity: (id: string) => world.entities?.get(id),
      getBeadHand: () => undefined as any,
    };
  }

  // Create ActionResolution if not already created
  if (!world.actionResolution) {
    if (!world.action) {
      throw new Error('Action not initialized');
    }

    if (!world.mockAdapter) {
      throw new Error('BattleAdapter not initialized');
    }

    world.actionResolution = new ActionResolution(
      world.action,
      'hero-0',
      world.gameContext,
      world.mockAdapter
    );
  }

  // Call execute() and await the result
  try {
    world.executeResult = await world.actionResolution.execute();
  } catch (err) {
    // If not implemented yet, capture the error in a result object
    world.executeResult = {
      cancelled: false,
      success: false,
      reason: `Error: ${err instanceof Error ? err.message : String(err)}`,
      events: [],
    };
  }
});

// ===== Assertion Steps =====

Then(
  'the adapter should have been prompted for entity selection',
  function (world: ActionResolutionEntityWorld) {
    expect(world.mockAdapter).toBeDefined();
    expect(world.mockAdapter?.promptEntity).toBeDefined();

    // Verify promptEntity was called
    expect(world.mockAdapter!.promptEntity).toHaveBeenCalled();
  }
);

Then('the prompt should have filter {string}', function (world: ActionResolutionEntityWorld, expectedFilter: string) {
  expect(world.mockAdapter).toBeDefined();
  expect(world.mockAdapter?.promptEntity).toBeDefined();

  // Get the last call to promptEntity
  const calls = (world.mockAdapter!.promptEntity as any).mock.calls;
  expect(calls.length).toBeGreaterThan(0);

  const lastCall = calls[calls.length - 1];
  const prompt = lastCall[0] as EntityPrompt;

  expect(prompt).toBeDefined();
  expect(prompt.filter).toBe(expectedFilter);
  world.lastEntityPromptCall = prompt;
});

Then(
  'adapter.promptEntity is called with filter {string} and range {int}',
  function (world: ActionResolutionEntityWorld, expectedFilter: string, expectedRange: number) {
    expect(world.mockAdapter).toBeDefined();
    expect(world.mockAdapter?.promptEntity).toBeDefined();

    // Verify promptEntity was called
    expect(world.mockAdapter!.promptEntity).toHaveBeenCalled();

    // Get the last call to promptEntity
    const calls = (world.mockAdapter!.promptEntity as any).mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    const lastCall = calls[calls.length - 1];
    const prompt = lastCall[0] as EntityPrompt;

    expect(prompt).toBeDefined();
    expect(prompt.filter).toBe(expectedFilter);
    expect(prompt.range).toBe(expectedRange);
    world.lastEntityPromptCall = prompt;
  }
);

Then('the prompt should have range {int}', function (world: ActionResolutionEntityWorld, expectedRange: number) {
  // If lastEntityPromptCall isn't set, get it from the mock
  if (!world.lastEntityPromptCall && world.mockAdapter?.promptEntity) {
    const calls = (world.mockAdapter.promptEntity as any).mock?.calls;
    if (calls && calls.length > 0) {
      world.lastEntityPromptCall = calls[calls.length - 1][0] as EntityPrompt;
    }
  }
  expect(world.lastEntityPromptCall, 'Entity prompt should have been captured').toBeDefined();
  expect(world.lastEntityPromptCall!.range).toBe(expectedRange);
});

Then('adapter.promptEntity is called twice', function (world: ActionResolutionEntityWorld) {
  expect(world.mockAdapter).toBeDefined();
  expect(world.mockAdapter?.promptEntity).toBeDefined();

  // Verify promptEntity was called exactly twice
  expect(world.mockAdapter!.promptEntity).toHaveBeenCalledTimes(2);
});

Then(
  'the effect receives target parameter as entity {string}',
  function (world: ActionResolutionEntityWorld, expectedEntityId: string) {
    expect(world.capturedParams).toBeDefined();
    expect(world.capturedParams!.target).toBeDefined();
    expect(world.capturedParams!.target).toBe(expectedEntityId);
  }
);


Then(
  'entity {string} has {int} health remaining',
  function (world: ActionResolutionEntityWorld, entityId: string, expectedHealth: number) {
    expect(world.entities).toBeDefined();
    const entity = world.entities!.get(entityId);
    expect(entity, `Entity ${entityId} should exist`).toBeDefined();
    expect(entity!.currentHealth).toBe(expectedHealth);
  }
);

function parseParamsString(paramsStr: string): Record<string, any> {
  const params: Record<string, any> = {};
  if (!paramsStr) return params;

  // Parse comma-separated key: value pairs
  const pairs = paramsStr.split(',').map((s) => s.trim());
  for (const pair of pairs) {
    const [key, value] = pair.split(':').map((s) => s.trim());
    if (key && value !== undefined) {
      // Check if value is a number
      const numValue = Number(value);
      params[key] = isNaN(numValue) ? value : numValue;
    }
  }
  return params;
}
