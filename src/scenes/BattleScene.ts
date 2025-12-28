import Phaser from 'phaser';
import type { Monster, CharacterClass } from '@src/systems/DataLoader';
import { GridSystem } from '@src/systems/GridSystem';
import type { ActionWheel } from '@src/systems/ActionWheel';
import type { ActionRegistry } from '@src/systems/ActionRegistry';

import type { BattleGrid } from '@src/state/BattleGrid';
import type { BattleState } from '@src/state/BattleState';
import type { Character } from '@src/entities/Character';
import type { MonsterEntity } from '@src/entities/MonsterEntity';
import type { ActionDefinition } from '@src/types/ActionDefinition';
import { CharacterVisual, MonsterVisual } from '@src/visuals';
import { BattleUI } from '@src/ui/BattleUI';
import { AnimationExecutor } from '@src/ui/AnimationExecutor';
import { HeroSelectionBar, HeroCardData } from '@src/ui/HeroSelectionBar';
import { SelectedHeroPanel } from '@src/ui/SelectedHeroPanel';
import { OptionSelectionPanel } from '@src/ui/OptionSelectionPanel';
import { ActionResolution } from '@src/systems/ActionResolution';
import { EffectRegistry } from '@src/systems/EffectRegistry';
import { MoveEffect } from '@src/effects/MoveEffect';
import { AttackEffect } from '@src/effects/AttackEffect';
import { DrawBeadsEffect } from '@src/effects/DrawBeadsEffect';
import { getTargetType, getWheelCost, getActionRange } from '@src/utils/actionCompat';
import type { GameContext } from '@src/types/Effect';
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
  private grid!: Phaser.GameObjects.Graphics;

  // Systems (Phaser-dependent)
  private gridSystem!: GridSystem;

  // Turn state
  private currentActorId: string | null = null;
  private selectedCharacterId: string | null = null;

  // Valid movement tiles for E2E testing
  public currentValidMoves: { x: number; y: number }[] = [];

  // Effect registry for action resolution
  private effectRegistry!: EffectRegistry;

  // Expose log messages for E2E testing
  public get logMessages(): string[] {
    return this.battleUI?.getLogMessages() ?? [];
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
  private get actionWheel(): ActionWheel {
    return this.state.wheel;
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

    this.drawGrid();
    this.createVisuals();
    this.createBattleUI();
    this.processTurn();
  }

  private createBattleUI(): void {
    this.battleUI = new BattleUI(this);
    this.battleUI.createAllPanels();

    // Create hero selection bar
    this.createHeroSelectionBar();

    // Create selected hero panel
    this.createSelectedHeroPanel();

    // Create animation executor after UI and visuals are ready
    this.animationExecutor = new AnimationExecutor(
      this.gridSystem,
      this.characterVisuals,
      this.monsterVisual,
      this.battleUI
    );

    // Initialize effect registry
    this.effectRegistry = new EffectRegistry();
    this.effectRegistry.register('move', new MoveEffect());
    this.effectRegistry.register('attack', new AttackEffect());
    this.effectRegistry.register('drawBeads', new DrawBeadsEffect());

    // Create option selection panel
    this.optionSelectionPanel = new OptionSelectionPanel(this);
  }

  private createHeroSelectionBar(): void {
    this.heroSelectionBar = new HeroSelectionBar(this);

    // Build hero card data from characters
    const heroCardData: HeroCardData[] = this.characters.map((character, index) => {
      const charClass = this.classes[index % this.classes.length];
      const beadCounts = character.getHandCounts() ?? { red: 0, blue: 0, green: 0, white: 0 };
      const classColors = [0x4488ff, 0xff4444, 0x44ff44, 0xffff44];

      return {
        heroId: character.id,
        className: charClass.name,
        classIcon: charClass.icon || charClass.name[0],
        color: classColors[index],
        currentHp: character.currentHealth,
        maxHp: character.maxHealth,
        beadCounts,
      };
    });

    this.heroSelectionBar.create(heroCardData);
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
   * Update all UI elements to reflect current state
   */
  private updateUI(): void {
    const nextActorId = this.actionWheel.getNextActor();
    const nextActorPosition = nextActorId ? this.actionWheel.getPosition(nextActorId) : undefined;

    this.battleUI.updateStatusText(
      this.monster.name,
      this.monsterEntity.currentHealth,
      this.monster.stats.health,
      nextActorId
    );

    this.battleUI.updateWheelDisplay(
      (pos: number) => this.actionWheel.getEntitiesAtPosition(pos),
      nextActorId,
      nextActorPosition
    );

    // Update bead displays
    const selectedChar = this.selectedCharacterId
      ? this.characters.find((c) => c.id === this.selectedCharacterId)
      : null;
    this.battleUI.updateBeadHandDisplay(selectedChar?.getHandCounts() ?? null);
    this.battleUI.updateMonsterBeadDisplay(
      this.monsterEntity.hasBeadBag() ? (this.monsterEntity.getDiscardedCounts() ?? null) : null
    );

    // Update hero selection bar
    this.heroSelectionBar.updateCurrentActor(this.currentActorId);
    for (const character of this.characters) {
      const beadCounts = character.getHandCounts();
      if (beadCounts) {
        this.heroSelectionBar.updateHeroBeads(character.id, beadCounts);
      }
      this.heroSelectionBar.updateHeroHP(
        character.id,
        character.currentHealth,
        character.maxHealth
      );
    }

    // Update selected hero panel affordability
    if (this.selectedCharacterId) {
      const selectedChar = this.characters.find((c) => c.id === this.selectedCharacterId);
      if (selectedChar) {
        const beadCounts = selectedChar.getHandCounts();
        if (beadCounts) {
          const position = this.actionWheel.getPosition(this.selectedCharacterId);
          const availableTime = position !== undefined ? 8 - position : 0;
          this.selectedHeroPanel.updateAffordability(beadCounts, availableTime);
        }
      }
    }

    // Hide panel during monster turn
    if (this.currentActorId === 'monster') {
      this.selectedHeroPanel.hidePanel();
    }
  }

  private drawGrid(): void {
    this.grid = this.add.graphics();
    this.grid.lineStyle(1, 0x444466, 0.5);

    const cols = this.arena.width;
    const rows = this.arena.height;

    // Draw terrain
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const terrainType = this.arena.terrain?.[y]?.[x] || 'normal';
        const color = this.getTerrainColor(terrainType);

        this.grid.fillStyle(color, 0.3);
        this.grid.fillRect(
          this.GRID_OFFSET_X + x * this.GRID_SIZE,
          this.GRID_OFFSET_Y + y * this.GRID_SIZE,
          this.GRID_SIZE,
          this.GRID_SIZE
        );
      }
    }

    // Draw grid lines
    for (let x = 0; x <= cols; x++) {
      this.grid.moveTo(this.GRID_OFFSET_X + x * this.GRID_SIZE, this.GRID_OFFSET_Y);
      this.grid.lineTo(
        this.GRID_OFFSET_X + x * this.GRID_SIZE,
        this.GRID_OFFSET_Y + rows * this.GRID_SIZE
      );
    }
    for (let y = 0; y <= rows; y++) {
      this.grid.moveTo(this.GRID_OFFSET_X, this.GRID_OFFSET_Y + y * this.GRID_SIZE);
      this.grid.lineTo(
        this.GRID_OFFSET_X + cols * this.GRID_SIZE,
        this.GRID_OFFSET_Y + y * this.GRID_SIZE
      );
    }
    this.grid.strokePath();
  }

  private getTerrainColor(type: string): number {
    const colors: Record<string, number> = {
      normal: 0x3d3d5c,
      hazard: 0x8b0000,
      difficult: 0x4a4a2a,
      elevated: 0x2a4a4a,
      pit: 0x1a1a1a,
    };
    return colors[type] || colors.normal;
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
      const pos = character.getPosition();

      if (pos) {
        const worldX = this.gridSystem.gridToWorld(pos.x);
        const worldY = this.gridSystem.gridToWorld(pos.y);
        const visual = new CharacterVisual(this, worldX, worldY, charClass, classColors[i], i);
        this.characterVisuals.set(character.id, visual);
      }
    }

    // Create monster visual from state entity
    const monsterPos = this.monsterEntity.getPosition();
    if (monsterPos) {
      const monsterWorldX = this.gridSystem.gridToWorld(monsterPos.x);
      const monsterWorldY = this.gridSystem.gridToWorld(monsterPos.y);
      this.monsterVisual = new MonsterVisual(this, monsterWorldX, monsterWorldY, this.monster);
    }
  }

  /**
   * Sync visual state with game state.
   * Called after any state mutation.
   */
  private syncVisuals(): void {
    // Sync character visuals
    for (const character of this.characters) {
      const pos = character.getPosition();
      const visual = this.characterVisuals.get(character.id);
      if (pos && visual) {
        const worldX = this.gridSystem.gridToWorld(pos.x);
        const worldY = this.gridSystem.gridToWorld(pos.y);
        visual.updatePosition(worldX, worldY);
        visual.updateHealth(character.currentHealth, character.maxHealth);
      }
    }

    // Sync monster visual
    const monsterPos = this.monsterEntity.getPosition();
    if (monsterPos) {
      const worldX = this.gridSystem.gridToWorld(monsterPos.x);
      const worldY = this.gridSystem.gridToWorld(monsterPos.y);
      this.monsterVisual.updatePosition(worldX, worldY);
      this.monsterVisual.updateHealth(
        this.monsterEntity.currentHealth,
        this.monsterEntity.maxHealth
      );
    }
  }

  /**
   * Main turn processing loop - called after each action
   */
  private processTurn(): void {
    // Check for victory/defeat
    if (!this.monsterEntity.isAlive()) {
      this.victory();
      return;
    }

    const aliveCharacters = this.characters.filter((c) => c.isAlive());
    if (aliveCharacters.length === 0) {
      this.defeat();
      return;
    }

    // Get next actor from wheel
    this.currentActorId = this.actionWheel.getNextActor();

    if (!this.currentActorId) {
      this.battleUI.log('No actors on wheel!');
      return;
    }

    this.updateUI();

    if (this.currentActorId === 'monster') {
      this.battleUI.log('--- Monster Turn ---');
      this.time.delayedCall(500, () => this.executeMonsterTurn());
    } else {
      this.battleUI.log('--- Player Turn ---');
      this.showPlayerActions();
    }
  }

  private showPlayerActions(): void {
    // Clear any existing selection
    if (this.selectedCharacterId) {
      const prevVisual = this.characterVisuals.get(this.selectedCharacterId);
      prevVisual?.setSelected(false);
    }

    // Find and select the current actor
    const currentCharacter = this.characters.find((c) => c.id === this.currentActorId);
    if (currentCharacter && currentCharacter.isAlive()) {
      this.selectedCharacterId = currentCharacter.id;
      const visual = this.characterVisuals.get(currentCharacter.id);
      visual?.setSelected(true);
    }

    // Make characters clickable (validation happens in selectCharacter)
    for (const character of this.characters) {
      if (character.isAlive()) {
        const visual = this.characterVisuals.get(character.id);
        visual?.setInteractive(true);
        visual?.onClick(() => this.selectCharacter(character.id));
      }
    }

    this.updateUI();
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

    // Update selection visual
    if (this.selectedCharacterId) {
      const prevVisual = this.characterVisuals.get(this.selectedCharacterId);
      prevVisual?.setSelected(false);
    }

    this.selectedCharacterId = characterId;
    const visual = this.characterVisuals.get(characterId);
    visual?.setSelected(true);

    // Show selected hero panel
    this.selectedHeroPanel.showPanel(characterId);

    this.updateUI();
    this.battleUI.log(`Selected: ${visual?.getClassName() || characterId}`);
  }

  /**
   * Unified action execution - handles all action types based on their definition.
   */
  private executeAction(actionId: string): void {
    if (!this.selectedCharacterId) return;

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

  private startTileTargeting(action: ActionDefinition): void {
    if (!this.selectedCharacterId) return;

    const character = this.characters.find((c) => c.id === this.selectedCharacterId);
    if (!character) return;

    const currentPos = character.getPosition();
    if (!currentPos) return;

    const range = getActionRange(action);
    this.battleUI.log(`Click a tile to ${action.name.toLowerCase()}`);

    const graphics = this.add.graphics();
    graphics.fillStyle(0x00ff00, 0.2);

    // Use BattleGrid to get valid moves
    const validMoves = this.battleGrid.getValidMoves(this.selectedCharacterId, range);
    this.currentValidMoves = validMoves; // Store for E2E testing

    for (const move of validMoves) {
      graphics.fillRect(
        this.GRID_OFFSET_X + move.x * this.GRID_SIZE + 2,
        this.GRID_OFFSET_Y + move.y * this.GRID_SIZE + 2,
        this.GRID_SIZE - 4,
        this.GRID_SIZE - 4
      );
    }

    // Delay handler setup to avoid capturing the button click that triggered this
    this.time.delayedCall(50, () => {
      this.input.once('pointerdown', (pointer: Phaser.Input.Pointer) => {
        graphics.destroy();
        this.currentValidMoves = []; // Clear after click

        const gridX = this.gridSystem.worldToGrid(pointer.x);
        const gridY = this.gridSystem.worldToGrid(pointer.y);

        // Check if this is a valid move using BattleGrid
        const isValid = validMoves.some((m) => m.x === gridX && m.y === gridY);

        if (isValid) {
          this.resolveTileAction(character, action, gridX, gridY);
        } else {
          this.battleUI.log('Invalid move');
        }
      });
    });
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
    // Create game context
    const context: GameContext = {
      grid: this.battleGrid,
      getEntity: (id: string) => {
        if (id === 'monster') return this.monsterEntity;
        return this.characters.find((c) => c.id === id);
      },
      getBeadHand: (entityId: string) => {
        const char = this.characters.find((c) => c.id === entityId);
        return char?.getBeadHand();
      },
    };

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
    if (!this.selectedCharacterId) return;

    const character = this.characters.find((c) => c.id === this.selectedCharacterId);
    if (!character) return;

    // Create game context
    const context: GameContext = {
      grid: this.battleGrid,
      getEntity: (id: string) => {
        if (id === 'monster') return this.monsterEntity;
        return this.characters.find((c) => c.id === id);
      },
      getBeadHand: (entityId: string) => {
        const char = this.characters.find((c) => c.id === entityId);
        return char?.getBeadHand();
      },
    };

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
          this.updateUI();
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

    this.updateUI();
    this.advanceAndProcessTurn(this.currentActorId!, getWheelCost(action));
  }

  /**
   * Execute an immediate action (rest, buffs).
   */
  private async executeImmediateAction(action: ActionDefinition): Promise<void> {
    if (!this.selectedCharacterId) return;

    const character = this.characters.find((c) => c.id === this.selectedCharacterId);
    if (!character) return;

    // Create game context
    const context: GameContext = {
      grid: this.battleGrid,
      getEntity: (id: string) => {
        if (id === 'monster') return this.monsterEntity;
        return this.characters.find((c) => c.id === id);
      },
      getBeadHand: (entityId: string) => {
        const char = this.characters.find((c) => c.id === entityId);
        return char?.getBeadHand();
      },
    };

    // Create and execute action resolution
    const resolution = new ActionResolution(character.id, action, context, this.effectRegistry);

    // No parameters to provide - resolve immediately
    const result = resolution.resolve();

    if (!result.success) {
      this.battleUI.log(result.reason || `${action.name} failed`);
      return;
    }

    await this.animationExecutor.execute(result.events);

    this.updateUI();
    this.advanceAndProcessTurn(this.currentActorId!, getWheelCost(action));
  }

  private advanceAndProcessTurn(entityId: string, wheelCost: number): void {
    this.actionWheel.advanceEntity(entityId, wheelCost);

    // Clear selection
    if (this.selectedCharacterId) {
      const visual = this.characterVisuals.get(this.selectedCharacterId);
      visual?.setSelected(false);
      this.selectedCharacterId = null;
    }

    // Sync all visuals with state
    this.syncVisuals();

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

    this.updateUI();

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
  }
}
