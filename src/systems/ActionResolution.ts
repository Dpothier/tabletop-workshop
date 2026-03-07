import type { Action } from '@src/models/Action';
import type { BattleAdapter } from '@src/types/BattleAdapter';
import type { ActionResult } from '@src/types/ActionDefinition';
import type { GameContext } from '@src/types/Effect';
import type { EntityPrompt } from '@src/types/ParameterPrompt';
import type { BeadCounts } from '@src/types/Beads';

/**
 * ActionResolution handles the execution of an action with async parameter collection
 * and animation via BattleAdapter.
 *
 * For Step 3.8, handles tile and option parameter prompts via adapter.
 */
export class ActionResolution {
  constructor(
    private action: Action,
    public readonly actorId: string,
    private context: GameContext,
    private adapter: BattleAdapter
  ) {}

  /**
   * Execute the action: collect parameters, apply effects, animate results.
   * For Step 3.8, handles tile and option parameter prompts via adapter.
   * For Step 3.9, handles cancellation when user returns null from prompts.
   */
  async execute(): Promise<ActionResult> {
    const collectedValues = new Map<string, unknown>();

    // Collect parameters from user via adapter
    for (const prompt of this.action.parametrize()) {
      if (prompt.type === 'tile') {
        const position = await this.adapter.promptTile({ range: prompt.range ?? 1 });
        if (position === null) {
          return {
            cancelled: true,
            success: false,
            cost: this.action.cost,
            events: [],
            data: {},
          };
        }
        collectedValues.set(prompt.key, position);
      } else if (prompt.type === 'option') {
        const selected = await this.adapter.promptOptions(prompt);
        if (selected === null) {
          return {
            cancelled: true,
            success: false,
            cost: this.action.cost,
            events: [],
            data: {},
          };
        }
        collectedValues.set(prompt.key, selected);
      } else if (prompt.type === 'entity') {
        const entity = await this.adapter.promptEntity(prompt as EntityPrompt);
        if (entity === null) {
          return {
            cancelled: true,
            success: false,
            cost: this.action.cost,
            events: [],
            data: {},
          };
        }
        collectedValues.set(prompt.key, entity);
      }
    }

    // Spend bead costs if any
    const beadHand = this.context.getBeadHand(this.actorId);
    if (beadHand) {
      const cost = this.action.cost;
      const beadCost: BeadCounts = {
        red: cost.red ?? 0,
        blue: cost.blue ?? 0,
        green: cost.green ?? 0,
        white: cost.white ?? 0,
      };

      if (!beadHand.canAfford(beadCost)) {
        return {
          cancelled: false,
          success: false,
          reason: 'insufficient beads',
          cost: this.action.cost,
          events: [],
          data: {},
        };
      }

      // Spend each bead color
      for (const color of ['red', 'blue', 'green', 'white'] as const) {
        for (let i = 0; i < (cost[color] ?? 0); i++) {
          beadHand.spend(color);
        }
      }
    }

    // Apply effects with collected values (may be async)
    const effectResult = await this.action.applyEffects(collectedValues, this.context);

    // Animate if there are events
    if (effectResult.events.length > 0) {
      await this.adapter.animate(effectResult.events);
    }

    return {
      cancelled: false,
      success: effectResult.success,
      reason: effectResult.reason,
      cost: this.action.cost,
      events: effectResult.events,
      data: effectResult.data,
    };
  }
}
