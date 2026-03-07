import { Given, When, Then } from 'quickpickle';
import { expect, vi } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { Action, type HydratedEffect } from '@src/models/Action';
import type { ActionDefinition, OptionDefinition } from '@src/types/ActionDefinition';
import type { GameContext, Effect, EffectResult } from '@src/types/Effect';
import type { ActionCost } from '@src/types/ActionCost';
import type { ActionResult } from '@src/types/ActionDefinition';
import type { BeadCounts } from '@src/types/Beads';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import type { BattleAdapter } from '@src/types/BattleAdapter';
import { BattleGrid } from '@src/state/BattleGrid';
import { ActionResolution } from '@src/systems/ActionResolution';

/**
 * PaymentOption represents an alternative payment choice for an action.
 * Defined locally for tests; will be moved to ActionCost in GREEN phase.
 */
interface PaymentOption {
  alternatives: Array<Partial<BeadCounts> | { prepStack: string }>;
}

/**
 * Mock effect that captures modifiers passed to execute()
 */
class CaptureModifiersEffect implements Effect {
  capturedModifiers: Record<string, unknown> = {};

  execute(
    _context: GameContext,
    _params: Record<string, unknown>,
    modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    this.capturedModifiers = { ...modifiers };
    return {
      success: true,
      data: {},
      events: [],
    };
  }
}

interface FrameworkPaymentWorld extends QuickPickleWorld {
  // Action and framework setup
  frameworkAction?: Action;
  frameworkActionId?: string;
  frameworkActionName?: string;
  frameworkActionCost?: ActionCost;
  frameworkActionPaymentOption?: PaymentOption;

  // Player setup
  frameworkPlayer?: PlayerBeadSystem;
  frameworkPlayerStacks?: { prepStack?: number; windup?: number };

  // Mock effects
  frameworkEffects?: Map<string, CaptureModifiersEffect>;

  // Options and selections
  frameworkSelectedOptions?: string[];
  frameworkActionOptions?: Record<string, OptionDefinition>;

  // Execution results (ActionResult from execute(), EffectResult from applyEffects())
  frameworkExecutionResult?: ActionResult | EffectResult;

  // Game context
  frameworkGameContext?: GameContext;
  frameworkAdapter?: BattleAdapter;
}

// ===== HELPER FUNCTIONS =====

/**
 * Create a mock effect that captures modifiers
 */
function createCaptureModifiersEffect(): CaptureModifiersEffect {
  return new CaptureModifiersEffect();
}

/**
 * Create a minimal GameContext for tests
 */
function createFrameworkGameContext(
  beadHand: PlayerBeadSystem,
  adapter: BattleAdapter
): GameContext {
  const grid = new BattleGrid(9, 9);
  return {
    grid,
    getEntity: () => undefined,
    getBeadHand: () => beadHand,
    adapter,
  };
}

/**
 * Create a mock BattleAdapter
 */
function createMockAdapter(): BattleAdapter {
  return {
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
  } as unknown as BattleAdapter;
}


// ===== BACKGROUND =====

Given('a framework action {string} costing {int} red bead(s)', function (
  world: FrameworkPaymentWorld,
  actionName: string,
  redCost: number
) {
  world.frameworkActionName = actionName;
  world.frameworkActionId = `framework-${actionName}`;
  world.frameworkActionCost = {
    time: 1,
    red: redCost,
    blue: 0,
    green: 0,
    white: 0,
  };

  const effects: HydratedEffect[] = [];
  const def: ActionDefinition = {
    id: world.frameworkActionId,
    name: actionName,
    category: 'other',
    cost: world.frameworkActionCost,
    parameters: [],
    effects: [],
  };

  const contextFactory = (_actorId: string): GameContext => world.frameworkGameContext!;
  world.frameworkAction = new Action(def, effects, contextFactory);
});

Given('a framework action {string} costing {int} blue bead(s)', function (
  world: FrameworkPaymentWorld,
  actionName: string,
  blueCost: number
) {
  world.frameworkActionName = actionName;
  world.frameworkActionId = `framework-${actionName}`;
  world.frameworkActionCost = {
    time: 1,
    red: 0,
    blue: blueCost,
    green: 0,
    white: 0,
  };

  const effects: HydratedEffect[] = [];
  const def: ActionDefinition = {
    id: world.frameworkActionId,
    name: actionName,
    category: 'other',
    cost: world.frameworkActionCost,
    parameters: [],
    effects: [],
  };

  const contextFactory = (_actorId: string): GameContext => world.frameworkGameContext!;
  world.frameworkAction = new Action(def, effects, contextFactory);
});

Given(
  'a framework action {string} costing {int} red and {int} green bead(s)',
  function (world: FrameworkPaymentWorld, actionName: string, redCost: number, greenCost: number) {
    world.frameworkActionName = actionName;
    world.frameworkActionId = `framework-${actionName}`;
    world.frameworkActionCost = {
      time: 1,
      red: redCost,
      blue: 0,
      green: greenCost,
      white: 0,
    };

    const effects: HydratedEffect[] = [];
    const def: ActionDefinition = {
      id: world.frameworkActionId,
      name: actionName,
      category: 'other',
      cost: world.frameworkActionCost,
      parameters: [],
      effects: [],
    };

    const contextFactory = (_actorId: string): GameContext => world.frameworkGameContext!;
    world.frameworkAction = new Action(def, effects, contextFactory);
  }
);

Given(
  'a framework player with red={int}, green={int}, blue={int}, white={int} beads in hand',
  function (world: FrameworkPaymentWorld, red: number, green: number, blue: number, white: number) {
    const counts: BeadCounts = { red, green, blue, white };
    world.frameworkPlayer = new PlayerBeadSystem(counts);
    world.frameworkPlayer.setHand(counts);
    world.frameworkAdapter = createMockAdapter();
    world.frameworkGameContext = createFrameworkGameContext(world.frameworkPlayer, world.frameworkAdapter);
    world.frameworkPlayerStacks = { prepStack: 0, windup: 0 };
  }
);

Given(
  'a framework action {string} with alternative payment: {int} red bead OR {int} windup stack',
  function (world: FrameworkPaymentWorld, actionName: string, redCost: number, _stackCost: number) {
    world.frameworkActionName = actionName;
    world.frameworkActionId = `framework-${actionName}`;
    world.frameworkActionCost = {
      time: 1,
      red: 0,
      blue: 0,
      green: 0,
      white: 0,
    };

    // Create payment option with alternatives
    world.frameworkActionPaymentOption = {
      alternatives: [{ red: redCost }, { prepStack: 'windup' }],
    };

    const effects: HydratedEffect[] = [];
    const def: ActionDefinition = {
      id: world.frameworkActionId,
      name: actionName,
      category: 'other',
      cost: world.frameworkActionCost,
      parameters: [],
      effects: [],
    };

    const contextFactory = (_actorId: string): GameContext => world.frameworkGameContext!;
    world.frameworkAction = new Action(def, effects, contextFactory);
  }
);

Given(
  'the framework player has {int} windup stacks',
  function (world: FrameworkPaymentWorld, count: number) {
    if (!world.frameworkPlayerStacks) {
      world.frameworkPlayerStacks = { prepStack: 0, windup: 0 };
    }
    world.frameworkPlayerStacks.windup = count;
  }
);

Given(
  'a framework action {string} with option {string} that modifies {string} with damage +{int}',
  function (
    world: FrameworkPaymentWorld,
    actionName: string,
    optionId: string,
    effectId: string,
    damageValue: number
  ) {
    world.frameworkActionName = actionName;
    world.frameworkActionId = `framework-${actionName}`;
    world.frameworkActionCost = {
      time: 1,
      red: 0,
      blue: 0,
      green: 0,
      white: 0,
    };

    // Setup action options
    world.frameworkActionOptions = {
      [optionId]: {
        modifies: effectId,
        modifier: { damage: damageValue },
      },
    };

    // Create mock effect that captures modifiers
    const mockEffect = createCaptureModifiersEffect();
    if (!world.frameworkEffects) {
      world.frameworkEffects = new Map();
    }
    world.frameworkEffects.set(effectId, mockEffect);

    const hydrated: HydratedEffect = {
      id: effectId,
      type: 'mock',
      params: {},
      effect: mockEffect,
    };

    const def: ActionDefinition = {
      id: world.frameworkActionId,
      name: actionName,
      category: 'other',
      cost: world.frameworkActionCost,
      parameters: [],
      effects: [
        {
          id: effectId,
          type: 'mock',
          params: {},
        },
      ],
      options: world.frameworkActionOptions,
    };

    // Set up default context for modifier tests
    if (!world.frameworkAdapter) {
      world.frameworkAdapter = createMockAdapter();
    }
    if (!world.frameworkGameContext) {
      const grid = new BattleGrid(9, 9);
      world.frameworkGameContext = {
        grid,
        getEntity: () => undefined,
        getBeadHand: () => undefined,
        adapter: world.frameworkAdapter,
      };
    }

    const contextFactory = (_actorId: string): GameContext => world.frameworkGameContext!;
    world.frameworkAction = new Action(def, [hydrated], contextFactory);
  }
);

Given(
  'a framework action {string} with options {string} adding {int} damage and {string} adding {int} agility',
  function (
    world: FrameworkPaymentWorld,
    actionName: string,
    option1Id: string,
    damageValue: number,
    option2Id: string,
    agilityValue: number
  ) {
    world.frameworkActionName = actionName;
    world.frameworkActionId = `framework-${actionName}`;
    world.frameworkActionCost = {
      time: 1,
      red: 0,
      blue: 0,
      green: 0,
      white: 0,
    };

    // Setup action options
    world.frameworkActionOptions = {
      [option1Id]: {
        modifies: 'attack-1',
        modifier: { damage: damageValue },
      },
      [option2Id]: {
        modifies: 'attack-1',
        modifier: { agility: agilityValue },
      },
    };

    // Create mock effect that captures modifiers
    const mockEffect = createCaptureModifiersEffect();
    if (!world.frameworkEffects) {
      world.frameworkEffects = new Map();
    }
    world.frameworkEffects.set('attack-1', mockEffect);

    const hydrated: HydratedEffect = {
      id: 'attack-1',
      type: 'mock',
      params: {},
      effect: mockEffect,
    };

    const def: ActionDefinition = {
      id: world.frameworkActionId,
      name: actionName,
      category: 'other',
      cost: world.frameworkActionCost,
      parameters: [],
      effects: [
        {
          id: 'attack-1',
          type: 'mock',
          params: {},
        },
      ],
      options: world.frameworkActionOptions,
    };

    // Set up default context for modifier tests
    if (!world.frameworkAdapter) {
      world.frameworkAdapter = createMockAdapter();
    }
    if (!world.frameworkGameContext) {
      const grid = new BattleGrid(9, 9);
      world.frameworkGameContext = {
        grid,
        getEntity: () => undefined,
        getBeadHand: () => undefined,
        adapter: world.frameworkAdapter,
      };
    }

    const contextFactory = (_actorId: string): GameContext => world.frameworkGameContext!;
    world.frameworkAction = new Action(def, [hydrated], contextFactory);
  }
);

Given(
  'the framework player selects option {string}',
  function (world: FrameworkPaymentWorld, optionId: string) {
    world.frameworkSelectedOptions = [optionId];
  }
);

Given(
  'the framework player selects options {string} and {string}',
  function (world: FrameworkPaymentWorld, option1: string, option2: string) {
    world.frameworkSelectedOptions = [option1, option2];
  }
);

Given('the framework player selects no options', function (world: FrameworkPaymentWorld) {
  world.frameworkSelectedOptions = [];
});

// ===== WHEN STEPS =====

When('the framework action executes successfully', async function (world: FrameworkPaymentWorld) {
  if (!world.frameworkAction || !world.frameworkPlayer || !world.frameworkGameContext) {
    throw new Error('Framework action, player, or context not initialized');
  }

  const resolution = new ActionResolution(
    world.frameworkAction,
    'framework-actor',
    world.frameworkGameContext,
    world.frameworkAdapter!
  );

  world.frameworkExecutionResult = await resolution.execute();
});

When('the framework action is attempted', async function (world: FrameworkPaymentWorld) {
  if (!world.frameworkAction || !world.frameworkPlayer || !world.frameworkGameContext) {
    throw new Error('Framework action, player, or context not initialized');
  }

  const resolution = new ActionResolution(
    world.frameworkAction,
    'framework-actor',
    world.frameworkGameContext,
    world.frameworkAdapter!
  );

  world.frameworkExecutionResult = await resolution.execute();
});

When('the framework action is attempted with bead payment', async function (world: FrameworkPaymentWorld) {
  if (!world.frameworkAction || !world.frameworkPlayer || !world.frameworkActionPaymentOption) {
    throw new Error('Framework action, player, or payment option not initialized');
  }

  // For alternative payment, try bead option first (first alternative)
  const beadOption = world.frameworkActionPaymentOption.alternatives[0] as BeadCounts;
  if (!beadOption || !beadOption.red) {
    throw new Error('Bead alternative payment not found');
  }

  const handCounts = world.frameworkPlayer.getHandCounts();
  const canAfford = handCounts.red >= beadOption.red;

  if (!canAfford) {
    world.frameworkExecutionResult = {
      cancelled: false,
      success: false,
      reason: 'insufficient beads',
      cost: world.frameworkActionCost!,
      events: [],
      data: {},
    };
    return;
  }

  // Spend the beads
  for (let i = 0; i < beadOption.red; i++) {
    if (!world.frameworkPlayer.spend('red')) {
      world.frameworkExecutionResult = {
        cancelled: false,
        success: false,
        reason: 'insufficient beads',
        cost: world.frameworkActionCost!,
        events: [],
        data: {},
      };
      return;
    }
  }

  world.frameworkExecutionResult = {
    cancelled: false,
    success: true,
    cost: world.frameworkActionCost!,
    events: [],
    data: {},
  };
});

When('the framework action is attempted with prep stack payment', async function (world: FrameworkPaymentWorld) {
  if (!world.frameworkAction || !world.frameworkPlayer || !world.frameworkActionPaymentOption) {
    throw new Error('Framework action, player, or payment option not initialized');
  }

  // For alternative payment, try stack option (second alternative)
  const stackOption = world.frameworkActionPaymentOption.alternatives[1] as { prepStack: string };
  if (!stackOption || !stackOption.prepStack) {
    throw new Error('Stack alternative payment not found');
  }

  const stacks = world.frameworkPlayerStacks || {};
  const stackKey = stackOption.prepStack as keyof typeof stacks;
  const stackCount = stacks[stackKey] || 0;

  if (stackCount < 1) {
    world.frameworkExecutionResult = {
      cancelled: false,
      success: false,
      reason: 'insufficient stacks',
      cost: world.frameworkActionCost!,
      events: [],
      data: {},
    };
    return;
  }

  // Consume the stack
  if (!world.frameworkPlayerStacks) {
    world.frameworkPlayerStacks = { prepStack: 0, windup: 0 };
  }
  world.frameworkPlayerStacks[stackKey]!--;

  world.frameworkExecutionResult = {
    cancelled: false,
    success: true,
    cost: world.frameworkActionCost!,
    events: [],
    data: {},
  };
});

When('the framework action applies effects', async function (world: FrameworkPaymentWorld) {
  if (!world.frameworkAction || !world.frameworkGameContext) {
    throw new Error('Framework action or game context not initialized');
  }

  // Build params with selected options
  const params = new Map<string, unknown>();
  if (world.frameworkSelectedOptions && world.frameworkSelectedOptions.length > 0) {
    params.set('options', world.frameworkSelectedOptions);
  }

  // Call applyEffects directly with params
  world.frameworkExecutionResult = await world.frameworkAction.applyEffects(
    params,
    world.frameworkGameContext
  );
});

// ===== THEN STEPS =====

Then(
  'the framework player should have {int} red beads remaining',
  function (world: FrameworkPaymentWorld, expected: number) {
    if (!world.frameworkPlayer) {
      throw new Error('Framework player not initialized');
    }
    const counts = world.frameworkPlayer.getHandCounts();
    expect(counts.red).toBe(expected);
  }
);

Then(
  'the framework player should have {int} green beads remaining',
  function (world: FrameworkPaymentWorld, expected: number) {
    if (!world.frameworkPlayer) {
      throw new Error('Framework player not initialized');
    }
    const counts = world.frameworkPlayer.getHandCounts();
    expect(counts.green).toBe(expected);
  }
);

Then(
  'the framework player should have {int} blue beads remaining',
  function (world: FrameworkPaymentWorld, expected: number) {
    if (!world.frameworkPlayer) {
      throw new Error('Framework player not initialized');
    }
    const counts = world.frameworkPlayer.getHandCounts();
    expect(counts.blue).toBe(expected);
  }
);

Then('the framework action should be rejected', function (world: FrameworkPaymentWorld) {
  expect(world.frameworkExecutionResult).toBeDefined();
  expect(world.frameworkExecutionResult!.success).toBe(false);
});

Then(
  'the framework rejection reason should be {string}',
  function (world: FrameworkPaymentWorld, expectedReason: string) {
    expect(world.frameworkExecutionResult).toBeDefined();
    expect(world.frameworkExecutionResult!.reason).toBe(expectedReason);
  }
);

Then('the framework action should succeed', function (world: FrameworkPaymentWorld) {
  expect(world.frameworkExecutionResult).toBeDefined();
  expect(world.frameworkExecutionResult!.success).toBe(true);
});

Then(
  'the framework player should have {int} windup stacks remaining',
  function (world: FrameworkPaymentWorld, expected: number) {
    if (!world.frameworkPlayerStacks) {
      throw new Error('Framework player stacks not initialized');
    }
    expect(world.frameworkPlayerStacks.windup).toBe(expected);
  }
);

Then(
  'the framework effect {string} should receive modifier damage={int}',
  function (world: FrameworkPaymentWorld, effectId: string, expectedDamage: number) {
    if (!world.frameworkEffects) {
      throw new Error('Framework effects not initialized');
    }
    const effect = world.frameworkEffects.get(effectId);
    expect(effect).toBeDefined();
    expect(effect!.capturedModifiers.damage).toBe(expectedDamage);
  }
);

Then(
  'the framework effect {string} should receive modifier agility={int}',
  function (world: FrameworkPaymentWorld, effectId: string, expectedAgility: number) {
    if (!world.frameworkEffects) {
      throw new Error('Framework effects not initialized');
    }
    const effect = world.frameworkEffects.get(effectId);
    expect(effect).toBeDefined();
    expect(effect!.capturedModifiers.agility).toBe(expectedAgility);
  }
);

Then(
  'the framework effect {string} should receive no modifiers',
  function (world: FrameworkPaymentWorld, effectId: string) {
    if (!world.frameworkEffects) {
      throw new Error('Framework effects not initialized');
    }
    const effect = world.frameworkEffects.get(effectId);
    expect(effect).toBeDefined();
    expect(Object.keys(effect!.capturedModifiers).length).toBe(0);
  }
);
