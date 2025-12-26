import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { BattleGrid, MoveResult } from '@src/state/BattleGrid';
import {
  MonsterEntity,
  MonsterAction,
  MonsterConfig,
  StateConfig,
} from '@src/entities/MonsterEntity';
import { Entity } from '@src/entities/Entity';
import type { BeadColor } from '@src/types/Beads';

interface MonsterEntityWorld extends QuickPickleWorld {
  grid?: BattleGrid;
  monsterEntity?: MonsterEntity;
  monsterConfig?: MonsterConfig;
  stateConfigs?: Map<string, StateConfig>;
  startState?: string;
  targetCharacter?: Entity;
  monsterMoveResult?: MoveResult;
  monsterAction?: MonsterAction;
  transitions?: Map<string, Map<BeadColor, string>>;
}

// Background

Given(
  'a monster {string} with {int} health at position {int},{int}',
  function (world: MonsterEntityWorld, id: string, health: number, x: number, y: number) {
    if (!world.grid) {
      world.grid = new BattleGrid(9, 9);
    }
    world.grid.register(id, x, y);

    // Create basic monster config (will be enhanced with beads/states if specified)
    world.monsterConfig = {
      id,
      maxHealth: health,
    };

    world.stateConfigs = new Map();
    world.transitions = new Map();
    world.startState = undefined;

    // Create monster with basic config
    world.monsterEntity = new MonsterEntity(id, health, world.grid);
  }
);

// Bead configuration

Given(
  'the monster has bead configuration: {int} red, {int} blue, {int} green',
  function (world: MonsterEntityWorld, red: number, blue: number, green: number) {
    world.monsterEntity!.initializeBeadBag({ red, blue, green, white: 0 });
  }
);

// State configuration

Given(
  'the monster has states: {word}, {word} with start state {string}',
  function (world: MonsterEntityWorld, state1: string, state2: string, startState: string) {
    // Initialize state configs
    world.stateConfigs!.set(state1, {
      name: state1,
      damage: 0,
      wheel_cost: 2,
      range: 1,
      transitions: {},
    });
    world.stateConfigs!.set(state2, {
      name: state2,
      damage: 1,
      wheel_cost: 2,
      range: 1,
      transitions: {},
    });
    world.startState = startState;
  }
);

Given(
  'the monster has states: {word}, {word}, {word} with start state {string}',
  function (
    world: MonsterEntityWorld,
    state1: string,
    state2: string,
    state3: string,
    startState: string
  ) {
    // Create states with self-referencing transitions (stay in same state)
    const states: StateConfig[] = [
      {
        name: state1,
        damage: 0,
        wheel_cost: 2,
        range: 1,
        transitions: { red: state1, blue: state1, green: state1, white: state1 },
      },
      {
        name: state2,
        damage: 1,
        wheel_cost: 2,
        range: 1,
        transitions: { red: state2, blue: state2, green: state2, white: state2 },
      },
      {
        name: state3,
        damage: 0,
        wheel_cost: 1,
        range: 0,
        transitions: { red: state3, blue: state3, green: state3, white: state3 },
      },
    ];

    states.forEach((s) => world.stateConfigs!.set(s.name, s));
    world.startState = startState;

    // Initialize the state machine
    world.monsterEntity!.initializeStateMachine(states, startState);
  }
);

Given(
  'state {string} transitions to {string} on red bead',
  function (world: MonsterEntityWorld, fromState: string, toState: string) {
    // Update from state to have proper transitions
    const stateConfig = world.stateConfigs!.get(fromState)!;
    stateConfig.transitions = {
      red: toState,
      blue: fromState,
      green: fromState,
      white: fromState,
    };

    // Make sure target state also has transitions
    const targetConfig = world.stateConfigs!.get(toState)!;
    if (!targetConfig.transitions.red) {
      targetConfig.transitions = {
        red: toState,
        blue: toState,
        green: toState,
        white: toState,
      };
    }

    // Initialize state machine with all configs
    const configs = Array.from(world.stateConfigs!.values());
    world.monsterEntity!.initializeStateMachine(configs, world.startState!);
  }
);

Given(
  'the monster has attack state with range {int} and damage {int}',
  function (world: MonsterEntityWorld, range: number, damage: number) {
    const attackState: StateConfig = {
      name: 'attack',
      damage,
      wheel_cost: 2,
      range,
      transitions: { red: 'attack', blue: 'attack', green: 'attack', white: 'attack' },
    };
    world.stateConfigs!.set('attack', attackState);
    world.monsterEntity!.initializeStateMachine([attackState], 'attack');
    // Also initialize bead bag if not already done
    if (!world.monsterEntity!.hasBeadBag()) {
      world.monsterEntity!.initializeBeadBag({ red: 5, blue: 0, green: 0, white: 0 });
    }
  }
);

Given(
  'the monster has attack state with wheel cost {int}',
  function (world: MonsterEntityWorld, wheelCost: number) {
    const attackState: StateConfig = {
      name: 'attack',
      damage: 1,
      wheel_cost: wheelCost,
      range: 1,
      transitions: { red: 'attack', blue: 'attack', green: 'attack', white: 'attack' },
    };
    world.stateConfigs!.set('attack', attackState);
    world.monsterEntity!.initializeStateMachine([attackState], 'attack');
    world.monsterEntity!.initializeBeadBag({ red: 5, blue: 0, green: 0, white: 0 });
  }
);

// Target setup

Given(
  'a target character at position {int},{int}',
  function (world: MonsterEntityWorld, x: number, y: number) {
    const targetId = 'hero-0';
    world.grid!.register(targetId, x, y);
    world.targetCharacter = new Entity(targetId, 10, world.grid!);
  }
);

// Position assertions

Then(
  'the monster should be at grid position {int},{int}',
  function (world: MonsterEntityWorld, x: number, y: number) {
    const pos = world.monsterEntity!.getPosition();
    expect(pos).not.toBeNull();
    expect(pos!.x).toBe(x);
    expect(pos!.y).toBe(y);
  }
);

// Movement

When(
  'the monster moves to position {int},{int}',
  function (world: MonsterEntityWorld, x: number, y: number) {
    world.monsterMoveResult = world.monsterEntity!.moveTo({ x, y });
  }
);

Then('the monster move result should be successful', function (world: MonsterEntityWorld) {
  expect(world.monsterMoveResult).toBeDefined();
  expect(world.monsterMoveResult!.success).toBe(true);
});

// Health

When('the monster receives {int} damage', function (world: MonsterEntityWorld, damage: number) {
  world.monsterEntity!.receiveAttack(damage);
});

Then(
  'the monster should have {int} health remaining',
  function (world: MonsterEntityWorld, health: number) {
    expect(world.monsterEntity!.currentHealth).toBe(health);
  }
);

Then('the monster should not be alive', function (world: MonsterEntityWorld) {
  expect(world.monsterEntity!.isAlive()).toBe(false);
});

// Bead system

Then('the monster should have a bead bag', function (world: MonsterEntityWorld) {
  expect(world.monsterEntity!.hasBeadBag()).toBe(true);
});

Then('the monster should have a state machine', function (world: MonsterEntityWorld) {
  expect(world.monsterEntity!.hasStateMachine()).toBe(true);
});

// Turn decision

When('the monster decides its turn', function (world: MonsterEntityWorld) {
  const targets = world.targetCharacter ? [world.targetCharacter] : [];
  world.monsterAction = world.monsterEntity!.decideTurn(targets);
});

Then('the monster action should draw a bead', function (world: MonsterEntityWorld) {
  expect(world.monsterAction).toBeDefined();
  expect(world.monsterAction!.drawnBead).toBeDefined();
});

Then('the monster action should have transitioned state', function (world: MonsterEntityWorld) {
  expect(world.monsterAction).toBeDefined();
  expect(world.monsterAction!.state).toBeDefined();
});

Then(
  'the monster action type should be {string}',
  function (world: MonsterEntityWorld, actionType: string) {
    expect(world.monsterAction).toBeDefined();
    expect(world.monsterAction!.type).toBe(actionType);
  }
);

Then(
  'the monster action target should be the adjacent character',
  function (world: MonsterEntityWorld) {
    expect(world.monsterAction).toBeDefined();
    expect(world.monsterAction!.target).toBeDefined();
    expect(world.monsterAction!.target!.id).toBe('hero-0');
  }
);

Then(
  'the monster action wheel cost should be {int}',
  function (world: MonsterEntityWorld, cost: number) {
    expect(world.monsterAction).toBeDefined();
    expect(world.monsterAction!.wheelCost).toBe(cost);
  }
);
