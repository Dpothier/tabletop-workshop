import { Given, When, Then } from 'quickpickle';
import { expect } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import {
  MonsterStateMachine,
  MonsterState,
  MonsterStateDefinition,
} from '@src/systems/MonsterStateMachine';
import type { BeadColor } from '@src/systems/BeadBag';

interface StateRow {
  name: string;
  damage?: number;
  wheel_cost?: number;
  range?: number;
  area?: string;
  transitions: Record<BeadColor, string>;
}

interface StateMachineWorld extends QuickPickleWorld {
  stateDefinitions?: StateRow[];
  startState?: string;
  stateMachine?: MonsterStateMachine;
  returnedState?: MonsterState;
  error?: Error;
}

function parseStateTable(dataTable: { rawTable: string[][] }): StateRow[] {
  const headers = dataTable.rawTable[0];
  const states: StateRow[] = [];

  for (let i = 1; i < dataTable.rawTable.length; i++) {
    const row = dataTable.rawTable[i];
    const state: StateRow = {
      name: '',
      transitions: { red: '', blue: '', green: '', white: '' },
    };

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const value = row[j];

      if (header === 'name') {
        state.name = value;
      } else if (header === 'damage' && value) {
        state.damage = parseInt(value);
      } else if (header === 'wheel_cost' && value) {
        state.wheel_cost = parseInt(value);
      } else if (header === 'range' && value) {
        state.range = parseInt(value);
      } else if (header === 'area' && value) {
        state.area = value;
      }
    }

    states.push(state);
  }

  return states;
}

function buildStateMachine(world: StateMachineWorld): void {
  const definitions: MonsterStateDefinition[] = world.stateDefinitions!.map((s) => ({
    name: s.name,
    damage: s.damage,
    wheel_cost: s.wheel_cost,
    range: s.range,
    area: s.area,
    transitions: s.transitions,
  }));
  world.stateMachine = new MonsterStateMachine(definitions, world.startState!);
}

Given(
  'a state machine with states:',
  function (world: StateMachineWorld, dataTable: { rawTable: string[][] }) {
    world.stateDefinitions = parseStateTable(dataTable);
  }
);

Given('start state is {string}', function (world: StateMachineWorld, startState: string) {
  world.startState = startState;
  buildStateMachine(world);
});

Given(
  'a state machine starting at {string} with states:',
  function (world: StateMachineWorld, startState: string, dataTable: { rawTable: string[][] }) {
    world.stateDefinitions = parseStateTable(dataTable);
    world.startState = startState;
    buildStateMachine(world);
  }
);

Given(
  'state {string} has transitions:',
  function (world: StateMachineWorld, stateName: string, dataTable: { rawTable: string[][] }) {
    const state = world.stateDefinitions!.find((s) => s.name === stateName);
    if (!state) {
      throw new Error(`State "${stateName}" not found`);
    }

    for (let i = 1; i < dataTable.rawTable.length; i++) {
      const row = dataTable.rawTable[i];
      const color = row[0] as BeadColor;
      const target = row[1];
      state.transitions[color] = target;
    }

    // Rebuild state machine with updated transitions
    buildStateMachine(world);
  }
);

Given(
  'all states have standard transitions:',
  function (world: StateMachineWorld, dataTable: { rawTable: string[][] }) {
    const transitions: Record<BeadColor, string> = { red: '', blue: '', green: '', white: '' };

    for (let i = 1; i < dataTable.rawTable.length; i++) {
      const row = dataTable.rawTable[i];
      const color = row[0] as BeadColor;
      const target = row[1];
      transitions[color] = target;
    }

    for (const state of world.stateDefinitions!) {
      state.transitions = { ...transitions };
    }

    // Rebuild state machine with updated transitions
    buildStateMachine(world);
  }
);

When('I transition with {string} bead', function (world: StateMachineWorld, color: string) {
  world.returnedState = world.stateMachine!.transition(color as BeadColor);
});

When('I try to transition with {string} bead', function (world: StateMachineWorld, color: string) {
  try {
    world.returnedState = world.stateMachine!.transition(color as BeadColor);
  } catch (e) {
    world.error = e as Error;
  }
});

When('I reset the state machine', function (world: StateMachineWorld) {
  world.stateMachine!.reset();
});

When(
  'I try to create a state machine with invalid start state {string}',
  function (world: StateMachineWorld, startState: string) {
    try {
      const definitions: MonsterStateDefinition[] = [
        {
          name: 'idle',
          transitions: { red: 'idle', blue: 'idle', green: 'idle', white: 'idle' },
        },
      ];
      world.stateMachine = new MonsterStateMachine(definitions, startState);
    } catch (e) {
      world.error = e as Error;
    }
  }
);

Then('current state should be {string}', function (world: StateMachineWorld, expected: string) {
  expect(world.stateMachine!.getCurrentStateName()).toBe(expected);
});

Then('current state damage should be {int}', function (world: StateMachineWorld, expected: number) {
  expect(world.stateMachine!.getCurrentState().damage).toBe(expected);
});

Then(
  'current state wheel_cost should be {int}',
  function (world: StateMachineWorld, expected: number) {
    expect(world.stateMachine!.getCurrentState().wheel_cost).toBe(expected);
  }
);

Then('current state range should be {int}', function (world: StateMachineWorld, expected: number) {
  expect(world.stateMachine!.getCurrentState().range).toBe(expected);
});

Then(
  'current state area should be {string}',
  function (world: StateMachineWorld, expected: string) {
    expect(world.stateMachine!.getCurrentState().area).toBe(expected);
  }
);

Then('current state should have no damage', function (world: StateMachineWorld) {
  expect(world.stateMachine!.getCurrentState().damage).toBeUndefined();
});

Then(
  'the returned state should have damage {int}',
  function (world: StateMachineWorld, expected: number) {
    expect(world.returnedState!.damage).toBe(expected);
  }
);

Then('a state machine error should be thrown', function (world: StateMachineWorld) {
  expect(world.error).toBeDefined();
});

Then(
  'a state machine error should be thrown with message containing {string}',
  function (world: StateMachineWorld, expectedSubstring: string) {
    expect(world.error).toBeDefined();
    expect(world.error!.message).toContain(expectedSubstring);
  }
);
