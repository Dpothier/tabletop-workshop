# Refactoring BattleScene

## Phase 2 - Reactive Observer Pattern ✅ COMPLETED

**Résultat** : BattleScene réduit de ~740 à 609 lignes (-131 lignes)

### Accomplishments
- AnimationExecutor émet vers BattleStateObserver (suppression de emitPostActionUpdates)
- BattleBuilder crée les composants non-Phaser (GridSystem, EffectRegistry, TurnController, BattleStateObserver)
- Composants visuels font leur propre mapping depuis les objets métier
- UI reçoit BattleState directement (suppression des accesseurs custom)

---

## Phase 3 - Adapter Pattern & Action Architecture ✅ COMPLETED

**Résultat** : BattleScene réduit de 624 à 486 lignes (-138 lignes, 22% reduction)

**Objectif** : Établir le pattern Adapter et refactorer Action/ActionResolution pour l'utiliser

### Problème actuel

BattleScene contient ~150 lignes d'orchestration d'actions avec des dépendances UI directes :
- `executeAction()` - dispatch par type de cible
- `startTileTargeting()` - appelle TargetingSystem directement
- `resolveTileAction()` - crée ActionResolution, fournit paramètres
- `executeEntityAction()` - montre OptionSelectionPanel directement
- `executeImmediateAction()` - résout sans paramètres

ActionResolution ne fait que stocker des paramètres et exécuter des effets. L'orchestration UI reste dans BattleScene.

### Architecture cible

```
BattleAdapter (interface)
    ├── promptTile(range) → Promise<Position | null>
    ├── promptOptions(prompt) → Promise<string[] | null>
    ├── animate(events) → Promise<void>
    ├── log(message) → void

Action (objet métier complet)
    ├── Définition + effets hydratés
    ├── parametrize() → Generator<ParameterPrompt>
    ├── applyEffects(params, context) → EffectResult
    └── resolve(actorId, adapter) → ActionResolution

ActionResolution (instance par utilisation)
    ├── Collecte params via adapter.promptX()
    ├── Applique effets via action.applyEffects()
    ├── Anime via adapter.animate()
    └── execute() → Promise<ActionResult>

BattleScene (implémente BattleAdapter, reste orchestrateur)
    └── executeAction() appelle action.resolve(actorId, this).execute()
```

### Principes clés

1. **BattleAdapter abstrait les interactions UI** :
   - Interface unique au lieu de multiples dépendances (targetingSystem, optionPanel, etc.)
   - Permet de tester Action/ActionResolution sans Phaser
   - Prépare le terrain pour Phase 4

2. **Action est un objet métier complet** :
   - Effets hydratés à la construction (pas de lookup EffectRegistry à l'exécution)
   - Contient la logique d'application des effets
   - `resolve()` reçoit l'adapter du caller

3. **ActionResolution gère le cycle complet** :
   - Collecte les paramètres via adapter
   - Applique les effets (logique pure dans Action)
   - Anime le résultat via adapter
   - Retourne ActionResult avec cancelled/success

### Interface BattleAdapter

```typescript
interface BattleAdapter {
  promptTile(range: number): Promise<Position | null>;
  promptOptions(prompt: OptionPrompt): Promise<string[] | null>;
  animate(events: AnimationEvent[]): Promise<void>;
  log(message: string): void;
}
```

### Action refactorisé

```typescript
class Action {
  constructor(
    private definition: ActionDefinition,
    private effects: HydratedEffect[],  // Effets avec implémentations attachées
    private contextFactory: (actorId: string) => GameContext
  ) {}

  get id(): string { return this.definition.id; }
  get name(): string { return this.definition.name; }
  get cost(): ActionCost { return this.definition.cost; }

  *parametrize(): Generator<ParameterPrompt> {
    for (const param of this.definition.parameters) {
      yield param;
    }
  }

  resolve(actorId: string, adapter: BattleAdapter): ActionResolution {
    return new ActionResolution(
      this,
      actorId,
      this.contextFactory(actorId),
      adapter
    );
  }

  applyEffects(params: Map<string, unknown>, context: GameContext): EffectResult {
    let chainResults = new Map<string, EffectResult>();
    let allEvents: AnimationEvent[] = [];

    for (const effect of this.effects) {
      const resolvedParams = this.resolveParams(effect.params, params, chainResults);
      const result = effect.execute(context, resolvedParams, {}, chainResults);
      chainResults.set(effect.id, result);
      allEvents.push(...result.events);

      if (!result.success) {
        return { success: false, events: allEvents, reason: result.reason };
      }
    }

    return { success: true, events: allEvents };
  }
}
```

### ActionResolution refactorisé

```typescript
class ActionResolution {
  private collectedValues = new Map<string, unknown>();

  constructor(
    private action: Action,
    private actorId: string,
    private context: GameContext,
    private adapter: BattleAdapter
  ) {}

  async execute(): Promise<ActionResult> {
    // Collecte des paramètres via adapter
    for (const prompt of this.action.parametrize()) {
      const value = await this.gatherParam(prompt);
      if (value === null) {
        return { cancelled: true, success: false, cost: this.action.cost, events: [] };
      }
      this.collectedValues.set(prompt.key, value);
    }

    // Application des effets (logique pure dans Action)
    const result = this.action.applyEffects(this.collectedValues, this.context);

    // Animation via adapter
    if (result.events.length > 0) {
      await this.adapter.animate(result.events);
    }

    return {
      cancelled: false,
      success: result.success,
      cost: this.action.cost,
      events: result.events,
      reason: result.reason
    };
  }

  private async gatherParam(prompt: ParameterPrompt): Promise<unknown | null> {
    switch (prompt.type) {
      case 'tile':
        return this.adapter.promptTile(prompt.range ?? 1);
      case 'option':
        return this.adapter.promptOptions(prompt);
      case 'entity':
        return 'monster';  // Pour l'instant, seule cible possible
      default:
        return null;
    }
  }
}
```

### ActionResult

```typescript
interface ActionResult {
  cancelled: boolean;  // User a annulé pendant la collecte de params
  success: boolean;    // Effets ont réussi (attaque touchée vs défendue)
  cost: ActionCost;
  events: AnimationEvent[];
  reason?: string;
}
```

### BattleScene implémente BattleAdapter

```typescript
class BattleScene extends Phaser.Scene implements BattleAdapter {
  // ... setup code ...

  // === BattleAdapter implementation ===

  async promptTile(range: number): Promise<Position | null> {
    const characterId = this.selectionManager.getSelected()!;
    return this.targetingSystem.showTileTargeting(characterId, range, 'action');
  }

  async promptOptions(prompt: OptionPrompt): Promise<string[] | null> {
    return this.optionSelectionPanel.show(prompt);
  }

  async animate(events: AnimationEvent[]): Promise<void> {
    await this.animationExecutor.execute(events);
  }

  log(message: string): void {
    this.battleUI.log(message);
  }

  // === Orchestration (reste dans BattleScene pour Phase 3) ===

  private async executeAction(actionId: string): Promise<void> {
    const actorId = this.selectionManager.getSelected()!;
    const action = this.state.actionRegistry.get(actionId);
    const resolution = action.resolve(actorId, this);  // BattleScene est l'adapter

    const result = await resolution.execute();

    if (result.cancelled) {
      return;  // User peut choisir une autre action
    }

    if (!result.success) {
      this.log(result.reason ?? 'Action failed');
    }

    this.advanceAndProcessTurn(actorId, result.cost.time);
  }
}
```

### Changements requis

| Fichier | Modification |
|---------|--------------|
| `BattleAdapter.ts` (nouveau) | Interface BattleAdapter |
| `Action.ts` (nouveau) | Classe Action avec effets hydratés |
| `ActionRegistry.ts` | Retourne des Action au lieu d'ActionDefinition |
| `ActionResolution.ts` | Refactor pour utiliser adapter au lieu de stocker params |
| `BattleScene.ts` | Implémente BattleAdapter, simplifie executeAction |

### Lignes économisées

| Changement | Lignes |
|------------|--------|
| Suppression executeAction/startTileTargeting/etc. | -140 |
| Ajout implémentation BattleAdapter | +20 |
| Appel simplifié dans executeAction | +10 |
| **Total** | **-110** |

**Résultat attendu** : BattleScene passe de ~609 à ~500 lignes

---

## Phase 4 - Controller Extraction ✅ COMPLETED

**Résultat** : BattleScene réduit de 486 à ~380 lignes (-106 lignes, 22% reduction)

### Accomplishments
- TurnFlowController extracted to `src/controllers/TurnFlowController.ts` (~100 lines)
- BattleAdapter extended with 4 new methods: showPlayerTurn, awaitPlayerAction, transition, delay
- BattleScene now implements extended BattleAdapter as thin adapter
- Turn orchestration logic (start loop, checkBattleStatus, executeMonsterTurn, executePlayerTurn) moved to controller
- 12 new unit tests in `features/unit/turn-flow-controller/` (4 feature files)
- All 333 unit tests pass, all 40 E2E tests pass

---

## Phase 4 - Controller Extraction (Details)

**Objectif** : Extraire TurnFlowController, BattleScene devient adaptateur mince

**Prérequis** : Phase 3 complétée (BattleAdapter existe, Action/ActionResolution l'utilisent)

### Problème restant après Phase 3

BattleScene contient encore la logique d'orchestration du combat :
- Boucle de tour (processNextTurn)
- Vérification victoire/défaite
- Tour du monstre
- Tour du joueur
- Avancement de la wheel

Cette logique est pure (pas de dépendance Phaser) mais reste dans BattleScene.

### Architecture cible

```
TurnFlowController (orchestrateur, logique pure)
    ├── start() → boucle principale
    ├── checkBattleStatus() → 'ongoing' | 'victory' | 'defeat'
    ├── executeMonsterTurn()
    ├── executePlayerTurn()
    └── manipule BattleState

BattleScene (adaptateur Phaser mince)
    ├── create() → setup visuals, démarre controller
    └── implémente BattleAdapter étendu
```

### Interface BattleAdapter étendue

```typescript
interface BattleAdapter {
  // Existant (Phase 3)
  promptTile(range: number): Promise<Position | null>;
  promptOptions(prompt: OptionPrompt): Promise<string[] | null>;
  animate(events: AnimationEvent[]): Promise<void>;
  log(message: string): void;

  // Nouveau (Phase 4)
  awaitPlayerAction(): Promise<string>;  // Attend sélection d'action
  transition(scene: string, data: object): void;  // Changement de scène
  delay(ms: number): Promise<void>;  // Délai entre tours
}
```

### TurnFlowController

```typescript
class TurnFlowController {
  constructor(
    private state: BattleState,
    private adapter: BattleAdapter
  ) {}

  async start(): Promise<void> {
    while (true) {
      const status = this.checkBattleStatus();
      if (status === 'victory') {
        this.adapter.transition('VictoryScene', { victory: true });
        return;
      }
      if (status === 'defeat') {
        this.adapter.transition('VictoryScene', { victory: false });
        return;
      }

      const actorId = this.getNextActor();
      this.state.stateObserver.emitActorChanged(actorId);

      if (actorId === 'monster') {
        await this.executeMonsterTurn();
      } else {
        await this.executePlayerTurn(actorId);
      }
    }
  }

  private async executeMonsterTurn(): Promise<void> {
    const decision = this.state.monsterEntity.decideTurn(this.getAliveHeroes());
    const events = this.state.monsterEntity.executeDecision(decision);
    await this.adapter.animate(events);
    this.advanceWheel('monster', decision.wheelCost);
    await this.adapter.delay(300);
  }

  private async executePlayerTurn(actorId: string): Promise<void> {
    while (true) {
      const actionId = await this.adapter.awaitPlayerAction();
      const action = this.state.actionRegistry.get(actionId);
      const resolution = action.resolve(actorId, this.adapter);

      const result = await resolution.execute();

      if (result.cancelled) {
        continue;  // User peut choisir une autre action
      }

      this.advanceWheel(actorId, result.cost.time);
      await this.adapter.delay(300);
      return;
    }
  }

  private checkBattleStatus(): 'ongoing' | 'victory' | 'defeat' {
    if (this.state.monsterEntity.isDead()) return 'victory';
    if (this.getAliveHeroes().length === 0) return 'defeat';
    return 'ongoing';
  }

  private getNextActor(): string {
    return this.state.wheel.getNextActor();
  }

  private advanceWheel(actorId: string, cost: number): void {
    this.state.wheel.advance(actorId, cost);
  }

  private getAliveHeroes(): string[] {
    return this.state.characters
      .filter(c => !this.state.getEntity(c.id)?.isDead)
      .map(c => c.id);
  }
}
```

### BattleScene réduit

```typescript
class BattleScene extends Phaser.Scene implements BattleAdapter {
  private controller!: TurnFlowController;

  create(): void {
    this.setupVisuals();
    this.setupUI();

    this.controller = new TurnFlowController(this.state, this);
    this.controller.start();
  }

  // === BattleAdapter implementation ===

  async promptTile(range: number): Promise<Position | null> {
    const characterId = this.selectionManager.getSelected()!;
    return this.targetingSystem.showTileTargeting(characterId, range, 'action');
  }

  async promptOptions(prompt: OptionPrompt): Promise<string[] | null> {
    return this.optionSelectionPanel.show(prompt);
  }

  async animate(events: AnimationEvent[]): Promise<void> {
    await this.animationExecutor.execute(events);
  }

  log(message: string): void {
    this.battleUI.log(message);
  }

  async awaitPlayerAction(): Promise<string> {
    return new Promise(resolve => {
      this.selectedHeroPanel.onAction(resolve);
    });
  }

  transition(scene: string, data: object): void {
    this.scene.start(scene, data);
  }

  delay(ms: number): Promise<void> {
    return new Promise(r => this.time.delayedCall(ms, r));
  }
}
```

### Changements requis

| Fichier | Modification |
|---------|--------------|
| `TurnFlowController.ts` (nouveau) | Logique d'orchestration extraite |
| `BattleAdapter.ts` | Ajouter awaitPlayerAction, transition, delay |
| `BattleScene.ts` | Supprimer orchestration, ajouter méthodes adapter |

### Lignes économisées

| Changement | Lignes |
|------------|--------|
| Suppression processNextTurn/executeMonsterTurn/etc. | -150 |
| Ajout méthodes adapter (awaitPlayerAction, etc.) | +20 |
| **Total dans BattleScene** | **-130** |

**Résultat final** : BattleScene passe de ~500 à ~100 lignes (setup + adapter methods)

### Testabilité

| Composant | Lignes | Testable sans Phaser ? |
|-----------|--------|------------------------|
| TurnFlowController | ~80 | ✅ Oui (mock adapter) |
| ActionResolution | ~60 | ✅ Oui (mock adapter) |
| Action | ~100 | ✅ Oui (logique pure) |
| BattleScene | ~100 | Non (mais juste du glue Phaser) |

---

## TDD Implementation Steps

Each step follows Red-Green-Refactor. Write the failing test first, then implement.

---

### Phase 3 - Adapter Pattern & Action Architecture

#### Step 3.1: Types & Interfaces ✅

**Files**: `src/types/BattleAdapter.ts`, `src/types/ActionResult.ts`

No tests needed - just type definitions.

```typescript
// BattleAdapter.ts
interface BattleAdapter {
  promptTile(range: number): Promise<Position | null>;
  promptOptions(prompt: OptionPrompt): Promise<string[] | null>;
  animate(events: AnimationEvent[]): Promise<void>;
  log(message: string): void;
}

// ActionResult.ts
interface ActionResult {
  cancelled: boolean;
  success: boolean;
  cost: ActionCost;
  events: AnimationEvent[];
  reason?: string;
}
```

---

#### Step 3.2: Action.parametrize() ✅

**Test file**: `features/unit/action/parametrize.feature`

```gherkin
Feature: Action parameter generation

  Scenario: Action yields parameter prompts from definition
    Given an action definition with parameters:
      | key    | type   | range |
      | target | tile   | 2     |
    When I iterate over parametrize()
    Then I receive prompts for each parameter

  Scenario: Action with no parameters yields nothing
    Given an action definition with no parameters
    When I iterate over parametrize()
    Then I receive no prompts
```

**Implementation**: Create `Action` class with `parametrize()` generator.

---

#### Step 3.3: Action.applyEffects() - single effect ✅

**Test file**: `features/unit/action/apply-effects.feature`

```gherkin
Feature: Action effect application

  Scenario: Single effect executes and returns events
    Given an action with a "damage" effect
    And a mock GameContext
    When I call applyEffects with params { target: "monster" }
    Then the effect is executed with resolved params
    And I receive the animation events
    And success is true
```

**Implementation**: Add `applyEffects()` with single effect execution.

---

#### Step 3.4: Action.applyEffects() - effect chaining ✅

**Test file**: Same feature file, new scenario

```gherkin
  Scenario: Effects can reference previous effect results
    Given an action with effects:
      | id     | type   | params                          |
      | eff1   | move   | { target: "$parameter.target" } |
      | eff2   | damage | { position: "$eff1.newPosition" } |
    When I call applyEffects with params { target: {x:1, y:1} }
    Then eff2 receives the resolved position from eff1
```

**Implementation**: Add `chainResults` Map and parameter resolution.

---

#### Step 3.5: Action.applyEffects() - early termination ✅

**Test file**: Same feature file, new scenario

```gherkin
  Scenario: Effect chain stops on failure
    Given an action with effects:
      | id   | type   | willFail |
      | eff1 | attack | true     |
      | eff2 | damage | false    |
    When I call applyEffects
    Then only eff1 is executed
    And success is false
    And reason contains the failure message
```

**Implementation**: Add early return on `!result.success`.

---

#### Step 3.6: ActionResolution.execute() - no params

**Test file**: `features/unit/action-resolution/execute.feature`

```gherkin
Feature: ActionResolution execution

  Scenario: Action with no parameters executes immediately
    Given an action with no parameters
    And effects that return [damageEvent]
    And a mock BattleAdapter
    When I call resolution.execute()
    Then adapter.animate is called with [damageEvent]
    And result.cancelled is false
    And result.success is true
```

**Implementation**: Create `ActionResolution` with basic `execute()`.

---

#### Step 3.7: ActionResolution.execute() - tile parameter

**Test file**: Same feature file, new scenario

```gherkin
  Scenario: Tile parameter prompts via adapter
    Given an action with a tile parameter (range: 3)
    And adapter.promptTile will return {x: 2, y: 1}
    When I call resolution.execute()
    Then adapter.promptTile is called with range 3
    And effects receive target = {x: 2, y: 1}
```

**Implementation**: Add `gatherParam()` with tile case.

---

#### Step 3.8: ActionResolution.execute() - option parameter

**Test file**: Same feature file, new scenario

```gherkin
  Scenario: Option parameter prompts via adapter
    Given an action with an option parameter
    And adapter.promptOptions will return ["power"]
    When I call resolution.execute()
    Then adapter.promptOptions is called with the prompt
    And effects receive the selected options
```

**Implementation**: Add option case to `gatherParam()`.

---

#### Step 3.9: ActionResolution.execute() - cancellation

**Test file**: Same feature file, new scenario

```gherkin
  Scenario: User cancels during parameter gathering
    Given an action with a tile parameter
    And adapter.promptTile will return null
    When I call resolution.execute()
    Then result.cancelled is true
    And adapter.animate is not called
    And effects are not executed
```

**Implementation**: Add null check and early return with `cancelled: true`.

---

#### Step 3.10: ActionRegistry returns Action

**Test file**: `features/unit/action-registry/hydration.feature`

```gherkin
Feature: ActionRegistry hydrates actions

  Scenario: Registry returns Action with hydrated effects
    Given an ActionDefinition with effect type "attack"
    And an EffectRegistry with AttackEffect registered
    When I call actionRegistry.get("strike")
    Then I receive an Action instance
    And the action has hydrated effects (not strings)

  Scenario: Registry caches hydrated actions
    When I call actionRegistry.get("strike") twice
    Then I receive the same Action instance
```

**Implementation**: Modify `ActionRegistry` to hydrate and cache `Action` instances.

---

#### Step 3.11: Integration - BattleScene executeAction

**Test file**: `features/integration/battle-scene-action.feature`

```gherkin
Feature: BattleScene action execution

  Scenario: Execute move action via adapter pattern
    Given a battle scene with a selected hero
    And the hero has action "move"
    When executeAction("move") is called
    And user selects tile {x: 2, y: 1}
    Then the hero moves to {x: 2, y: 1}
    And the turn advances

  Scenario: Cancel action returns to action selection
    Given a battle scene with a selected hero
    When executeAction("move") is called
    And user cancels tile selection
    Then the hero does not move
    And the turn does not advance
```

**Implementation**:
1. BattleScene implements BattleAdapter
2. Simplify executeAction to use action.resolve(actorId, this).execute()
3. Remove startTileTargeting, resolveTileAction, etc.

---

### Phase 4 - Controller Extraction

#### Step 4.1: Extended BattleAdapter interface

**Files**: Update `src/types/BattleAdapter.ts`

```typescript
interface BattleAdapter {
  // Phase 3
  promptTile(range: number): Promise<Position | null>;
  promptOptions(prompt: OptionPrompt): Promise<string[] | null>;
  animate(events: AnimationEvent[]): Promise<void>;
  log(message: string): void;

  // Phase 4
  awaitPlayerAction(): Promise<string>;
  transition(scene: string, data: object): void;
  delay(ms: number): Promise<void>;
}
```

---

#### Step 4.2: TurnFlowController.checkBattleStatus()

**Test file**: `features/unit/turn-flow-controller/battle-status.feature`

```gherkin
Feature: Battle status detection

  Scenario: Victory when monster is dead
    Given a BattleState where monster.isDead() is true
    When I call checkBattleStatus()
    Then it returns "victory"

  Scenario: Defeat when all heroes are dead
    Given a BattleState where all heroes are dead
    When I call checkBattleStatus()
    Then it returns "defeat"

  Scenario: Ongoing when battle continues
    Given a BattleState with alive monster and heroes
    When I call checkBattleStatus()
    Then it returns "ongoing"
```

**Implementation**: Create `TurnFlowController` with `checkBattleStatus()`.

---

#### Step 4.3: TurnFlowController.executeMonsterTurn()

**Test file**: `features/unit/turn-flow-controller/monster-turn.feature`

```gherkin
Feature: Monster turn execution

  Scenario: Monster decides and executes turn
    Given a TurnFlowController with mock adapter
    And monster.decideTurn returns { action: "attack", wheelCost: 30 }
    And monster.executeDecision returns [attackEvent]
    When I call executeMonsterTurn()
    Then adapter.animate is called with [attackEvent]
    And wheel.advance is called with ("monster", 30)
    And adapter.delay is called with 300
```

**Implementation**: Add `executeMonsterTurn()` method.

---

#### Step 4.4: TurnFlowController.executePlayerTurn() - success

**Test file**: `features/unit/turn-flow-controller/player-turn.feature`

```gherkin
Feature: Player turn execution

  Scenario: Player executes action successfully
    Given a TurnFlowController with mock adapter
    And adapter.awaitPlayerAction returns "strike"
    And action "strike" resolves successfully with cost { time: 20 }
    When I call executePlayerTurn("hero-0")
    Then adapter.awaitPlayerAction is called
    And action.resolve is called with ("hero-0", adapter)
    And wheel.advance is called with ("hero-0", 20)
```

**Implementation**: Add `executePlayerTurn()` method.

---

#### Step 4.5: TurnFlowController.executePlayerTurn() - cancellation loop

**Test file**: Same feature file, new scenario

```gherkin
  Scenario: Player cancels and chooses another action
    Given a TurnFlowController with mock adapter
    And adapter.awaitPlayerAction returns "move" then "strike"
    And action "move" is cancelled by user
    And action "strike" succeeds
    When I call executePlayerTurn("hero-0")
    Then adapter.awaitPlayerAction is called twice
    And only "strike" advances the wheel
```

**Implementation**: Add while loop for cancellation handling.

---

#### Step 4.6: TurnFlowController.start() - victory transition

**Test file**: `features/unit/turn-flow-controller/game-loop.feature`

```gherkin
Feature: Turn flow game loop

  Scenario: Victory triggers scene transition
    Given a TurnFlowController
    And checkBattleStatus returns "victory"
    When I call start()
    Then adapter.transition is called with ("VictoryScene", { victory: true })
    And the loop exits

  Scenario: Defeat triggers scene transition
    Given a TurnFlowController
    And checkBattleStatus returns "defeat"
    When I call start()
    Then adapter.transition is called with ("VictoryScene", { victory: false })
```

**Implementation**: Add `start()` with victory/defeat checks.

---

#### Step 4.7: TurnFlowController.start() - turn alternation

**Test file**: Same feature file, new scenario

```gherkin
  Scenario: Turns alternate between monster and heroes
    Given a TurnFlowController
    And wheel.getNextActor returns "hero-0", "monster", "hero-1" then victory
    When I call start()
    Then executePlayerTurn is called for "hero-0"
    Then executeMonsterTurn is called
    Then executePlayerTurn is called for "hero-1"
    Then transition is called
```

**Implementation**: Complete the `start()` loop.

---

#### Step 4.8: Integration - BattleScene with TurnFlowController

**Test file**: `features/e2e/battle-flow.feature`

```gherkin
Feature: Battle flow E2E

  Scenario: Full battle with controller
    Given a battle scene starts
    Then TurnFlowController.start() is running
    When the first hero's turn comes
    And I select action "move"
    And I select a tile
    Then the hero moves
    And the turn advances to the next actor
```

**Implementation**:
1. Add awaitPlayerAction, transition, delay to BattleScene
2. Create TurnFlowController in BattleScene.create()
3. Remove processNextTurn, executeMonsterTurn, etc. from BattleScene

---

## Summary

| Phase | Steps | New Tests | Key Deliverables |
|-------|-------|-----------|------------------|
| 3 | 11 | ~15 scenarios | BattleAdapter, Action, ActionResolution refactored |
| 4 | 8 | ~10 scenarios | TurnFlowController, BattleScene reduced to ~100 lines |

Each step is independently testable and builds on previous steps. Integration tests (3.11, 4.8) validate that the pieces work together.
