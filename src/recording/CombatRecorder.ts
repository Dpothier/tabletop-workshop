import type { BeadCounts } from '@src/types/Beads';

export interface TurnStartEntry {
  type: 'turn-start';
  seq: number;
  actorId: string;
  actorName: string;
  actorType: 'player' | 'monster';
  wheelPosition: number;
}

export interface ActionSelectedEntry {
  type: 'action-selected';
  seq: number;
  actorId: string;
  actorName: string;
  actionId: string;
  actionName: string;
  modifiers: string[];
  beadCost: number;
}

export interface BeadSpendEntry {
  type: 'bead-spend';
  seq: number;
  entityId: string;
  entityName: string;
  color: string;
  reason: 'action-cost' | 'defensive-reaction';
  handAfter: BeadCounts;
}

export interface BeadDrawEntry {
  type: 'bead-draw';
  seq: number;
  entityId: string;
  entityName: string;
  colors: string[];
  source: 'rest' | 'start' | 'reshuffle';
  handAfter: BeadCounts;
}

export interface MoveEntry {
  type: 'move';
  seq: number;
  entityId: string;
  entityName: string;
  from: string;
  to: string;
}

export interface AttackAttemptEntry {
  type: 'attack-attempt';
  seq: number;
  attackerId: string;
  attackerName: string;
  targetId: string;
  targetName: string;
  power: number;
  agility: number;
  modifiers: string[];
}

export interface DefensiveReactionEntry {
  type: 'defensive-reaction';
  seq: number;
  defenderId: string;
  defenderName: string;
  reactionType: 'guard' | 'dodge' | 'resist';
  beadsSpent: BeadCounts;
}

export interface CombatOutcomeEntry {
  type: 'combat-outcome';
  seq: number;
  attackerId: string;
  targetId: string;
  outcome: 'hit' | 'dodged' | 'guarded';
  damage: number;
  blockedDamage: number;
  targetHealthAfter: number;
  targetMaxHealth: number;
}

export interface StateChangeEntry {
  type: 'state-change';
  seq: number;
  entityId: string;
  entityName: string;
  changeType: 'buff-add' | 'buff-remove' | 'hp-change' | 'status-effect';
  details: Record<string, unknown>;
}

export interface MonsterStateTransitionEntry {
  type: 'monster-state-transition';
  seq: number;
  fromState: string;
  toState: string;
  drawnBead: string;
}

export interface WheelAdvanceEntry {
  type: 'wheel-advance';
  seq: number;
  entityId: string;
  entityName: string;
  cost: number;
  newPosition: number;
}

export interface SegmentChangeEntry {
  type: 'segment-change';
  seq: number;
  previousSegment: string;
  newSegment: string;
}

export interface RoundEndEntry {
  type: 'round-end';
  seq: number;
  entitySummaries: Array<{
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    handCounts: BeadCounts;
  }>;
}

export interface BattleEndEntry {
  type: 'battle-end';
  seq: number;
  outcome: 'victory' | 'defeat';
}

export type CombatLogEntry =
  | TurnStartEntry
  | ActionSelectedEntry
  | BeadSpendEntry
  | BeadDrawEntry
  | MoveEntry
  | AttackAttemptEntry
  | DefensiveReactionEntry
  | CombatOutcomeEntry
  | StateChangeEntry
  | MonsterStateTransitionEntry
  | WheelAdvanceEntry
  | SegmentChangeEntry
  | RoundEndEntry
  | BattleEndEntry;

export class CombatRecorder {
  private entries: CombatLogEntry[] = [];
  private seqCounter: number = 0;

  record(entry: CombatLogEntry): void {
    this.seqCounter++;
    entry.seq = this.seqCounter;
    this.entries.push(entry);
  }

  getEntries(): CombatLogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
    this.seqCounter = 0;
  }
}
