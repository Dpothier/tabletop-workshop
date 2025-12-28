# BattleScene Simplification Opportunities

Current: **636 lines** | Target: **~300 lines**

## Current Responsibilities

| Responsibility | Lines | Methods |
|----------------|-------|---------|
| Turn Management | ~70 | `processTurn`, `showPlayerActions`, `selectCharacter`, `advanceAndProcessTurn` |
| Action Execution | ~140 | `executeAction`, `startTileTargeting`, `resolveTileAction`, `executeEntityAction`, `executeImmediateAction` |
| Monster AI Orchestration | ~30 | `executeMonsterTurn` |
| UI Update | ~60 | `updateUI` |
| Visual Creation/Sync | ~55 | `createVisuals`, `syncVisuals` |
| Grid Rendering | ~50 | `drawGrid`, `getTerrainColor` |
| UI Creation | ~55 | `createBattleUI`, `createHeroSelectionBar`, `createSelectedHeroPanel` |
| State Access | ~25 | Convenience getters |
| Scene Transitions | ~15 | `victory`, `defeat` |

---

## Refactoring Opportunities

### 1. Extract TurnController (High Impact)

**What:** Turn flow logic - who acts next, victory/defeat checks, turn advancement.

**Extract:**
```typescript
class TurnController {
  constructor(wheel: ActionWheel, characters: Character[], monster: MonsterEntity) {}

  getNextActor(): string | null
  checkVictory(): boolean
  checkDefeat(): boolean
  advanceTurn(entityId: string, cost: number): void
}
```

**Benefit:** Pure logic, unit-testable without Phaser.

**Lines saved:** ~50

---

### 2. Extract GridVisual (Medium Impact) ✅ DONE

**What:** Grid rendering - terrain colors, grid lines.

**Extract:**
```typescript
class GridVisual {
  constructor(scene: Phaser.Scene, arena: Arena, gridSystem: GridSystem) {}

  draw(): void
  highlightTiles(tiles: Position[], color: number): Phaser.GameObjects.Graphics
}
```

**Benefit:** Matches existing `CharacterVisual`/`MonsterVisual` pattern.

**Lines saved:** ~50

---

### 3. Extract SelectionManager (Medium Impact)

**What:** Character selection state and visual updates.

**Extract:**
```typescript
class SelectionManager {
  constructor(characterVisuals: Map<string, CharacterVisual>) {}

  select(characterId: string): void
  deselect(): void
  getSelected(): string | null
  isCurrentActor(characterId: string, currentActorId: string): boolean
}
```

**Benefit:** Decouples selection logic from scene.

**Lines saved:** ~30

---

### 4. Make updateUI() Reactive (Medium Impact)

**Problem:** `updateUI()` is 60 lines that manually syncs every UI component.

**Solution:** Event-based updates.

```typescript
// State emits events
actionWheel.on('positionChanged', (entityId, position) => { ... });
character.on('healthChanged', (current, max) => { ... });

// UI components subscribe
heroSelectionBar.subscribeTo(characters);
```

**Benefit:** UI components update themselves, no central orchestration.

**Lines saved:** ~60

---

### 5. Extract TargetingSystem (Lower Impact)

**What:** Tile highlighting, click handling for movement.

**Extract:**
```typescript
class TargetingSystem {
  constructor(scene: Phaser.Scene, gridSystem: GridSystem, battleGrid: BattleGrid) {}

  showTileTargeting(entityId: string, range: number): Promise<Position | null>
  showEntityTargeting(validTargets: string[]): Promise<string | null>
  cancel(): void
}
```

**Benefit:** Reusable targeting for any action type.

**Lines saved:** ~40

---

### 6. Consolidate Action Resolution ✅ DONE

**Status:** Addressed by effect-based action system (see `rework-action-definition.md`).
- `createGameContext()` factory extracts common context creation
- `ActionResolution` class handles all action types uniformly

**Original Problem:** `resolveTileAction`, `executeEntityAction`, `executeImmediateAction` share pattern:

```typescript
const result = character.resolveAction(actionId, params);
if (!result.success) { log error; return; }
await animationExecutor.execute(result.events);
this.updateUI();
this.advanceAndProcessTurn(...);
```

**Solution:** Single method with params:

```typescript
private async resolveAndAdvance(
  character: Character,
  actionId: string,
  params: ActionParams
): Promise<void> {
  const result = character.resolveAction(actionId, params);
  if (!result.success) {
    this.battleUI.log(result.reason || 'Action failed');
    return;
  }
  await this.animationExecutor.execute(result.events);
  this.updateUI();
  this.advanceAndProcessTurn(this.currentActorId!, result.wheelCost);
}
```

**Lines saved:** ~30

---

## Recommended Order

1. **Consolidate Action Resolution** ✅ DONE - Quick win, no new files
2. **Extract GridVisual** ✅ DONE - Follows existing pattern
3. **Extract TurnController** - Enables unit testing
4. **Extract SelectionManager** - Simplifies turn handling
5. **Extract TargetingSystem** - Cleaner input handling
6. **Make updateUI() Reactive** - Largest change, do last

---

## Expected Outcome

| Refactor | Lines Moved | New File |
|----------|-------------|----------|
| Consolidate actions | -30 | - |
| GridVisual | -50 | `src/visuals/GridVisual.ts` |
| TurnController | -50 | `src/systems/TurnController.ts` |
| SelectionManager | -30 | `src/systems/SelectionManager.ts` |
| TargetingSystem | -40 | `src/systems/TargetingSystem.ts` |
| Reactive UI | -60 | - |

**Total reduction:** ~260 lines → BattleScene at ~375 lines

---

## Additional Improvements

### 7. Fix Character.resolveAction Error Handling (Quick Win)

**Problem:** Method throws errors instead of returning failures:

```typescript
if (!availableIds.includes(actionId)) {
  throw new Error(`Character does not have action: ${actionId}`); // Throws!
}
```

**Solution:** Return `ActionResult` with `success: false`:

```typescript
if (!availableIds.includes(actionId)) {
  return { success: false, reason: `Character does not have action: ${actionId}`, wheelCost: 0, events: [] };
}
```

**Benefit:** Consistent with existing `ActionResult` pattern, no try-catch needed in BattleScene.

---

### 8. Centralize Log Messages (Quick Win)

**Problem:** Magic strings scattered throughout:
- `'--- Monster Turn ---'`
- `'--- Player Turn ---'`
- `'Not this character's turn'`

**Solution:** Extract to constants:

```typescript
private static readonly LOG = {
  MONSTER_TURN: '--- Monster Turn ---',
  PLAYER_TURN: '--- Player Turn ---',
  WRONG_TURN: 'Not this character\'s turn',
} as const;
```

**Benefit:** Easier to maintain, self-documenting.

---

### 9. Simplify ActionHandler Context Pattern (Lower Impact)

**Problem:** Each handler in `ActionHandlers.ts` duplicates context null-check:

```typescript
registry.register('movement', (entityId, params, definition) => {
  const context = registry.getContext();  // Every handler does this
  if (!context) { return { success: false, ... }; }
  // ... handler logic ...
});
```

**Solution:** Create wrapper that provides context:

```typescript
function withContext(
  handler: (context: ActionContext, entityId: string, params: ActionParams, def: ActionDefinition) => ActionResult
): ActionHandler {
  return (entityId, params, definition) => {
    const context = registry.getContext();
    if (!context) return { success: false, reason: 'No context', wheelCost: definition.cost, events: [] };
    return handler(context, entityId, params, definition);
  };
}

// Usage
registry.register('movement', withContext((context, entityId, params, def) => {
  // No null check needed, context guaranteed
}));
```

**Benefit:** DRY, cleaner handler definitions.

---

## What Stays in BattleScene

After refactoring, BattleScene becomes a thin orchestrator:

```typescript
class BattleScene extends Phaser.Scene {
  // Received state
  private state: BattleState;

  // Visual layer
  private gridVisual: GridVisual;
  private characterVisuals: Map<string, CharacterVisual>;
  private monsterVisual: MonsterVisual;

  // Systems
  private turnController: TurnController;
  private selectionManager: SelectionManager;
  private targetingSystem: TargetingSystem;

  // UI
  private battleUI: BattleUI;
  private heroSelectionBar: HeroSelectionBar;
  private selectedHeroPanel: SelectedHeroPanel;

  create() {
    this.createVisuals();
    this.createUI();
    this.turnController.start();
  }

  // Event handlers wiring systems together
  private onActionSelected(actionId: string) { ... }
  private onTurnAdvanced() { ... }
  private onBattleEnd(victory: boolean) { ... }
}
```
