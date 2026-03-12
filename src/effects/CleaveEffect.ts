import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';

export class CleaveEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetId as string;
    const hitOutcome = params.hitOutcome as string;
    const adjacentEnemyIds = params.adjacentEnemyIds as string[];

    let adjacentsDamaged = 0;

    if (hitOutcome === 'hit') {
      for (const enemyId of adjacentEnemyIds) {
        const enemy = context.getEntity(enemyId);
        if (enemy) {
          enemy.receiveDamage(1);
          adjacentsDamaged++;
        }
      }
    }

    return {
      success: true,
      data: {
        targetId,
        adjacentsDamaged,
        hitOutcome,
      },
      events: [],
    };
  }
}
