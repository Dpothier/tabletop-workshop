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
  | RestEvent
  | DodgeEvent
  | GuardedEvent
  | HitEvent;

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

export interface DodgeEvent {
  type: 'dodge';
  entityId: string;
  attackerId: string;
  canReact: boolean;
}

export interface GuardedEvent {
  type: 'guarded';
  entityId: string;
  attackerId: string;
  blockedDamage: number;
}

export interface HitEvent {
  type: 'hit';
  entityId: string;
  attackerId: string;
  damage: number;
}
