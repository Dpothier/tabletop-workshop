import Phaser from 'phaser';
import type { Monster, CharacterClass } from '@src/systems/DataLoader';
import { GridSystem } from '@src/systems/GridSystem';
import type { ActionRegistry } from '@src/systems/ActionRegistry';
import type { TurnController } from '@src/systems/TurnController';
import type { EffectRegistry } from '@src/systems/EffectRegistry';
import type { BattleStateObserver } from '@src/systems/BattleStateObserver';
import { SelectionManager } from '@src/systems/SelectionManager';
import { TargetingSystem, TargetingDeps } from '@src/systems/TargetingSystem';

import type { BattleGrid } from '@src/state/BattleGrid';
import type { BattleState } from '@src/state/BattleState';
import type { Character } from '@src/entities/Character';
import type { MonsterEntity } from '@src/entities/MonsterEntity';
import type { ActionDefinition } from '@src/types/ActionDefinition';
import { CharacterVisual, MonsterVisual } from '@src/visuals';
import { GridVisual } from '@src/visuals/GridVisual';
import { BattleUI } from '@src/ui/BattleUI';
import { AnimationExecutor } from '@src/ui/AnimationExecutor';
import { HeroSelectionBar } from '@src/ui/HeroSelectionBar';
import { SelectedHeroPanel } from '@src/ui/SelectedHeroPanel';
import { OptionSelectionPanel } from '@src/ui/OptionSelectionPanel';
import { ActionResolution } from '@src/systems/ActionResolution';
import { getTargetType, getWheelCost, getActionRange } from '@src/utils/actionCompat';
import type { OptionPrompt } from '@src/types/ParameterPrompt';

interface BattleData {
  state: BattleState;
}

export class BattleScene extends Phaser.Scene {
  // === BATTLE STATE (received from BattleBuilder) ===
  private state!: BattleState;

  // === VISUALS (Rendering - created in create()) ===
  private characterVisuals: Map<string, CharacterVisual> = new Map();
  private monsterVisual!: MonsterVisual;
  private gridVisual!: GridVisual;

  // Systems (Phaser-dependent)
  private gridSystem!: GridSystem;

  // Turn controller for pure turn logic
  private turnController!: TurnController;

  // Selection manager for character selection state
  private selectionManager!: SelectionManager;

  // Targeting system for tile selection
  private targetingSystem!: TargetingSystem;

  // State observer for reactive UI updates
  private stateObserver!: BattleStateObserver;

  // Turn state
  private currentActorId: string | null = null;

  // Valid movement tiles for E2E testing
  public currentValidMoves: { x: number; y: number }[] = [];

  // Effect registry for action resolution
  private effectRegistry!: EffectRegistry;

  // Expose log messages for E2E testing
  public get logMessages(): string[] {
    return this.battleUI?.getLogMessages() ?? [];
  }

  // Expose selected character ID for E2E testing
  public get selectedCharacterId(): string | null {
    return this.selectionManager?.getSelected() ?? null;
  }

  // Expose action wheel for E2E testing
  public get actionWheel() {
    return this.state?.wheel;
  }

  // Constants
  private readonly GRID_SIZE = 64;
  private readonly GRID_OFFSET_X = 80;
  private readonly GRID_OFFSET_Y = 80;

  // UI
  private battleUI!: BattleUI;
  private animationExecutor!: AnimationExecutor;
  public heroSelectionBar!: HeroSelectionBar;
  public selectedHeroPanel!: SelectedHeroPanel;
  private optionSelectionPanel?: OptionSelectionPanel;

  // Convenience getters for state access
  private get arena() {
    return this.state.arena;
  }
  private get monster(): Monster {
    return this.state.monster;
  }
  private get classes(): CharacterClass[] {
    return this.state.classes;
  }
  private get battleGrid(): BattleGrid {
    return this.state.grid;
  }
  private get characters(): Character[] {
    return this.state.characters;
  }
  private get monsterEntity(): MonsterEntity {
    return this.state.monsterEntity;
  }
  private get actionRegistry(): ActionRegistry {
    return this.state.actionRegistry;
  }

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: BattleData): void {
    this.state = data.state;
  }

  /**
   * Create TargetingDeps that provides access to scene subsystems.
   */
  private createTargetingDeps(): TargetingDeps {
    return {
      getValidMoves: (entityId, range) => {
        const moves = this.battleGrid.getValidMoves(entityId, range);
        this.currentValidMoves = moves; // Store for E2E testing
        return moves;
      },
      highlightTiles: (tiles, color) => this.gridVisual.highlightTiles(tiles, color),
      removeHighlight: (highlight) => {
        this.gridVisual.removeHighlight(highlight as Phaser.GameObjects.Graphics);
        this.currentValidMoves = []; // Clear after highlight removed
      },
      worldToGrid: (world) => this.gridSystem.worldToGrid(world),
      onPointerDown: (callback) => {
        // Delay to avoid capturing the button click that triggered targeting
        this.time.delayedCall(50, () => {
          this.input.once('pointerdown', (pointer: Phaser.Input.Pointer) => {
            callback(pointer.x, pointer.y);
          });
        });
      },
      log: (message) => this.battleUI.log(message),
    };
  }

  create(): void {
    // GridSystem is Phaser-dependent, created here
    this.gridSystem = new GridSystem(
      this.GRID_SIZE,
      this.GRID_OFFSET_X,
      this.GRID_OFFSET_Y,
      this.arena.width,
      this.arena.height
    );

    // Clear visual maps for fresh scene
    this.characterVisuals = new Map();

    this.gridVisual = new GridVisual(this, {
      arena: this.arena,
      gridSystem: this.gridSystem,
    });
    this.gridVisual.draw();
    this.createVisuals();

    // Initialize SelectionManager
    this.selectionManager = new SelectionManager(this.characterVisuals);

    // Initialize TargetingSystem
    this.targetingSystem = new TargetingSystem(this.createTargetingDeps());

    this.createBattleUI();
    // Get TurnController from state
    this.turnController = this.state.turnController;
    this.processTurn();
  }

  private createBattleUI(): void {
    this.battleUI = new BattleUI(this);
    this.battleUI.createAllPanels();

    // Create hero selection bar
    this.createHeroSelectionBar();

    // Create selected hero panel
    this.createSelectedHeroPanel();

    // Get state observer from state BEFORE AnimationExecutor
    this.stateObserver = this.state.stateObserver;

    // Create animation executor after UI and visuals are ready
    this.animationExecutor = new AnimationExecutor(
      this.gridSystem,
      this.characterVisuals,
      this.monsterVisual,
      this.battleUI,
      this.stateObserver,
      {
        getHeroBeadCounts: (heroId: string) => {
          const char = this.characters.find((c) => c.id === heroId);
          return char?.getHandCounts();
        },
        getMonsterDiscardedCounts: () => {
          return this.monsterEntity.hasBeadBag()
            ? (this.monsterEntity.getDiscardedCounts() ?? null)
            : null;
        },
      }
    );

    // Get effect registry from state
    this.effectRegistry = this.state.effectRegistry;

    // Create option selection panel
    this.optionSelectionPanel = new OptionSelectionPanel(this);

    // Subscribe UI components to state changes
    this.battleUI.subscribeToState(this.stateObserver, this.state, () =>
      this.selectionManager.getSelected()
    );
    this.heroSelectionBar.subscribeToState(this.stateObserver);
    this.selectedHeroPanel.subscribeToState(this.stateObserver, this.state);

    // Subscribe visuals to state observer for reactive updates
    for (const [heroId, visual] of this.characterVisuals) {
      visual.subscribeToState(this.stateObserver, heroId);
    }
    this.monsterVisual.subscribeToState(this.stateObserver);
  }

  private createHeroSelectionBar(): void {
    this.heroSelectionBar = new HeroSelectionBar(this);
    this.heroSelectionBar.createFromEntities(this.characters, this.classes);
    this.heroSelectionBar.onHeroClick((heroId) => this.handleHeroBarClick(heroId));
  }

  private handleHeroBarClick(heroId: string): void {
    // Use same logic as selectCharacter
    this.selectCharacter(heroId);
  }

  private createSelectedHeroPanel(): void {
    this.selectedHeroPanel = new SelectedHeroPanel(this);
    const actions = this.actionRegistry.getAll();
    this.selectedHeroPanel.create(actions, (actionId) => this.executeAction(actionId));
  }

  /**
   * Create visual representations for state entities.
   * State objects already exist from BattleBuilder.
   */
  private createVisuals(): void {
    const classColors = [0x4488ff, 0xff4444, 0x44ff44, 0xffff44];

    // Create character visuals from state entities
    for (let i = 0; i < this.characters.length; i++) {
      const character = this.characters[i];
      const charClass = this.classes[i % this.classes.length];
      const visual = CharacterVisual.fromEntity(
        this,
        character,
        charClass,
        this.gridSystem,
        i,
        classColors[i]
      );
      if (visual) {
        this.characterVisuals.set(character.id, visual);
      }
    }

    // Create monster visual from state entity
    const visual = MonsterVisual.fromEntity(
      this,
      this.monsterEntity,
      this.monster,
      this.gridSystem
    );
    if (visual) {
      this.monsterVisual = visual;
    }
  }

  /**
   * Main turn processing loop - called after each action
   */
  private processTurn(): void {
    // Check battle status via TurnController
    const status = this.turnController.getBattleStatus();
    if (status === 'victory') {
      this.victory();
      return;
    }
    if (status === 'defeat') {
      this.defeat();
      return;
    }

    // Get next actor from wheel
    this.currentActorId = this.turnController.getNextActor();

    if (!this.currentActorId) {
      this.battleUI.log('No actors on wheel!');
      return;
    }

    this.stateObserver.emitActorChanged(this.currentActorId);

    if (this.currentActorId === 'monster') {
      this.battleUI.log('--- Monster Turn ---');
      this.time.delayedCall(500, () => this.executeMonsterTurn());
    } else {
      this.battleUI.log('--- Player Turn ---');
      this.showPlayerActions();
    }
  }

  private showPlayerActions(): void {
    // Select the current actor
    const currentCharacter = this.characters.find((c) => c.id === this.currentActorId);
    if (currentCharacter && currentCharacter.isAlive()) {
      this.selectionManager.select(currentCharacter.id);
    }

    // Make characters clickable (validation happens in selectCharacter)
    for (const character of this.characters) {
      if (character.isAlive()) {
        const visual = this.characterVisuals.get(character.id);
        visual?.setInteractive(true);
        visual?.onClick(() => this.selectCharacter(character.id));
      }
    }

    this.stateObserver.emitSelectionChanged(currentCharacter?.id ?? null);
  }

  private selectCharacter(characterId: string): void {
    if (this.currentActorId === 'monster') return;

    // Verify this is the current actor
    if (characterId !== this.currentActorId) {
      const character = this.characters.find((c) => c.id === characterId);
      if (character) {
        this.battleUI.log(`Not this character's turn`);
      }
      return;
    }

    // Update selection
    this.selectionManager.select(characterId);
    const visual = this.characterVisuals.get(characterId);

    // Show selected hero panel
    this.selectedHeroPanel.showPanel(characterId);

    this.stateObserver.emitSelectionChanged(characterId);
    this.battleUI.log(`Selected: ${visual?.getClassName() || characterId}`);
  }

  /**
   * Unified action execution - handles all action types based on their definition.
   */
  private executeAction(actionId: string): void {
    const selectedCharId = this.selectionManager.getSelected();
    if (!selectedCharId) return;

    const action = this.actionRegistry.get(actionId);
    if (!action) {
      this.battleUI.log(`Unknown action: ${actionId}`);
      return;
    }

    switch (getTargetType(action)) {
      case 'tile':
        this.startTileTargeting(action);
        break;
      case 'entity':
        this.executeEntityAction(action);
        break;
      case 'none':
        this.executeImmediateAction(action);
        break;
    }
  }

  /**
   * Start tile targeting for movement-type actions.
   */
  private hasOptionParameters(action: ActionDefinition): OptionPrompt | undefined {
    return action.parameters.find((p) => p.type === 'option') as OptionPrompt | undefined;
  }

  private async startTileTargeting(action: ActionDefinition): Promise<void> {
    const selectedCharId = this.selectionManager.getSelected();
    if (!selectedCharId) return;

    const character = this.characters.find((c) => c.id === selectedCharId);
    if (!character) return;

    const currentPos = character.getPosition();
    if (!currentPos) return;

    const range = getActionRange(action);

    // Use TargetingSystem for tile selection
    const position = await this.targetingSystem.showTileTargeting(
      selectedCharId,
      range,
      action.name
    );

    if (position) {
      await this.resolveTileAction(character, action, position.x, position.y);
    } else {
      this.battleUI.log('Invalid move');
    }
  }

  /**
   * Resolve a tile-targeted action (movement).
   */
  private async resolveTileAction(
    character: Character,
    action: ActionDefinition,
    gridX: number,
    gridY: number
  ): Promise<void> {
    const context = this.state.createGameContext(character.id);

    // Create and execute action resolution
    const resolution = new ActionResolution(character.id, action, context, this.effectRegistry);

    // Provide the target parameter
    resolution.provideValue('target', { x: gridX, y: gridY });

    // Resolve the action
    const result = resolution.resolve();

    if (!result.success) {
      this.battleUI.log(result.reason || `${action.name} failed`);
      return;
    }

    await this.animationExecutor.execute(result.events);

    const visual = this.characterVisuals.get(character.id);
    this.battleUI.log(`${visual?.getClassName() || character.id} ${action.name.toLowerCase()}d`);
    this.advanceAndProcessTurn(this.currentActorId!, getWheelCost(action));
  }

  /**
   * Execute an entity-targeted action (attack).
   */
  private async executeEntityAction(action: ActionDefinition): Promise<void> {
    const selectedCharId = this.selectionManager.getSelected();
    if (!selectedCharId) return;

    const character = this.characters.find((c) => c.id === selectedCharId);
    if (!character) return;

    const context = this.state.createGameContext(character.id);

    // Create and execute action resolution
    const resolution = new ActionResolution(character.id, action, context, this.effectRegistry);

    // Provide the target parameter (monster)
    resolution.provideValue('target', 'monster');

    // Check for option parameters
    const optionParam = this.hasOptionParameters(action);
    if (optionParam && this.optionSelectionPanel) {
      // Show option selection UI
      const beadCounts = character.getHandCounts() || { red: 0, blue: 0, green: 0, white: 0 };

      this.optionSelectionPanel.show({
        prompt: optionParam.prompt,
        options: optionParam.options,
        multiSelect: optionParam.multiSelect ?? false,
        availableBeads: beadCounts,
        availableTime: 0, // Options don't typically have time cost
        onConfirm: async (selectedIds: string[]): Promise<void> => {
          // Provide options to resolution
          if (selectedIds.length > 0) {
            resolution.provideValue(optionParam.key, selectedIds);
          }

          // Continue with resolution
          const result = resolution.resolve();
          if (!result.success) {
            this.battleUI.log(result.reason || `${action.name} failed`);
            return;
          }

          await this.animationExecutor.execute(result.events);
          this.advanceAndProcessTurn(this.currentActorId!, getWheelCost(action));
        },
        onCancel: (): void => {
          this.battleUI.log('Action cancelled');
        },
      });
      return; // Exit - continuation handled by callbacks
    }

    // No options - resolve immediately (existing flow)
    const result = resolution.resolve();

    if (!result.success) {
      this.battleUI.log(result.reason || `${action.name} failed`);
      return;
    }

    await this.animationExecutor.execute(result.events);

    this.advanceAndProcessTurn(this.currentActorId!, getWheelCost(action));
  }

  /**
   * Execute an immediate action (rest, buffs).
   */
  private async executeImmediateAction(action: ActionDefinition): Promise<void> {
    const selectedCharId = this.selectionManager.getSelected();
    if (!selectedCharId) return;

    const character = this.characters.find((c) => c.id === selectedCharId);
    if (!character) return;

    const context = this.state.createGameContext(character.id);

    // Create and execute action resolution
    const resolution = new ActionResolution(character.id, action, context, this.effectRegistry);

    // No parameters to provide - resolve immediately
    const result = resolution.resolve();

    if (!result.success) {
      this.battleUI.log(result.reason || `${action.name} failed`);
      return;
    }

    await this.animationExecutor.execute(result.events);

    this.advanceAndProcessTurn(this.currentActorId!, getWheelCost(action));
  }

  private advanceAndProcessTurn(entityId: string, wheelCost: number): void {
    this.turnController.advanceTurn(entityId, wheelCost);

    // Clear selection
    this.selectionManager.deselect();

    // Small delay before next turn
    this.time.delayedCall(300, () => this.processTurn());
  }

  private async executeMonsterTurn(): Promise<void> {
    if (!this.monsterEntity.hasBeadBag() || !this.monsterEntity.hasStateMachine()) {
      this.battleUI.log('Monster has no bead system!');
      this.advanceAndProcessTurn('monster', 2);
      return;
    }

    // Get alive characters as targets
    const targets = this.characters.filter((c) => c.isAlive());

    // Phase 1: Decide - get the monster's decision
    const decision = this.monsterEntity.decideTurn(targets);

    // Phase 1: Execute - apply state changes and get events
    const events = this.monsterEntity.executeDecision(decision);

    // Phase 2: Animate - play all events
    await this.animationExecutor.execute(events);

    // Check for defeat after damage
    const aliveChars = this.characters.filter((c) => c.isAlive());
    if (aliveChars.length === 0) {
      this.time.delayedCall(500, () => this.defeat());
      return;
    }

    // Phase 3: Advance turn
    this.advanceAndProcessTurn('monster', decision.wheelCost);
  }

  private victory(): void {
    this.scene.start('VictoryScene', {
      victory: true,
      monster: this.monster.name,
      turns: 0,
    });
  }

  private defeat(): void {
    this.scene.start('VictoryScene', {
      victory: false,
      monster: this.monster.name,
      turns: 0,
    });
  }

  shutdown(): void {
    this.optionSelectionPanel?.destroy();
    this.gridVisual?.destroy();
  }
}
