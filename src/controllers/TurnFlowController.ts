import type { BattleState } from '@src/state/BattleState';
import type { BattleAdapter } from '@src/types/BattleAdapter';
import type { BattleStatus } from '@src/systems/TurnController';

/**
 * TurnFlowController orchestrates the battle turn flow.
 * Extracted from BattleScene to enable testing without Phaser.
 *
 * Delegates to existing TurnController for wheel/status management.
 * Uses BattleAdapter for UI interactions.
 */
export class TurnFlowController {
  constructor(
    private readonly state: BattleState,
    private readonly adapter: BattleAdapter
  ) {}

  /**
   * Check the current battle status.
   * Delegates to TurnController.getBattleStatus().
   */
  checkBattleStatus(): BattleStatus {
    return this.state.turnController.getBattleStatus();
  }

  /**
   * Execute the monster's turn.
   * - Checks if monster has bead system
   * - Gets alive characters as targets
   * - Calls monster.decideTurn() and executeDecision()
   * - Animates events via adapter
   * - Advances turn via turnController
   */
  async executeMonsterTurn(): Promise<void> {
    this.adapter.log('--- Monster Turn ---');

    const monster = this.state.monsterEntity;

    // Check if monster has bead system
    if (!monster.hasBeadBag() || !monster.hasStateMachine()) {
      this.adapter.log('Monster has no bead system!');
      this.state.turnController.advanceTurn('monster', 2);
      await this.adapter.delay(300);
      return;
    }

    // Get alive characters as targets
    const targets = this.state.characters.filter((c) => c.isAlive());

    // Phase 1: Decide - get the monster's decision
    const decision = monster.decideTurn(targets);

    // Phase 2: Execute - apply state changes and get events
    const events = monster.executeDecision(decision);

    // Phase 3: Animate - play all events
    await this.adapter.animate(events);

    // Phase 4: Advance turn
    this.state.turnController.advanceTurn('monster', decision.wheelCost);
    await this.adapter.delay(300);
  }

  /**
   * Execute a player's turn.
   * - Shows player turn UI via adapter
   * - Awaits player action selection (with retry on cancellation)
   * - Resolves and executes the action
   * - Advances turn via turnController
   */
  async executePlayerTurn(actorId: string): Promise<void> {
    this.adapter.log('--- Player Turn ---');
    this.adapter.showPlayerTurn(actorId);

    while (true) {
      // Wait for player to select an action
      const actionId = await this.adapter.awaitPlayerAction(actorId);

      // Get the action from registry
      const action = this.state.actionRegistry.getAction(actionId);
      if (!action) {
        this.adapter.log(`Unknown action: ${actionId}`);
        continue;
      }

      // Resolve and execute the action
      const resolution = await action.resolve(actorId, this.adapter);
      const result = await resolution.execute();

      // Handle cancellation - allow player to choose another action
      if (result.cancelled) {
        this.adapter.log('Action cancelled');
        continue;
      }

      // Log failure reason if action failed (but still advance turn)
      if (!result.success && result.reason) {
        this.adapter.log(result.reason);
      }

      // Advance turn with action's time cost and exit loop
      this.state.turnController.advanceTurn(actorId, result.cost.time);
      await this.adapter.delay(300);
      return;
    }
  }

  /**
   * Start the battle loop.
   * Runs the main game loop with turn alternation between monster and player.
   * Checks for victory/defeat at each iteration and transitions to end scene when needed.
   */
  async start(): Promise<void> {
    while (true) {
      const status = this.checkBattleStatus();

      if (status === 'victory') {
        this.adapter.transition('VictoryScene', {
          victory: true,
          monster: this.state.monster.name,
          turns: 0,
        });
        return;
      }

      if (status === 'defeat') {
        this.adapter.transition('VictoryScene', {
          victory: false,
          monster: this.state.monster.name,
          turns: 0,
        });
        return;
      }

      // Get next actor from the wheel
      const actorId = this.state.turnController.getNextActor();
      if (!actorId) {
        this.adapter.log('No actors on wheel!');
        return;
      }

      // Notify observers of actor change
      this.state.stateObserver.emitActorChanged(actorId);

      // Execute appropriate turn
      if (actorId === 'monster') {
        await this.executeMonsterTurn();
      } else {
        await this.executePlayerTurn(actorId);
      }
    }
  }
}
