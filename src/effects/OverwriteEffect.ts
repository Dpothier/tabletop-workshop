import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import { MonsterEntity } from '@src/entities/MonsterEntity';

export class OverwriteEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetId as string;
    if (!targetId) {
      return { success: false, data: {}, events: [] };
    }

    // Handle ponder substitution if modifier is set
    if (modifiers.ponderSubstitution && context.actorId) {
      const caster = context.getEntity(context.actorId);
      if (caster && caster.getStacks('ponder') >= 1) {
        caster.addStacks('ponder', -1);
      }
    }

    const target = context.getEntity(targetId);
    if (!target) {
      return { success: false, data: {}, events: [] };
    }

    // Range check: caster to target, max 6
    if (!context.actorId) {
      return { success: false, data: {}, events: [] };
    }
    const casterPos = context.grid.getPosition(context.actorId);
    const targetPos = context.grid.getPosition(targetId);
    if (!casterPos || !targetPos) {
      return { success: false, data: {}, events: [] };
    }

    const distance = Math.max(
      Math.abs(targetPos.x - casterPos.x),
      Math.abs(targetPos.y - casterPos.y)
    );
    if (distance > 6) {
      return { success: false, data: {}, events: [] };
    }

    // Check target is a MonsterEntity
    if (!(target instanceof MonsterEntity)) {
      return { success: false, data: {}, events: [] };
    }

    // Force redraw — the orchestrator will call decideTurn with proper targets
    return {
      success: true,
      data: {
        targetId,
        redrawn: true,
      },
      events: [],
    };
  }
}
