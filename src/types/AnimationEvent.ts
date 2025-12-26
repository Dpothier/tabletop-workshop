import type { BeadColor } from '@src/types/Beads';
import type { Position } from '@src/state/BattleGrid';

/**
 * Animation events describe what happened during a turn.
 * These are produced by state logic and consumed by the animation system.
 */
export type AnimationEvent =
  | MoveEvent
  | AttackEvent
  | DamageEvent
  | BeadDrawEvent
  | StateChangeEvent
  | RestEvent;

export interface MoveEvent {
  type: 'move';
  entityId: string;
  from: Position;
  to: Position;
}

export interface AttackEvent {
  type: 'attack';
  attackerId: string;
  targetId: string;
  damage: number;
}

export interface DamageEvent {
  type: 'damage';
  entityId: string;
  newHealth: number;
  maxHealth: number;
}

export interface BeadDrawEvent {
  type: 'beadDraw';
  color: BeadColor;
}

export interface StateChangeEvent {
  type: 'stateChange';
  fromState: string;
  toState: string;
}

export interface RestEvent {
  type: 'rest';
  entityId: string;
  beadsDrawn: BeadColor[];
}
