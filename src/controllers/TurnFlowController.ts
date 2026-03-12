import type { BattleState } from '@src/state/BattleState';
import type { BattleAdapter } from '@src/types/BattleAdapter';
import type { BattleStatus } from '@src/systems/TurnController';
import { CombatLogStorage } from '@src/recording/CombatLogStorage';
import type { BattleSnapshot } from '@src/recording/BattleSnapshot';

/**
 * TurnFlowController orchestrates the battle turn flow.
 * Extracted from BattleScene to enable testing without Phaser.
 *
 * Delegates to existing TurnController for wheel/status management.
 * Uses BattleAdapter for UI interactions.
 */
export class TurnFlowController {
  private turnCount = 0;

  constructor(
    private readonly state: BattleState,
    private readonly adapter: BattleAdapter
  ) {}

  private buildRecording(): {
    snapshot: BattleSnapshot;
    entries: any[];
  } | null {
    try {
      const snapshot = this.state.initialSnapshot;
      if (!snapshot) return null;
      const entries = this.state.recorder?.getEntries() || [];
      return { snapshot, entries };
    } catch {
      return null;
    }
  }

  private autoSaveRecording(recording: { snapshot: BattleSnapshot; entries: any[] }): void {
    try {
      const storage = new CombatLogStorage(localStorage);
      const recordingId = `${this.state.monster.name}-${Date.now()}`;
      storage.saveToLocalStorage(recordingId, recording as any);
    } catch {
      // Silently fail if localStorage save fails
    }
  }

  private recordTurnEnd(entityId: string, entityName: string, cost: number): void {
    const segmentBefore = this.state.wheel.getActiveSegment();
    this.state.turnController.advanceTurn(entityId, cost);
    const segmentAfter = this.state.wheel.getActiveSegment();

    if (segmentBefore !== segmentAfter) {
      this.state.recorder?.record({
        type: 'segment-change',
        seq: 0,
        previousSegment: segmentBefore.toString(),
        newSegment: segmentAfter.toString(),
      } as any);
    }

    this.state.recorder?.record({
      type: 'wheel-advance',
      seq: 0,
      entityId,
      entityName,
      cost,
      newPosition: this.state.wheel.getPosition(entityId) ?? 0,
    } as any);
  }

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

    // Record turn start
    this.state.recorder?.record({
      type: 'turn-start',
      seq: 0,
      actorId: 'monster',
      actorName: (monster as any)?.name || 'monster',
      actorType: 'monster',
      wheelPosition: 0,
    } as any);

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
    const decision = monster.decideTurn(targets, this.state.recorder);

    // Phase 2: Execute - apply state changes and get events
    const events = await monster.executeDecision(decision, this.adapter);

    // Phase 3: Animate - play all events
    await this.adapter.animate(events);

    // Phase 4: Advance turn
    const wheelCost = decision.wheelCost;
    this.recordTurnEnd('monster', 'monster', wheelCost);

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

    // Record turn start
    const entity = this.state.characters.find((c) => c.id === actorId);
    this.state.recorder?.record({
      type: 'turn-start',
      seq: 0,
      actorId,
      actorName: (entity as any)?.name || actorId,
      actorType: 'player',
      wheelPosition: 0,
    } as any);

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
      const cost = result.cost.time;
      this.recordTurnEnd(actorId, actorId, cost);

      await this.adapter.delay(300);
      return;
    }
  }

  /**
   * Resolve end-of-round effects.
   * - Apply burn damage to all characters
   * - Apply burn damage to monster
   * - Emit roundEnded event
   */
  resolveEndOfRound(): void {
    // Resolve burn for all characters
    for (const character of this.state.characters) {
      const burnStacks = character.getStacks('burn');
      if (burnStacks > 0) {
        character.receiveDamage(burnStacks);
        this.state.recorder?.record({
          type: 'state-change',
          seq: 0,
          entityId: character.id,
          entityName: (character as any).name || character.id,
          changeType: 'hp-change',
          details: { reason: 'burn', damage: burnStacks },
        } as any);
        character.clearStacks('burn');
        this.state.recorder?.record({
          type: 'state-change',
          seq: 0,
          entityId: character.id,
          entityName: (character as any).name || character.id,
          changeType: 'buff-remove',
          details: { stackName: 'burn', reason: 'end-of-round' },
        } as any);
      }
    }

    // Resolve burn for monster
    const monster = this.state.monsterEntity;
    const monsterBurn = monster.getStacks('burn');
    if (monsterBurn > 0) {
      monster.receiveDamage(monsterBurn);
      this.state.recorder?.record({
        type: 'state-change',
        seq: 0,
        entityId: monster.id,
        entityName: (monster as any).name || monster.id,
        changeType: 'hp-change',
        details: { reason: 'burn', damage: monsterBurn },
      } as any);
      monster.clearStacks('burn');
      this.state.recorder?.record({
        type: 'state-change',
        seq: 0,
        entityId: monster.id,
        entityName: (monster as any).name || monster.id,
        changeType: 'buff-remove',
        details: { stackName: 'burn', reason: 'end-of-round' },
      } as any);
    }

    // Record round end
    const monsterSummary = {
      id: this.state.monsterEntity.id,
      name: (this.state.monsterEntity as any).name || this.state.monsterEntity.id,
      hp: this.state.monsterEntity.currentHealth,
      maxHp: this.state.monsterEntity.maxHealth,
      handCounts: { red: 0, blue: 0, green: 0, white: 0 },
    };
    const summaries = [
      ...this.state.characters.map((c) => ({
        id: c.id,
        name: (c as any)?.name || c.id,
        hp: c.currentHealth,
        maxHp: c.maxHealth,
        handCounts: c.getBeadHand?.()?.getHandCounts() || { red: 0, blue: 0, green: 0, white: 0 },
      })),
      monsterSummary,
    ];
    this.state.recorder?.record({
      type: 'round-end',
      seq: 0,
      entitySummaries: summaries,
    } as any);

    // Emit round ended event
    this.state.stateObserver.emitRoundEnded();
  }

  /**
   * Start the battle loop.
   * Runs the main game loop with turn alternation between monster and player.
   * Checks for victory/defeat at each iteration and transitions to end scene when needed.
   */
  async start(): Promise<void> {
    while (true) {
      const status = this.checkBattleStatus();

      if (status === 'victory' || status === 'defeat') {
        const isVictory = status === 'victory';

        this.state.recorder?.record({
          type: 'battle-end',
          seq: 0,
          outcome: status,
        } as any);

        const recording = this.buildRecording();
        if (recording) {
          this.autoSaveRecording(recording);
        }

        this.adapter.transition('VictoryScene', {
          victory: isVictory,
          monster: this.state.monster.name,
          turns: this.turnCount,
          recording: recording ?? undefined,
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
        this.turnCount++;
        await this.executePlayerTurn(actorId);
      }

      // Check for round completion
      if (this.state.wheel.didCompleteRound()) {
        this.resolveEndOfRound();
      }
    }
  }
}
