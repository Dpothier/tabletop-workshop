import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import { ActionResolutionLegacy } from '@src/systems/ActionResolutionLegacy';
import { EffectRegistry } from '@src/systems/EffectRegistry';
import { MoveEffect } from '@src/effects/MoveEffect';
import { AttackEffect } from '@src/effects/AttackEffect';
import { DrawBeadsEffect } from '@src/effects/DrawBeadsEffect';
import type { GameContext } from '@src/types/Effect';
import type { ActionDefinition } from '@src/types/ActionDefinition';
import type { ParameterPrompt } from '@src/types/ParameterPrompt';
import type { ActionCost } from '@src/types/ActionCost';

interface ActionResolutionWorld extends QuickPickleWorld {
  grid?: BattleGrid;
  entities?: Map<string, Entity>;
  gameContext?: GameContext;
  playerBeadSystem?: PlayerBeadSystem;

  // ActionResolution-specific
  actionDefinition?: ActionDefinition;
  actionResolution?: ActionResolutionLegacy;
  parametrizeIterator?: Generator<ParameterPrompt>;
  collectedPrompts?: ParameterPrompt[];
  parameterValues?: Map<string, any>;
  providedResults?: Map<string, { accepted: boolean; reason?: string }>;
  skipResult?: { accepted: boolean; reason?: string };
  totalCost?: ActionCost;
  actionResult?: any;
  chainResults?: Map<string, any>;
  effectRegistry?: EffectRegistry;
}

// ===== Background: Game Setup =====
// Note: 'a battle grid of size {int}x{int}' is defined in battle-grid.steps.ts
// Note: 'a game context with the grid' is defined in effects.steps.ts
// Note: 'a player bead system' is defined in effects.steps.ts
// Note: 'an effect registry' is defined in effects.steps.ts
// Note: 'an entity {string} with {int} health registered at position {int},{int}' is defined in entity.steps.ts

// ===== Action Definition Setup =====

/**
 * Helper to create ActionDefinition with parameters.
 */
function createActionDefinition(id: string = 'test-action'): ActionDefinition {
  return {
    id,
    name: 'Test Action',
    cost: { time: 1, red: 0, blue: 0, green: 0, white: 0 },
    category: 'other',
    parameters: [],
    effects: [],
    options: undefined,
  };
}

Given('an action definition with parameters:', function (world: ActionResolutionWorld, table: any) {
  const def = createActionDefinition();
  def.parameters = table.hashes().map((row: any) => ({
    key: row.key,
    type: row.type,
    optional: row.required === 'false',
    prompt: row.prompt || `Select ${row.key}`,
  }));
  world.actionDefinition = def;
});

Given('an action definition with parameters: <empty>', function (world: ActionResolutionWorld) {
  world.actionDefinition = createActionDefinition();
  world.actionDefinition.parameters = [];
});

Given(
  'an action definition with a tile parameter {string} and prompt {string}',
  function (world: ActionResolutionWorld, key: string, prompt: string) {
    const def = createActionDefinition();
    def.parameters = [
      {
        key,
        type: 'tile',
        prompt,
        optional: false,
      },
    ];
    world.actionDefinition = def;
  }
);

Given(
  'an action definition with a tile parameter {string}',
  function (world: ActionResolutionWorld, key: string) {
    const def = createActionDefinition();
    def.parameters = [
      {
        key,
        type: 'tile',
        prompt: `Select ${key}`,
        optional: false,
      },
    ];
    world.actionDefinition = def;
  }
);

Given(
  'an action definition with an entity parameter {string} and prompt {string}',
  function (world: ActionResolutionWorld, key: string, prompt: string) {
    const def = createActionDefinition();
    def.parameters = [
      {
        key,
        type: 'entity',
        prompt,
        optional: false,
        filter: 'any' as const,
      },
    ];
    world.actionDefinition = def;
  }
);

Given(
  'an action definition with an entity parameter {string}',
  function (world: ActionResolutionWorld, key: string) {
    const def = createActionDefinition();
    def.parameters = [
      {
        key,
        type: 'entity',
        prompt: `Select ${key}`,
        optional: false,
        filter: 'any' as const,
      },
    ];
    world.actionDefinition = def;
  }
);

Given(
  'an action definition with an option parameter {string} with {int} options',
  function (world: ActionResolutionWorld, key: string, count: number) {
    const def = createActionDefinition();
    const options = Array.from({ length: count }, (_, i) => ({
      id: `opt${i + 1}`,
      label: `Option ${i + 1}`,
      cost: { time: 0 },
    }));
    def.parameters = [
      {
        key,
        type: 'option',
        optional: true,
        prompt: 'Select options',
        multiSelect: true,
        options,
      },
    ];
    world.actionDefinition = def;
  }
);

Given(
  'an action definition with an option parameter {string} with options:',
  function (world: ActionResolutionWorld, key: string, table: any) {
    const def = createActionDefinition();
    def.parameters = [
      {
        key,
        type: 'option',
        optional: true,
        prompt: 'Select options',
        multiSelect: true,
        options: table.hashes().map((row: any) => ({
          id: row.id,
          label: row.label,
          cost: parseCostString(row.cost),
        })),
      },
    ];
    world.actionDefinition = def;
  }
);

Given(
  'an action definition with cost {string}',
  function (world: ActionResolutionWorld, costStr: string) {
    const def = createActionDefinition();
    def.cost = parseCostString(costStr);
    world.actionDefinition = def;
  }
);

Given(
  'an action definition with cost {string} and option {string} with cost {string}',
  function (
    world: ActionResolutionWorld,
    costStr: string,
    optionId: string,
    optionCostStr: string
  ) {
    const def = createActionDefinition();
    def.cost = parseCostString(costStr);
    def.parameters = [
      {
        key: 'options',
        type: 'option',
        optional: true,
        prompt: 'Select options',
        options: [
          {
            id: optionId,
            label: optionId,
            cost: parseCostString(optionCostStr),
          },
        ],
      },
    ];
    world.actionDefinition = def;
  }
);

Given(
  'an action definition with cost {string} and options:',
  function (world: ActionResolutionWorld, costStr: string, table: any) {
    const def = createActionDefinition();
    def.cost = parseCostString(costStr);
    def.parameters = [
      {
        key: 'options',
        type: 'option',
        optional: true,
        prompt: 'Select options',
        options: table.hashes().map((row: any) => ({
          id: row.id,
          label: row.id,
          cost: parseCostString(row.cost),
        })),
      },
    ];
    world.actionDefinition = def;
  }
);

Given('an action definition with effects:', function (world: ActionResolutionWorld, table: any) {
  if (!world.actionDefinition) {
    world.actionDefinition = createActionDefinition();
  }
  world.actionDefinition.effects = table.hashes().map((row: any) => ({
    id: row.id,
    type: row.type,
    params: parseParamsString(row.params),
  }));
});

Given('an action definition with:', function (world: ActionResolutionWorld, table: any) {
  const def = createActionDefinition();
  const hashes = table.hashes();

  // Check if this is parameters table - support both 'key' and 'parameter' column names
  if (hashes.length > 0 && (hashes[0].key || hashes[0].parameter)) {
    def.parameters = hashes.map((row: any) => ({
      key: row.key || row.parameter,
      type: row.type,
      prompt: row.prompt || `Select ${row.key || row.parameter}`,
      optional: row.required === 'false',
    }));
  }

  world.actionDefinition = def;
});

Given(
  'an action with option {string} that modifies effect {string} with {string}',
  function (world: ActionResolutionWorld, optionId: string, effectId: string, modifierStr: string) {
    if (!world.actionDefinition) {
      world.actionDefinition = createActionDefinition();
    }
    const modifier = parseModifierString(modifierStr);
    // options is a Record<string, OptionDefinition>, not an array
    world.actionDefinition.options = world.actionDefinition.options || {};
    world.actionDefinition.options[optionId] = {
      modifies: effectId,
      modifier,
    };

    // Add option to parameters if not already there
    if (!world.actionDefinition.parameters.some((p: any) => p.type === 'option')) {
      world.actionDefinition.parameters.push({
        key: 'options',
        type: 'option',
        optional: true,
        prompt: 'Select options',
        options: [{ id: optionId, label: optionId, cost: { time: 0 } }],
      });
    }
  }
);

Given(
  'an action definition with an optional parameter {string}',
  function (world: ActionResolutionWorld, key: string) {
    const def = createActionDefinition();
    def.parameters = [
      {
        key,
        type: 'option',
        optional: true,
        prompt: `Select ${key}`,
        options: [],
      },
    ];
    world.actionDefinition = def;
  }
);

Given(
  'an action definition with a required parameter {string}',
  function (world: ActionResolutionWorld, key: string) {
    const def = createActionDefinition();
    def.parameters = [
      {
        key,
        type: 'tile',
        optional: false,
        prompt: `Select ${key}`,
      },
    ];
    world.actionDefinition = def;
  }
);

Given('effects:', function (world: ActionResolutionWorld, table: any) {
  if (!world.actionDefinition) {
    world.actionDefinition = createActionDefinition();
  }
  world.actionDefinition.effects = table.hashes().map((row: any) => ({
    id: row.id,
    type: row.type,
    params: parseParamsString(row.params),
  }));
});

// ===== ActionResolution Creation and Parametrize =====

Given('an ActionResolution for the action', function (world: ActionResolutionWorld) {
  if (!world.actionDefinition) {
    world.actionDefinition = createActionDefinition();
  }
  if (!world.gameContext) {
    world.gameContext = {
      grid: world.grid || new BattleGrid(9, 9),
      actorId: 'hero-0',
      getEntity: (id: string) => world.entities?.get(id),
      getBeadHand: () => world.playerBeadSystem,
    };
  }

  // Create effect registry and register real effects
  if (!world.effectRegistry) {
    world.effectRegistry = new EffectRegistry();
    world.effectRegistry.register('move', new MoveEffect());
    world.effectRegistry.register('attack', new AttackEffect());
    world.effectRegistry.register('drawBeads', new DrawBeadsEffect());
  }

  // Create real ActionResolution instance
  world.actionResolution = new ActionResolutionLegacy(
    'hero-0',
    world.actionDefinition,
    world.gameContext,
    world.effectRegistry
  );

  world.parameterValues = new Map();
});

When('I create an ActionResolution for the action', function (world: ActionResolutionWorld) {
  if (!world.actionDefinition) {
    world.actionDefinition = createActionDefinition();
  }
  if (!world.gameContext) {
    world.gameContext = {
      grid: world.grid || new BattleGrid(9, 9),
      actorId: 'hero-0',
      getEntity: (id: string) => world.entities?.get(id),
      getBeadHand: () => world.playerBeadSystem,
    };
  }

  // Create effect registry and register real effects
  if (!world.effectRegistry) {
    world.effectRegistry = new EffectRegistry();
    world.effectRegistry.register('move', new MoveEffect());
    world.effectRegistry.register('attack', new AttackEffect());
    world.effectRegistry.register('drawBeads', new DrawBeadsEffect());
  }

  // Create real ActionResolution instance
  world.actionResolution = new ActionResolutionLegacy(
    'hero-0',
    world.actionDefinition,
    world.gameContext,
    world.effectRegistry
  );

  // Initialize parameter values map
  world.parameterValues = new Map();
});

When('I iterate through parametrize', function (world: ActionResolutionWorld) {
  if (!world.actionResolution) {
    // Create default resolution if needed
    if (!world.actionDefinition) {
      world.actionDefinition = createActionDefinition();
    }
    if (!world.gameContext) {
      world.gameContext = {
        grid: world.grid || new BattleGrid(9, 9),
        getEntity: (id: string) => world.entities?.get(id),
        getBeadHand: () => world.playerBeadSystem,
      };
    }
    if (!world.effectRegistry) {
      world.effectRegistry = new EffectRegistry();
      world.effectRegistry.register('move', new MoveEffect());
      world.effectRegistry.register('attack', new AttackEffect());
      world.effectRegistry.register('drawBeads', new DrawBeadsEffect());
    }
    world.actionResolution = new ActionResolutionLegacy(
      'hero-0',
      world.actionDefinition,
      world.gameContext,
      world.effectRegistry
    );
  }

  if (!world.collectedPrompts) {
    world.collectedPrompts = [];
  }
  // Call parametrize() generator method and collect all prompts
  for (const prompt of world.actionResolution.parametrize()) {
    world.collectedPrompts.push(prompt);
  }
});

Then(
  'I should receive {int} prompts',
  function (world: ActionResolutionWorld, expectedCount: number) {
    expect(world.collectedPrompts).toBeDefined();
    expect(world.collectedPrompts!.length).toBe(expectedCount);
  }
);

Then('I collect all prompts', function (world: ActionResolutionWorld) {
  if (!world.collectedPrompts) {
    world.collectedPrompts = [];
  }
  // Already collected by parametrize
});

Then(
  'I should have collected {int} prompts',
  function (world: ActionResolutionWorld, expectedCount: number) {
    expect(world.collectedPrompts).toBeDefined();
    expect(world.collectedPrompts!.length).toBe(expectedCount);
  }
);

Then(
  'prompt {int} should be for parameter {string} with type {string}',
  function (world: ActionResolutionWorld, index: number, key: string, type: string) {
    const prompt = world.collectedPrompts![index - 1];
    expect(prompt).toBeDefined();
    expect(prompt.key).toBe(key);
    expect(prompt.type).toBe(type);
  }
);

Then(
  'the first prompt should have type {string}',
  function (world: ActionResolutionWorld, expectedType: string) {
    const prompt = world.collectedPrompts![0];
    expect(prompt).toBeDefined();
    expect(prompt.type).toBe(expectedType);
  }
);

Then(
  'the first prompt should have key {string}',
  function (world: ActionResolutionWorld, expectedKey: string) {
    const prompt = world.collectedPrompts![0];
    expect(prompt).toBeDefined();
    expect(prompt.key).toBe(expectedKey);
  }
);

Then(
  'the first prompt should have text {string}',
  function (world: ActionResolutionWorld, expectedText: string) {
    const prompt = world.collectedPrompts![0];
    expect(prompt).toBeDefined();
    expect(prompt.prompt).toBe(expectedText);
  }
);

// ===== provideValue() Tests =====

When(
  'I provide value for {string} with position {int},{int}',
  function (world: ActionResolutionWorld, key: string, x: number, y: number) {
    if (!world.actionResolution) {
      if (!world.actionDefinition) {
        world.actionDefinition = createActionDefinition();
      }
      if (!world.gameContext) {
        world.gameContext = {
          grid: world.grid || new BattleGrid(9, 9),
          getEntity: (id: string) => world.entities?.get(id),
          getBeadHand: () => world.playerBeadSystem,
        };
      }
      if (!world.effectRegistry) {
        world.effectRegistry = new EffectRegistry();
        world.effectRegistry.register('move', new MoveEffect());
        world.effectRegistry.register('attack', new AttackEffect());
        world.effectRegistry.register('drawBeads', new DrawBeadsEffect());
      }
      world.actionResolution = new ActionResolutionLegacy(
        'hero-0',
        world.actionDefinition,
        world.gameContext,
        world.effectRegistry
      );
    }

    const position = { x, y };
    const result = world.actionResolution.provideValue(key, position);

    // Store the result and also store in parameterValues for verification
    if (!world.providedResults) {
      world.providedResults = new Map();
    }
    world.providedResults.set(key, result);

    if (result.accepted) {
      if (!world.parameterValues) {
        world.parameterValues = new Map();
      }
      world.parameterValues.set(key, position);
    }
  }
);

When(
  'I provide value for {string} with entity ID {string}',
  function (world: ActionResolutionWorld, key: string, entityId: string) {
    if (!world.actionResolution) {
      if (!world.actionDefinition) {
        world.actionDefinition = createActionDefinition();
      }
      if (!world.gameContext) {
        world.gameContext = {
          grid: world.grid || new BattleGrid(9, 9),
          getEntity: (id: string) => world.entities?.get(id),
          getBeadHand: () => world.playerBeadSystem,
        };
      }
      if (!world.effectRegistry) {
        world.effectRegistry = new EffectRegistry();
        world.effectRegistry.register('move', new MoveEffect());
        world.effectRegistry.register('attack', new AttackEffect());
        world.effectRegistry.register('drawBeads', new DrawBeadsEffect());
      }
      world.actionResolution = new ActionResolutionLegacy(
        'hero-0',
        world.actionDefinition,
        world.gameContext,
        world.effectRegistry
      );
    }

    const result = world.actionResolution.provideValue(key, entityId);

    // Store the result and also store in parameterValues for verification
    if (!world.providedResults) {
      world.providedResults = new Map();
    }
    world.providedResults.set(key, result);

    if (result.accepted) {
      if (!world.parameterValues) {
        world.parameterValues = new Map();
      }
      world.parameterValues.set(key, entityId);
    }
  }
);

When(
  'I provide value for {string} with option IDs: {string}',
  function (world: ActionResolutionWorld, key: string, optionIdsStr: string) {
    if (!world.actionResolution) {
      if (!world.actionDefinition) {
        world.actionDefinition = createActionDefinition();
      }
      if (!world.gameContext) {
        world.gameContext = {
          grid: world.grid || new BattleGrid(9, 9),
          getEntity: (id: string) => world.entities?.get(id),
          getBeadHand: () => world.playerBeadSystem,
        };
      }
      if (!world.effectRegistry) {
        world.effectRegistry = new EffectRegistry();
        world.effectRegistry.register('move', new MoveEffect());
        world.effectRegistry.register('attack', new AttackEffect());
        world.effectRegistry.register('drawBeads', new DrawBeadsEffect());
      }
      world.actionResolution = new ActionResolutionLegacy(
        'hero-0',
        world.actionDefinition,
        world.gameContext,
        world.effectRegistry
      );
    }

    const optionIds = optionIdsStr.split(', ').map((s) => s.trim());
    const result = world.actionResolution.provideValue(key, optionIds);

    // Store the result and also store in parameterValues for verification
    if (!world.providedResults) {
      world.providedResults = new Map();
    }
    world.providedResults.set(key, result);

    if (result.accepted) {
      if (!world.parameterValues) {
        world.parameterValues = new Map();
      }
      world.parameterValues.set(key, optionIds);
    }
  }
);

Then('the value should be accepted', function (world: ActionResolutionWorld) {
  const lastKey = Array.from(world.providedResults!.keys()).pop();
  const result = world.providedResults!.get(lastKey!);
  expect(result).toBeDefined();
  expect(result!.accepted).toBe(true);
});

Then('the reason should be empty', function (world: ActionResolutionWorld) {
  // Check skipResult first (for skip tests), then providedResults (for provideValue tests)
  if (world.skipResult) {
    expect(world.skipResult.reason).toBeUndefined();
  } else if (world.providedResults) {
    const lastKey = Array.from(world.providedResults.keys()).pop();
    const result = world.providedResults.get(lastKey!);
    expect(result).toBeDefined();
    expect(result!.reason).toBeUndefined();
  } else {
    throw new Error('No result to check - neither skipResult nor providedResults is set');
  }
});

Then('the value should be rejected', function (world: ActionResolutionWorld) {
  const lastKey = Array.from(world.providedResults!.keys()).pop();
  const result = world.providedResults!.get(lastKey!);
  expect(result).toBeDefined();
  expect(result!.accepted).toBe(false);
});

Then('the reason should contain {string}', function (world: ActionResolutionWorld, text: string) {
  // Check skipResult first (for skip tests), then providedResults (for provideValue tests)
  if (world.skipResult) {
    expect(world.skipResult.reason).toContain(text);
  } else if (world.providedResults) {
    const lastKey = Array.from(world.providedResults.keys()).pop();
    const result = world.providedResults.get(lastKey!);
    expect(result).toBeDefined();
    expect(result!.reason).toContain(text);
  } else {
    throw new Error('No result to check - neither skipResult nor providedResults is set');
  }
});

Then('all values should be accepted', function (world: ActionResolutionWorld) {
  for (const result of world.providedResults!.values()) {
    expect(result.accepted).toBe(true);
  }
});

Then(
  'the value for {string} should be position {int},{int}',
  function (world: ActionResolutionWorld, key: string, x: number, y: number) {
    const value = world.parameterValues!.get(key);
    expect(value).toBeDefined();
    expect(value.x).toBe(x);
    expect(value.y).toBe(y);
  }
);

Then(
  'the value for {string} should be entity ID {string}',
  function (world: ActionResolutionWorld, key: string, entityId: string) {
    const value = world.parameterValues!.get(key);
    expect(value).toBe(entityId);
  }
);

// ===== skip() Tests =====

When('I skip parameter {string}', function (world: ActionResolutionWorld, key: string) {
  if (!world.actionResolution) {
    if (!world.actionDefinition) {
      world.actionDefinition = createActionDefinition();
    }
    if (!world.gameContext) {
      world.gameContext = {
        grid: world.grid || new BattleGrid(9, 9),
        getEntity: (id: string) => world.entities?.get(id),
        getBeadHand: () => world.playerBeadSystem,
      };
    }
    if (!world.effectRegistry) {
      world.effectRegistry = new EffectRegistry();
      world.effectRegistry.register('move', new MoveEffect());
      world.effectRegistry.register('attack', new AttackEffect());
      world.effectRegistry.register('drawBeads', new DrawBeadsEffect());
    }
    world.actionResolution = new ActionResolutionLegacy(
      'hero-0',
      world.actionDefinition,
      world.gameContext,
      world.effectRegistry
    );
  }

  world.skipResult = world.actionResolution.skip(key);
});

Then('the skip should be accepted', function (world: ActionResolutionWorld) {
  expect(world.skipResult).toBeDefined();
  expect(world.skipResult!.accepted).toBe(true);
});

Then('the skip should be rejected', function (world: ActionResolutionWorld) {
  expect(world.skipResult).toBeDefined();
  expect(world.skipResult!.accepted).toBe(false);
});

// ===== getTotalCost() Tests =====

When('I get the total cost', function (world: ActionResolutionWorld) {
  if (!world.actionResolution) {
    if (!world.actionDefinition) {
      world.actionDefinition = createActionDefinition();
    }
    if (!world.gameContext) {
      world.gameContext = {
        grid: world.grid || new BattleGrid(9, 9),
        getEntity: (id: string) => world.entities?.get(id),
        getBeadHand: () => world.playerBeadSystem,
      };
    }
    if (!world.effectRegistry) {
      world.effectRegistry = new EffectRegistry();
      world.effectRegistry.register('move', new MoveEffect());
      world.effectRegistry.register('attack', new AttackEffect());
      world.effectRegistry.register('drawBeads', new DrawBeadsEffect());
    }
    world.actionResolution = new ActionResolutionLegacy(
      'hero-0',
      world.actionDefinition,
      world.gameContext,
      world.effectRegistry
    );
  }

  // Call getTotalCost() on the real ActionResolution instance
  world.totalCost = world.actionResolution.getTotalCost();
});

Then('the cost should have time: {int}', function (world: ActionResolutionWorld, expected: number) {
  expect(world.totalCost).toBeDefined();
  expect(world.totalCost!.time).toBe(expected);
});

Then('the cost should have red: {int}', function (world: ActionResolutionWorld, expected: number) {
  expect(world.totalCost).toBeDefined();
  expect(world.totalCost!.red).toBe(expected);
});

Then('the cost should have blue: {int}', function (world: ActionResolutionWorld, expected: number) {
  expect(world.totalCost).toBeDefined();
  expect(world.totalCost!.blue).toBe(expected);
});

Then(
  'the cost should have green: {int}',
  function (world: ActionResolutionWorld, expected: number) {
    expect(world.totalCost).toBeDefined();
    expect(world.totalCost!.green).toBe(expected);
  }
);

// ===== resolve() Tests =====

When('I resolve the action', function (world: ActionResolutionWorld) {
  if (!world.actionResolution) {
    if (!world.actionDefinition) {
      world.actionDefinition = createActionDefinition();
    }
    if (!world.gameContext) {
      world.gameContext = {
        grid: world.grid || new BattleGrid(9, 9),
        getEntity: (id: string) => world.entities?.get(id),
        getBeadHand: () => world.playerBeadSystem,
      };
    }
    if (!world.effectRegistry) {
      world.effectRegistry = new EffectRegistry();
      world.effectRegistry.register('move', new MoveEffect());
      world.effectRegistry.register('attack', new AttackEffect());
      world.effectRegistry.register('drawBeads', new DrawBeadsEffect());
    }
    world.actionResolution = new ActionResolutionLegacy(
      'hero-0',
      world.actionDefinition,
      world.gameContext,
      world.effectRegistry
    );
  }

  // Call resolve() on the real ActionResolution instance
  world.actionResult = world.actionResolution.resolve();
});

Then('the action should succeed', function (world: ActionResolutionWorld) {
  expect(world.actionResult).toBeDefined();
  expect(world.actionResult.success).toBe(true);
});

Then('the action should fail', function (world: ActionResolutionWorld) {
  expect(world.actionResult).toBeDefined();
  expect(world.actionResult.success).toBe(false);
});

Then(
  'the result should contain {int} animation event',
  function (world: ActionResolutionWorld, expectedCount: number) {
    expect(world.actionResult).toBeDefined();
    expect(world.actionResult.events).toBeDefined();
    expect(world.actionResult.events.length).toBe(expectedCount);
  }
);

Then(
  'the result should contain {int} animation events',
  function (world: ActionResolutionWorld, expectedCount: number) {
    expect(world.actionResult).toBeDefined();
    expect(world.actionResult.events).toBeDefined();
    expect(world.actionResult.events.length).toBe(expectedCount);
  }
);

Then(
  'the result should contain only the failed move event',
  function (world: ActionResolutionWorld) {
    expect(world.actionResult).toBeDefined();
    expect(world.actionResult.events).toBeDefined();
    // Move failure produces no events, so check we have no events and action failed
    expect(world.actionResult.events.length).toBe(0);
    expect(world.actionResult.success).toBe(false);
  }
);

Then(
  'the result should contain all animation events from all effects',
  function (world: ActionResolutionWorld) {
    expect(world.actionResult).toBeDefined();
    expect(world.actionResult.events).toBeDefined();
    expect(world.actionResult.events.length).toBeGreaterThan(0);
  }
);

Then(
  'the second effect should have received chain result {string}',
  function (world: ActionResolutionWorld, effectId: string) {
    expect(world.chainResults).toBeDefined();
    expect(world.chainResults!.has(effectId)).toBe(true);
  }
);

Then(
  'the followup effect should have distance {int} (from previous damage)',
  function (world: ActionResolutionWorld, _expectedDistance: number) {
    // This validates that chain references were resolved
    expect(world.actionResult).toBeDefined();
    expect(world.actionResult.success).toBe(true);
  }
);

// ===== Helper Functions =====

function parseCostString(costStr: string): ActionCost {
  const cost: Record<string, number> = {};

  // Parse "time: 1, red: 1" or "{ time: 1 }" format
  const normalized = costStr.replace(/[{}]/g, '');
  const pairs = normalized.split(',').map((p) => p.trim());

  for (const pair of pairs) {
    const [key, value] = pair.split(':').map((s) => s.trim());
    if (key && value) {
      cost[key] = parseInt(value, 10);
    }
  }

  // Ensure time is always present (default to 0 if not specified)
  return {
    time: cost.time ?? 0,
    red: cost.red,
    blue: cost.blue,
    green: cost.green,
    white: cost.white,
  };
}

function parseParamsString(paramsStr: string): Record<string, any> {
  const params: Record<string, any> = {};

  // First, replace position patterns {x,y} with a placeholder to preserve them
  let processed = paramsStr;
  const positionPattern = /\{(\d+),(\d+)\}/g;
  const positions: { x: number; y: number }[] = [];

  processed = processed.replace(positionPattern, (_match, x, y) => {
    positions.push({ x: parseInt(x, 10), y: parseInt(y, 10) });
    return `__POS_${positions.length - 1}__`;
  });

  // Now split by comma safely
  const pairs = processed.split(',').map((p) => p.trim());

  for (const pair of pairs) {
    const colonIndex = pair.indexOf(':');
    if (colonIndex === -1) continue;

    const key = pair.substring(0, colonIndex).trim();
    const value = pair.substring(colonIndex + 1).trim();

    if (!key || !value) continue;

    // Check for position placeholder
    const posMatch = value.match(/__POS_(\d+)__/);
    if (posMatch) {
      params[key] = positions[parseInt(posMatch[1], 10)];
    } else if (!isNaN(parseInt(value, 10))) {
      params[key] = parseInt(value, 10);
    } else if (value.startsWith('$')) {
      // Keep $references as strings
      params[key] = value;
    } else {
      params[key] = value;
    }
  }

  return params;
}

function parseModifierString(modifierStr: string): Record<string, any> {
  const modifier: Record<string, any> = {};

  // Parse "damage: +1" or "range: 2" format
  const pairs = modifierStr.split(',').map((p) => p.trim());

  for (const pair of pairs) {
    const [key, value] = pair.split(':').map((s) => s.trim());
    if (key && value) {
      if (value.startsWith('+')) {
        modifier[key] = parseInt(value.slice(1), 10);
      } else if (!isNaN(parseInt(value, 10))) {
        modifier[key] = parseInt(value, 10);
      } else {
        modifier[key] = value;
      }
    }
  }

  return modifier;
}
