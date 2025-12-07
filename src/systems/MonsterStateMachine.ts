import type { BeadColor } from '@src/systems/BeadBag';

/**
 * Represents a monster state with attack properties and transitions.
 */
export interface MonsterState {
  readonly name: string;
  readonly damage?: number;
  readonly wheel_cost?: number;
  readonly range?: number;
  readonly area?: string;
  readonly transitions: Record<BeadColor, string>;
}

/**
 * Definition for constructing a monster state.
 */
export interface MonsterStateDefinition {
  name: string;
  damage?: number;
  wheel_cost?: number;
  range?: number;
  area?: string;
  transitions: Record<string, string>;
}

/**
 * Monster State Machine System
 *
 * Tracks monster state and handles transitions based on bead colors.
 * Each state can have attack properties (damage, range, wheel_cost, area)
 * and defines transitions to other states based on drawn bead colors.
 */
export class MonsterStateMachine {
  private readonly states: Map<string, MonsterState>;
  private readonly startStateName: string;
  private currentStateName: string;

  /**
   * Create a new monster state machine.
   * @param stateDefinitions - Array of state definitions
   * @param startState - Name of the initial state
   * @throws Error if start state is not found in definitions
   */
  constructor(stateDefinitions: MonsterStateDefinition[], startState: string) {
    this.states = new Map();

    for (const def of stateDefinitions) {
      const state: MonsterState = {
        name: def.name,
        damage: def.damage,
        wheel_cost: def.wheel_cost,
        range: def.range,
        area: def.area,
        transitions: {
          red: def.transitions.red || '',
          blue: def.transitions.blue || '',
          green: def.transitions.green || '',
          white: def.transitions.white || '',
        },
      };
      this.states.set(def.name, state);
    }

    if (!this.states.has(startState)) {
      throw new Error(`Invalid start state: "${startState}" not found in state definitions`);
    }

    this.startStateName = startState;
    this.currentStateName = startState;
  }

  /**
   * Get the current state.
   * @returns Current monster state
   */
  getCurrentState(): MonsterState {
    return this.states.get(this.currentStateName)!;
  }

  /**
   * Get the name of the current state.
   * @returns Current state name
   */
  getCurrentStateName(): string {
    return this.currentStateName;
  }

  /**
   * Transition to a new state based on a bead color.
   * @param color - The bead color that was drawn
   * @returns The new state after transition
   * @throws Error if no transition exists for the given color
   */
  transition(color: BeadColor): MonsterState {
    const currentState = this.getCurrentState();
    const targetStateName = currentState.transitions[color];

    if (!targetStateName) {
      throw new Error(`State "${this.currentStateName}" has no transition for ${color} bead`);
    }

    if (!this.states.has(targetStateName)) {
      throw new Error(`Transition target "${targetStateName}" not found in state definitions`);
    }

    this.currentStateName = targetStateName;
    return this.getCurrentState();
  }

  /**
   * Reset the state machine to its start state.
   */
  reset(): void {
    this.currentStateName = this.startStateName;
  }
}
