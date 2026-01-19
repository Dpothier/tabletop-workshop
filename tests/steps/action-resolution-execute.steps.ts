import { Given, When, Then } from 'quickpickle';
import { expect, vi } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { Action, type HydratedEffect } from '@src/models/Action';
import type { ActionDefinition } from '@src/types/ActionDefinition';
import type { GameContext, Effect, EffectResult } from '@src/types/Effect';
import type { BattleAdapter } from '@src/types/BattleAdapter';
import type { AnimationEvent } from '@src/types/AnimationEvent';
import type { TilePrompt, OptionPrompt, OptionChoice } from '@src/types/ParameterPrompt';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { ActionResolution } from '@src/systems/ActionResolution';

interface ActionResolutionExecuteWorld extends QuickPickleWorld {
  mockAdapter?: BattleAdapter;
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
  mockEffects?: Array<{ success: boolean; reason?: string; events: AnimationEvent[] }>;
  capturedParams?: Record<string, unknown>;
  promptTileReturnValues?: Array<{ x: number; y: number }>;
  promptOptionsReturnValues?: string[];
}

// ===== Background Steps =====
// NOTE: 'a battle grid of size {int}x{int}' is defined in battle-grid.steps.ts
// NOTE: 'a game context with the grid' is defined in effects.steps.ts
// NOTE: 'an entity {string} with {int} health registered at position {int},{int}' is defined in entity.steps.ts

Given('a mock BattleAdapter', function (world: ActionResolutionExecuteWorld) {
  world.mockAdapter = {
    promptTile: vi.fn(),
    promptOptions: vi.fn(),
    animate: vi.fn(async () => {}),
    log: vi.fn(),
  } as unknown as BattleAdapter;
});

// ===== Action Setup Steps =====

Given('an action with no parameters', function (world: ActionResolutionExecuteWorld) {
  const def: ActionDefinition = {
    id: 'test-action',
    name: 'Test Action',
    cost: { time: 1 },
    category: 'other',
    parameters: [],
    effects: [],
  };

  const contextFactory = (_actorId: string): GameContext => world.gameContext!;
  world.action = new Action(def, [], contextFactory);
});

Given(
  'the action has effects that return animation events',
  function (world: ActionResolutionExecuteWorld) {
    if (!world.action) {
      throw new Error('Action not initialized');
    }

    if (!world.gameContext) {
      throw new Error('GameContext not initialized');
    }

    // Create a mock effect that returns animation events
    const mockEffect: Effect = {
      execute(
        _context: GameContext,
        _params: Record<string, unknown>,
        _modifiers: Record<string, unknown>,
        _chainResults: Map<string, EffectResult>
      ): EffectResult {
        return {
          success: true,
          data: {},
          events: [
            {
              type: 'move',
              entityId: 'actor',
              from: { x: 5, y: 5 },
              to: { x: 6, y: 5 },
            } as AnimationEvent,
          ],
        };
      },
    };

    const hydrated: HydratedEffect = {
      id: 'mock-effect-1',
      type: 'mock',
      params: {},
      effect: mockEffect,
    };

    // Recreate action with the mock effect
    const def: ActionDefinition = {
      id: 'test-action',
      name: 'Test Action',
      cost: { time: 1 },
      category: 'other',
      parameters: [],
      effects: [
        {
          id: 'mock-effect-1',
          type: 'mock',
          params: {},
        },
      ],
    };

    const contextFactory = (_actorId: string): GameContext => world.gameContext!;
    world.action = new Action(def, [hydrated], contextFactory);
    world.mockEffects = [{ success: true, events: [{ type: 'move' } as AnimationEvent] }];
  }
);

Given(
  'the action has effects that return no events',
  function (world: ActionResolutionExecuteWorld) {
    if (!world.action) {
      throw new Error('Action not initialized');
    }

    if (!world.gameContext) {
      throw new Error('GameContext not initialized');
    }

    // Create a mock effect that returns no events
    const mockEffect: Effect = {
      execute(
        _context: GameContext,
        _params: Record<string, unknown>,
        _modifiers: Record<string, unknown>,
        _chainResults: Map<string, EffectResult>
      ): EffectResult {
        return {
          success: true,
          data: {},
          events: [],
        };
      },
    };

    const hydrated: HydratedEffect = {
      id: 'mock-effect-2',
      type: 'mock',
      params: {},
      effect: mockEffect,
    };

    // Recreate action with the mock effect
    const def: ActionDefinition = {
      id: 'test-action',
      name: 'Test Action',
      cost: { time: 1 },
      category: 'other',
      parameters: [],
      effects: [
        {
          id: 'mock-effect-2',
          type: 'mock',
          params: {},
        },
      ],
    };

    const contextFactory = (_actorId: string): GameContext => world.gameContext!;
    world.action = new Action(def, [hydrated], contextFactory);
    world.mockEffects = [{ success: true, events: [] }];
  }
);

Given(
  'the action has an effect that fails with reason {string}',
  function (world: ActionResolutionExecuteWorld, reason: string) {
    if (!world.action) {
      throw new Error('Action not initialized');
    }

    if (!world.gameContext) {
      throw new Error('GameContext not initialized');
    }

    // Create a mock effect that fails
    const mockEffect: Effect = {
      execute(
        _context: GameContext,
        _params: Record<string, unknown>,
        _modifiers: Record<string, unknown>,
        _chainResults: Map<string, EffectResult>
      ): EffectResult {
        return {
          success: false,
          reason,
          data: {},
          events: [],
        };
      },
    };

    const hydrated: HydratedEffect = {
      id: 'failing-effect',
      type: 'mock',
      params: {},
      effect: mockEffect,
    };

    // Recreate action with the failing effect
    const def: ActionDefinition = {
      id: 'test-action',
      name: 'Test Action',
      cost: { time: 1 },
      category: 'other',
      parameters: [],
      effects: [
        {
          id: 'failing-effect',
          type: 'mock',
          params: {},
        },
      ],
    };

    const contextFactory = (_actorId: string): GameContext => world.gameContext!;
    world.action = new Action(def, [hydrated], contextFactory);
    world.mockEffects = [{ success: false, reason, events: [] }];
  }
);

// ===== ActionResolution Setup =====

Given(
  'an ActionResolution with the action and adapter',
  function (world: ActionResolutionExecuteWorld) {
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
      'actor',
      world.gameContext,
      world.mockAdapter
    );
  }
);

// ===== Execute Tests =====

When('I call resolution.execute\\()', async function (world: ActionResolutionExecuteWorld) {
  if (!world.actionResolution) {
    throw new Error('ActionResolution not initialized');
  }

  // Call execute() and await the result
  try {
    world.executeResult = await world.actionResolution.execute();
  } catch (err) {
    // If not implemented yet, capture the error in a result object
    world.executeResult = {
      cancelled: false,
      success: false,
      reason: `Not implemented: ${err instanceof Error ? err.message : String(err)}`,
      events: [],
    };
  }
});

Then('adapter.animate is called with the events', function (world: ActionResolutionExecuteWorld) {
  expect(world.mockAdapter).toBeDefined();
  expect(world.mockAdapter?.animate).toBeDefined();

  // Verify animate was called
  expect(world.mockAdapter!.animate).toHaveBeenCalled();

  // Verify it was called with the animation events
  const calls = (world.mockAdapter!.animate as any).mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  expect(calls[0][0]).toBeDefined();
  expect(Array.isArray(calls[0][0])).toBe(true);
});

Then('adapter.animate is not called', function (world: ActionResolutionExecuteWorld) {
  expect(world.mockAdapter).toBeDefined();
  expect(world.mockAdapter?.animate).toBeDefined();

  // Verify animate was not called
  expect(world.mockAdapter!.animate).not.toHaveBeenCalled();
});

Then('result.cancelled is false', function (world: ActionResolutionExecuteWorld) {
  expect(world.executeResult).toBeDefined();
  expect(world.executeResult!.cancelled).toBe(false);
});

Then('result.cancelled is true', function (world: ActionResolutionExecuteWorld) {
  expect(world.executeResult).toBeDefined();
  expect(world.executeResult!.cancelled).toBe(true);
});

Then('result.success is true', function (world: ActionResolutionExecuteWorld) {
  expect(world.executeResult).toBeDefined();
  expect(world.executeResult!.success).toBe(true);
});

Then('result.success is false', function (world: ActionResolutionExecuteWorld) {
  expect(world.executeResult).toBeDefined();
  expect(world.executeResult!.success).toBe(false);
});

Then('result.events contains the animation events', function (world: ActionResolutionExecuteWorld) {
  expect(world.executeResult).toBeDefined();
  expect(world.executeResult!.events).toBeDefined();
  expect(world.executeResult!.events.length).toBeGreaterThan(0);
});

Then(
  'result.reason is {string}',
  function (world: ActionResolutionExecuteWorld, expectedReason: string) {
    expect(world.executeResult).toBeDefined();
    expect(world.executeResult!.reason).toBe(expectedReason);
  }
);

// ===== Tile Parameter Steps =====

Given(
  'an action with a tile parameter with range {int}',
  function (world: ActionResolutionExecuteWorld, range: number) {
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
      id: 'tile-effect',
      type: 'mock',
      params: { target: '$target' },
      effect: mockEffect,
    };

    const def: ActionDefinition = {
      id: 'tile-action',
      name: 'Tile Action',
      cost: { time: 1 },
      category: 'other',
      parameters: [
        {
          type: 'tile',
          key: 'target',
          prompt: 'Select target tile',
          range,
        } as TilePrompt,
      ],
      effects: [
        {
          id: 'tile-effect',
          type: 'mock',
          params: { target: '$target' },
        },
      ],
    };

    const contextFactory = (_actorId: string): GameContext => world.gameContext!;
    world.action = new Action(def, [hydrated], contextFactory);
  }
);

Given(
  'adapter.promptTile will return position {int},{int}',
  function (world: ActionResolutionExecuteWorld, x: number, y: number) {
    if (!world.mockAdapter) {
      throw new Error('BattleAdapter not initialized');
    }

    world.promptTileReturnValues = [{ x, y }];
    (world.mockAdapter.promptTile as any).mockResolvedValue({ x, y });
  }
);

Given('adapter.promptTile will return null', function (world: ActionResolutionExecuteWorld) {
  if (!world.mockAdapter) {
    throw new Error('BattleAdapter not initialized');
  }

  world.promptTileReturnValues = [];
  (world.mockAdapter.promptTile as any).mockResolvedValue(null);
});

Given(
  'an action with tile parameters {string} with range {int} and {string} with range {int}',
  function (
    world: ActionResolutionExecuteWorld,
    param1Key: string,
    range1: number,
    param2Key: string,
    range2: number
  ) {
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
      id: 'multi-tile-effect',
      type: 'mock',
      params: { [param1Key]: `$${param1Key}`, [param2Key]: `$${param2Key}` },
      effect: mockEffect,
    };

    const def: ActionDefinition = {
      id: 'multi-tile-action',
      name: 'Multi Tile Action',
      cost: { time: 1 },
      category: 'other',
      parameters: [
        {
          type: 'tile',
          key: param1Key,
          prompt: `Select ${param1Key}`,
          range: range1,
        } as TilePrompt,
        {
          type: 'tile',
          key: param2Key,
          prompt: `Select ${param2Key}`,
          range: range2,
        } as TilePrompt,
      ],
      effects: [
        {
          id: 'multi-tile-effect',
          type: 'mock',
          params: { [param1Key]: `$${param1Key}`, [param2Key]: `$${param2Key}` },
        },
      ],
    };

    const contextFactory = (_actorId: string): GameContext => world.gameContext!;
    world.action = new Action(def, [hydrated], contextFactory);
  }
);

Given(
  'adapter.promptTile will return position {int},{int} then position {int},{int}',
  function (world: ActionResolutionExecuteWorld, x1: number, y1: number, x2: number, y2: number) {
    if (!world.mockAdapter) {
      throw new Error('BattleAdapter not initialized');
    }

    world.promptTileReturnValues = [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ];

    let callCount = 0;
    (world.mockAdapter.promptTile as any).mockImplementation(async () => {
      const result = world.promptTileReturnValues![callCount];
      callCount++;
      return result;
    });
  }
);

Given(
  'adapter.promptTile will return position {int},{int} then null',
  function (world: ActionResolutionExecuteWorld, x: number, y: number) {
    if (!world.mockAdapter) {
      throw new Error('BattleAdapter not initialized');
    }

    world.promptTileReturnValues = [{ x, y }, null as any];

    let callCount = 0;
    (world.mockAdapter.promptTile as any).mockImplementation(async () => {
      const result = world.promptTileReturnValues![callCount];
      callCount++;
      return result;
    });
  }
);

Then(
  'adapter.promptTile is called with range {int}',
  function (world: ActionResolutionExecuteWorld, expectedRange: number) {
    expect(world.mockAdapter).toBeDefined();
    expect(world.mockAdapter?.promptTile).toBeDefined();

    // Verify promptTile was called
    expect(world.mockAdapter!.promptTile).toHaveBeenCalled();

    // Verify it was called with the expected range
    const calls = (world.mockAdapter!.promptTile as any).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0][0]).toEqual({ range: expectedRange });
  }
);

Then('adapter.promptTile is called twice', function (world: ActionResolutionExecuteWorld) {
  expect(world.mockAdapter).toBeDefined();
  expect(world.mockAdapter?.promptTile).toBeDefined();

  // Verify promptTile was called exactly twice
  expect(world.mockAdapter!.promptTile).toHaveBeenCalledTimes(2);
});

Then(
  'the effect receives target parameter as position {int},{int}',
  function (world: ActionResolutionExecuteWorld, x: number, y: number) {
    expect(world.capturedParams).toBeDefined();
    expect(world.capturedParams!.target).toBeDefined();

    const target = world.capturedParams!.target as { x: number; y: number };
    expect(target.x).toBe(x);
    expect(target.y).toBe(y);
  }
);

Then(
  'the effect receives {string} parameter as position {int},{int}',
  function (world: ActionResolutionExecuteWorld, paramKey: string, x: number, y: number) {
    expect(world.capturedParams).toBeDefined();
    expect(world.capturedParams![paramKey]).toBeDefined();

    const param = world.capturedParams![paramKey] as { x: number; y: number };
    expect(param.x).toBe(x);
    expect(param.y).toBe(y);
  }
);

// ===== Option Parameter Steps =====

Given('an action with an option parameter', function (world: ActionResolutionExecuteWorld) {
  if (!world.gameContext) {
    throw new Error('GameContext not initialized');
  }

  // Create a mock effect that captures received modifiers
  const capturedParams: Record<string, unknown> = {};
  world.capturedParams = capturedParams;

  const mockEffect: Effect = {
    execute(
      _context: GameContext,
      params: Record<string, unknown>,
      _modifiers: Record<string, unknown>,
      _chainResults: Map<string, EffectResult>
    ): EffectResult {
      // Capture params (which includes resolved option values)
      Object.assign(capturedParams, params);
      return {
        success: true,
        data: {},
        events: [],
      };
    },
  };

  const hydrated: HydratedEffect = {
    id: 'option-effect',
    type: 'mock',
    params: { modifiers: '$modifier' }, // Reference to collected option value
    effect: mockEffect,
  };

  // Create option choices
  const optionChoices: OptionChoice[] = [
    { id: 'power', label: 'Power' },
    { id: 'speed', label: 'Speed' },
  ];

  const def: ActionDefinition = {
    id: 'option-action',
    name: 'Option Action',
    cost: { time: 1 },
    category: 'other',
    parameters: [
      {
        type: 'option',
        key: 'modifier',
        prompt: 'Select a modifier',
        multiSelect: false,
        options: optionChoices,
      } as OptionPrompt,
    ],
    effects: [
      {
        id: 'option-effect',
        type: 'mock',
        params: { modifiers: '$modifier' },
      },
    ],
  };

  const contextFactory = (_actorId: string): GameContext => world.gameContext!;
  world.action = new Action(def, [hydrated], contextFactory);
});

Given(
  'adapter.promptOptions will return {string}',
  function (world: ActionResolutionExecuteWorld, option: string) {
    if (!world.mockAdapter) {
      throw new Error('BattleAdapter not initialized');
    }

    world.promptOptionsReturnValues = [option];
    (world.mockAdapter.promptOptions as any).mockResolvedValue([option]);
  }
);

Given('adapter.promptOptions will return null', function (world: ActionResolutionExecuteWorld) {
  if (!world.mockAdapter) {
    throw new Error('BattleAdapter not initialized');
  }

  world.promptOptionsReturnValues = [];
  (world.mockAdapter.promptOptions as any).mockResolvedValue(null);
});

Given(
  'an action with a multi-select option parameter',
  function (world: ActionResolutionExecuteWorld) {
    if (!world.gameContext) {
      throw new Error('GameContext not initialized');
    }

    // Create a mock effect that captures received params
    const capturedParams: Record<string, unknown> = {};
    world.capturedParams = capturedParams;

    const mockEffect: Effect = {
      execute(
        _context: GameContext,
        params: Record<string, unknown>,
        _modifiers: Record<string, unknown>,
        _chainResults: Map<string, EffectResult>
      ): EffectResult {
        // Capture params (which includes resolved option values)
        Object.assign(capturedParams, params);
        return {
          success: true,
          data: {},
          events: [],
        };
      },
    };

    const hydrated: HydratedEffect = {
      id: 'multi-option-effect',
      type: 'mock',
      params: { modifiers: '$modifiers' }, // Reference to collected option value
      effect: mockEffect,
    };

    // Create option choices
    const optionChoices: OptionChoice[] = [
      { id: 'power', label: 'Power' },
      { id: 'speed', label: 'Speed' },
      { id: 'defense', label: 'Defense' },
    ];

    const def: ActionDefinition = {
      id: 'multi-option-action',
      name: 'Multi Option Action',
      cost: { time: 1 },
      category: 'other',
      parameters: [
        {
          type: 'option',
          key: 'modifiers',
          prompt: 'Select modifiers',
          multiSelect: true,
          options: optionChoices,
        } as OptionPrompt,
      ],
      effects: [
        {
          id: 'multi-option-effect',
          type: 'mock',
          params: { modifiers: '$modifiers' },
        },
      ],
    };

    const contextFactory = (_actorId: string): GameContext => world.gameContext!;
    world.action = new Action(def, [hydrated], contextFactory);
  }
);

Given(
  'adapter.promptOptions will return {string} and {string}',
  function (world: ActionResolutionExecuteWorld, option1: string, option2: string) {
    if (!world.mockAdapter) {
      throw new Error('BattleAdapter not initialized');
    }

    world.promptOptionsReturnValues = [option1, option2];
    (world.mockAdapter.promptOptions as any).mockResolvedValue([option1, option2]);
  }
);

Then(
  'adapter.promptOptions is called with the prompt',
  function (world: ActionResolutionExecuteWorld) {
    expect(world.mockAdapter).toBeDefined();
    expect(world.mockAdapter?.promptOptions).toBeDefined();

    // Verify promptOptions was called
    expect(world.mockAdapter!.promptOptions).toHaveBeenCalled();

    // Verify it was called with an OptionPrompt
    const calls = (world.mockAdapter!.promptOptions as any).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0][0]).toBeDefined();

    const prompt = calls[0][0] as OptionPrompt;
    expect(prompt.type).toBe('option');
    expect(prompt.key).toBeDefined();
    expect(prompt.prompt).toBeDefined();
    expect(prompt.options).toBeDefined();
    expect(Array.isArray(prompt.options)).toBe(true);
  }
);

Then(
  'the effect receives {string} parameter including {string}',
  function (world: ActionResolutionExecuteWorld, paramKey: string, value: string) {
    expect(world.capturedParams).toBeDefined();
    expect(world.capturedParams![paramKey]).toBeDefined();

    const param = world.capturedParams![paramKey];

    // Check if param is an array (for multi-select)
    if (Array.isArray(param)) {
      expect(param).toContain(value);
    } else {
      // For single select, param might be the value directly or wrapped
      expect(param).toEqual(value);
    }
  }
);

Then(
  'the effect receives {string} parameter including {string} and {string}',
  function (world: ActionResolutionExecuteWorld, paramKey: string, value1: string, value2: string) {
    expect(world.capturedParams).toBeDefined();
    expect(world.capturedParams![paramKey]).toBeDefined();

    const param = world.capturedParams![paramKey];

    // Check if param is an array
    expect(Array.isArray(param)).toBe(true);
    expect(param as string[]).toContain(value1);
    expect(param as string[]).toContain(value2);
  }
);
