import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import { MonsterEntity } from '@src/entities/MonsterEntity';

export class AssessEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetId as string;
    const payWithPonder = params.payWithPonder as boolean | undefined;

    // Check if actor exists
    if (!context.actorId) {
      return { success: false, reason: 'Actor not found', data: {}, events: [] };
    }

    const actor = context.getEntity(context.actorId);
    if (!actor) {
      return { success: false, reason: 'Actor not found', data: {}, events: [] };
    }

    // Check if target exists
    const target = context.getEntity(targetId);
    if (!target) {
      return { success: false, reason: 'Target not found', data: {}, events: [] };
    }

    // Check range: must be > 0 and <= 6
    const distance = context.grid.getDistance(context.actorId, targetId);
    if (distance < 1 || distance > 6) {
      return { success: false, reason: 'Target is out of range', data: {}, events: [] };
    }

    // Target must be a MonsterEntity
    if (!(target instanceof MonsterEntity)) {
      return { success: false, reason: 'Target is not a monster', data: {}, events: [] };
    }

    const monster = target as MonsterEntity;

    // Handle ponder payment
    if (payWithPonder) {
      const ponderStacks = actor.getStacks('ponder');
      if (ponderStacks < 1) {
        return { success: false, reason: 'Not enough ponder stacks', data: {}, events: [] };
      }
      actor.clearStacks('ponder');
      if (ponderStacks > 1) {
        actor.addStacks('ponder', ponderStacks - 1);
      }
    }

    // Get cunning from last completed action
    const additionalCost = monster.getLastActionCunning();

    // Get next planned action
    const nextAction = monster.getNextPlannedAction();

    return {
      success: true,
      data: {
        nextBead: nextAction?.nextBead ?? 'unknown',
        nextAction: nextAction?.nextState ?? 'unknown',
        state: nextAction?.nextState ?? 'unknown',
        additionalCost,
        isPublic: true,
      },
      events: [],
    };
  }
}
