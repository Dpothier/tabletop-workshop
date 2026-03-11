import type { CombatLogEntry } from './CombatRecorder';
import type { AnimationEvent } from '@src/types/AnimationEvent';
import type { Position } from '@src/state/BattleGrid';

export interface ReplayStep {
  actorId: string;
  actorName: string;
  entries: CombatLogEntry[];
  includesRoundEnd: boolean;
}

export class CombatLogPlayer {
  private steps: ReplayStep[] = [];
  private currentStepIndex: number = 0;

  buildSteps(entries: CombatLogEntry[]): ReplayStep[] {
    this.steps = [];
    let currentStep: ReplayStep | null = null;

    for (const entry of entries) {
      if (entry.type === 'turn-start') {
        // Start a new step
        currentStep = {
          actorId: entry.actorId,
          actorName: entry.actorName,
          entries: [entry],
          includesRoundEnd: false,
        };
        this.steps.push(currentStep);
      } else if (currentStep !== null) {
        // Add entry to current step
        currentStep.entries.push(entry);

        // Mark if this step includes a round-end
        if (entry.type === 'round-end') {
          currentStep.includesRoundEnd = true;
        }
      }
    }

    return this.steps;
  }

  nextStep(): ReplayStep | undefined {
    if (this.currentStepIndex >= this.steps.length) {
      return undefined;
    }
    return this.steps[this.currentStepIndex++];
  }

  isComplete(): boolean {
    return this.currentStepIndex >= this.steps.length;
  }

  toAnimationEvents(step: ReplayStep): AnimationEvent[] {
    const events: AnimationEvent[] = [];

    for (const entry of step.entries) {
      if (entry.type === 'move') {
        const from = this.parsePosition(entry.from);
        const to = this.parsePosition(entry.to);
        events.push({
          type: 'move',
          entityId: entry.entityId,
          from,
          to,
        });
      } else if (entry.type === 'combat-outcome') {
        if (entry.outcome === 'hit') {
          events.push({
            type: 'hit',
            entityId: entry.targetId,
            attackerId: entry.attackerId,
            damage: entry.damage,
          });
          events.push({
            type: 'damage',
            entityId: entry.targetId,
            newHealth: entry.targetHealthAfter,
            maxHealth: entry.targetMaxHealth,
          });
        } else if (entry.outcome === 'dodged') {
          events.push({
            type: 'dodge',
            entityId: entry.targetId,
            attackerId: entry.attackerId,
            canReact: false,
          });
        } else if (entry.outcome === 'guarded') {
          events.push({
            type: 'guarded',
            entityId: entry.targetId,
            attackerId: entry.attackerId,
            blockedDamage: entry.blockedDamage,
          });
        }
      } else if (entry.type === 'bead-draw') {
        events.push({
          type: 'rest',
          entityId: entry.entityId,
          beadsDrawn: entry.colors as import('@src/types/Beads').BeadColor[],
        });
      } else if (entry.type === 'monster-state-transition') {
        events.push({
          type: 'beadDraw',
          color: entry.drawnBead as import('@src/types/Beads').BeadColor,
        });
        events.push({
          type: 'stateChange',
          fromState: entry.fromState,
          toState: entry.toState,
        });
      }
    }

    return events;
  }

  reset(): void {
    this.currentStepIndex = 0;
  }

  getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  getTotalSteps(): number {
    return this.steps.length;
  }

  private parsePosition(posStr: string): Position {
    const [x, y] = posStr.split(',').map(Number);
    return { x, y };
  }
}
