# Controller Architecture

## Overview

Turn orchestration is separated from Phaser UI via the **Adapter pattern**:

- **TurnFlowController** contains pure game loop logic with no Phaser dependencies
- **BattleScene** implements the **BattleAdapter** interface to handle all UI interactions
- This separation enables unit testing of turn flow logic without Phaser

The Adapter pattern ensures that:
1. Core game logic remains testable and framework-agnostic
2. UI concerns are isolated in BattleScene
3. Turn flow is decoupled from rendering and input handling

## Architecture Diagram

```
BattleScene (Phaser Scene)
    │ implements
    ▼
BattleAdapter (interface)
    │ injected into
    ▼
TurnFlowController
    │ uses
    ├── TurnController (wheel, victory/defeat)
    ├── ActionRegistry (get actions)
    └── MonsterEntity (AI decisions)
```

## BattleAdapter Interface

The `BattleAdapter` interface defines all UI interactions needed by the controller layer:

```typescript
interface BattleAdapter {
  // ===== Phase 3: Action Execution =====

  /**
   * Prompt user to select a tile within range.
   * @returns Selected position or null if cancelled
   */
  promptTile(params: { range: number }): Promise<Position | null>;

  /**
   * Prompt user to select from a list of options.
   * @returns Selected option IDs or null if cancelled
   */
  promptOptions(prompt: OptionPrompt): Promise<string[] | null>;

  /**
   * Animate a sequence of events.
   */
  animate(events: AnimationEvent[]): Promise<void>;

  /**
   * Log a message to the battle log.
   */
  log(message: string): void;

  // ===== Phase 4: Turn Management & Scene Control =====

  /**
   * Setup UI for player turn (auto-select actor, make characters clickable).
   * Called at the start of each player turn.
   */
  showPlayerTurn(actorId: string): void;

  /**
   * Wait for player to select an action.
   * @returns Action ID selected by the player
   */
  awaitPlayerAction(actorId: string): Promise<string>;

  /**
   * Transition to another scene.
   */
  transition(scene: string, data: object): void;

  /**
   * Delay execution for a specified duration.
   */
  delay(ms: number): Promise<void>;
}
```

## TurnFlowController

The controller orchestrates the battle turn flow with the following key methods:

### `start(): Promise<void>`

Main async game loop that:
1. Checks battle status (victory/defeat/ongoing)
2. Gets the next actor from the action wheel
3. Emits `actorChanged` event to observers
4. Executes either a monster turn or player turn
5. Loops until battle ends

Transitions to `VictoryScene` when:
- **Victory**: Monster is defeated
- **Defeat**: All characters are defeated

### `checkBattleStatus(): BattleStatus`

Delegates to `TurnController.getBattleStatus()` to determine current game state:
- Returns `'victory'` if monster is dead
- Returns `'defeat'` if all characters are dead
- Returns `'ongoing'` otherwise

### `executeMonsterTurn(): Promise<void>`

Executes AI logic for the monster:
1. Validates monster has bead system and state machine
2. Gets all alive characters as potential targets
3. **Phase 1 (Decide)**: Calls `monster.decideTurn(targets)` to get AI decision
4. **Phase 2 (Execute)**: Calls `monster.executeDecision(decision)` to apply state changes and collect events
5. **Phase 3 (Animate)**: Calls `adapter.animate(events)` to play animations
6. **Phase 4 (Advance)**: Advances monster on wheel by decision's `wheelCost`
7. Adds 300ms delay before returning

### `executePlayerTurn(actorId: string): Promise<void>`

Executes player-controlled turn with retry loop:
1. Calls `adapter.showPlayerTurn(actorId)` to setup UI
2. **Loop**: While action not accepted:
   a. Calls `adapter.awaitPlayerAction(actorId)` to wait for player selection
   b. Gets `Action` from `actionRegistry.getAction(actionId)`
   c. Calls `action.resolve(actorId, adapter)` to get `ActionResolution`
   d. Calls `resolution.execute()` to collect parameters and apply effects
   e. If `result.cancelled` is true, loops back to step 2a
   f. If action failed, logs failure reason
   g. Advances actor on wheel by `result.cost.time`
3. Adds 300ms delay and returns

## Game Loop Flow

The main battle loop executes the following steps:

1. **Check Status** → Call `checkBattleStatus()`
2. **Victory/Defeat?** → If true, transition to `VictoryScene` with results
3. **Get Next Actor** → Call `turnController.getNextActor()`
4. **Emit Change** → Call `stateObserver.emitActorChanged(actorId)`
5. **Execute Turn** → If actor is 'monster', call `executeMonsterTurn()`, else call `executePlayerTurn(actorId)`
6. **Loop** → Return to step 1

## Player Turn Flow

When `executePlayerTurn(actorId)` is called, the following sequence occurs:

1. **Setup UI** → Call `adapter.showPlayerTurn(actorId)` to auto-select character and enable action buttons
2. **Wait for Action** → Call `adapter.awaitPlayerAction(actorId)` - blocks until player clicks an action button
3. **Get Action Object** → Call `actionRegistry.getAction(actionId)` - retrieves the Action definition
4. **Resolve Action** → Call `action.resolve(actorId, adapter)` - returns `ActionResolution` with parameter collection logic
5. **Execute Resolution** → Call `resolution.execute()` - collects parameters (tiles, options), applies effects, returns `AdapterActionResult`
6. **Check Cancellation** → If `result.cancelled` is true, go back to step 2 to allow player to choose again
7. **Log Outcome** → If action failed, log the failure reason via `adapter.log(reason)`
8. **Advance Turn** → Call `turnController.advanceTurn(actorId, result.cost.time)` to move actor forward on wheel
9. **Delay & Exit** → Wait 300ms, then return to main loop

## Testing

TurnFlowController can be tested with a mock BattleAdapter:

```typescript
const mockAdapter: BattleAdapter = {
  log: vi.fn(),
  animate: vi.fn(async () => {}),
  awaitPlayerAction: vi.fn(async () => 'move'),
  promptTile: vi.fn(async () => ({ x: 0, y: 0 })),
  promptOptions: vi.fn(async () => []),
  showPlayerTurn: vi.fn(),
  transition: vi.fn(),
  delay: vi.fn(async () => {}),
};

const controller = new TurnFlowController(state, mockAdapter);
await controller.start();

// Verify adapter methods were called correctly
expect(mockAdapter.animate).toHaveBeenCalled();
expect(mockAdapter.awaitPlayerAction).toHaveBeenCalled();
```

Key benefits:
- **No Phaser dependencies** - Controller runs in pure Node.js
- **Deterministic** - Can control time with mocked `delay()`
- **Observable** - Can track all adapter calls via `vi.fn()`
- **Fast** - No rendering overhead

## File Locations

| File | Purpose |
|------|---------|
| `src/controllers/TurnFlowController.ts` | Battle loop orchestration (no Phaser) |
| `src/types/BattleAdapter.ts` | UI abstraction interface |
| `src/systems/TurnController.ts` | Wheel and victory/defeat logic |
| `src/scenes/BattleScene.ts` | Phaser implementation of BattleAdapter |
