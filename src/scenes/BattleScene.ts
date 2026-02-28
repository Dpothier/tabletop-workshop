import Phaser from 'phaser';
import type { Monster, CharacterClass } from '@src/systems/DataLoader';
import { GridSystem } from '@src/systems/GridSystem';
import type { ActionRegistry } from '@src/systems/ActionRegistry';
import type { BattleStateObserver } from '@src/systems/BattleStateObserver';
import { SelectionManager } from '@src/systems/SelectionManager';
import { TargetingSystem, TargetingDeps } from '@src/systems/TargetingSystem';
import { TurnFlowController } from '@src/controllers/TurnFlowController';

import type { BattleGrid, Position } from '@src/state/BattleGrid';
import type { BattleState } from '@src/state/BattleState';
import type { Character } from '@src/entities/Character';
import type { MonsterEntity } from '@src/entities/MonsterEntity';
import { CharacterVisual, MonsterVisual } from '@src/visuals';
import { GridVisual } from '@src/visuals/GridVisual';
import { BattleUI } from '@src/ui/BattleUI';
import { AnimationExecutor } from '@src/ui/AnimationExecutor';
import { HeroSelectionBar } from '@src/ui/HeroSelectionBar';
import { SelectedHeroPanel } from '@src/ui/SelectedHeroPanel';
import { OptionSelectionPanel } from '@src/ui/OptionSelectionPanel';
import { HERO_COLORS } from '@src/ui/colors';
import type { BattleAdapter } from '@src/types/BattleAdapter';
import type { OptionPrompt, EntityPrompt } from '@src/types/ParameterPrompt';
import type { AnimationEvent } from '@src/types/AnimationEvent';

interface BattleData {
  state: BattleState;
}

export class BattleScene extends Phaser.Scene implements BattleAdapter {
  // === BATTLE STATE (received from BattleBuilder) ===
  private state!: BattleState;

  // === VISUALS (Rendering - created in create()) ===
  private characterVisuals: Map<string, CharacterVisual> = new Map();
  private monsterVisual!: MonsterVisual;
  private gridVisual!: GridVisual;

  // Systems (Phaser-dependent)
  private gridSystem!: GridSystem;

  // Selection manager for character selection state
  private selectionManager!: SelectionManager;

  // Targeting system for tile selection
  private targetingSystem!: TargetingSystem;

  // State observer for reactive UI updates
  private stateObserver!: BattleStateObserver;

  // Turn flow controller for orchestration
  private turnFlowController!: TurnFlowController;
  private pendingActionResolve?: (actionId: string) => void;

  // Valid movement tiles for E2E testing
  public currentValidMoves: { x: number; y: number }[] = [];

  // Current actor for E2E testing
  public currentActorId: string | null = null;

  // Entity targeting state for E2E testing
  public entityTargetingActive: boolean = false;
  public highlightedEntityTargets: string[] = [];

  // Expose log messages for E2E testing
  public get logMessages(): string[] {
    return this.battleUI?.getLogMessages() ?? [];
  }

  /**
   * Set a hero's bead hand to specific counts (for E2E testing).
   * @param heroId - ID of the hero
   * @param counts - Desired bead counts
   */
  public setHeroBeadHand(
    heroId: string,
    counts: { red: number; blue: number; green: number; white: number }
  ): void {
    const character = this.characters.find((c) => c.id === heroId);
    if (character) {
      character.setBeadHand(counts);
    }
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
    // Initialize TurnFlowController for turn orchestration
    this.turnFlowController = new TurnFlowController(this.state, this);
    this.turnFlowController.start(); // Don't await - let it run async
  }

  private createBattleUI(): void {
    this.battleUI = new BattleUI(this);
    this.battleUI.createAllPanels();

    // Set up toggle callback to show/hide action panel
    this.battleUI.setToggleCallback((showingLog) => {
      if (showingLog) {
        this.selectedHeroPanel.hidePanel();
      } else {
        const selectedId = this.selectionManager.getSelected();
        if (selectedId) {
          this.battleUI.hideLog();
          this.selectedHeroPanel.showPanel(selectedId);
        }
      }
    });

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

    // Create option selection panel
    this.optionSelectionPanel = new OptionSelectionPanel(this);

    // Subscribe UI components to state changes
    this.battleUI.subscribeToState(this.stateObserver, this.state);
    this.heroSelectionBar.subscribeToState(this.stateObserver);
    this.selectedHeroPanel.subscribeToState(this.stateObserver, this.state);

    // Subscribe visuals to state observer for reactive updates
    for (const [heroId, visual] of this.characterVisuals) {
      visual.subscribeToState(this.stateObserver, heroId);
    }
    this.monsterVisual.subscribeToState(this.stateObserver);

    // Track current actor for E2E testing
    this.stateObserver.subscribe({
      actorChanged: (actorId) => {
        this.currentActorId = actorId;
      },
    });
  }

  private createHeroSelectionBar(): void {
    this.heroSelectionBar = new HeroSelectionBar(this);
    this.heroSelectionBar.createFromEntities(this.characters, this.classes);
    this.heroSelectionBar.onHeroClick((heroId) => this.handleHeroBarClick(heroId));
  }

  private handleHeroBarClick(heroId: string): void {
    const character = this.characters.find((c) => c.id === heroId);
    if (!character?.isAlive()) return;

    // Turn enforcement: only allow selecting the current actor
    if (heroId !== this.currentActorId) {
      this.battleUI.log(`It's not ${heroId}'s turn`);
      return;
    }

    // Select and show panel for current actor
    this.selectionManager.select(heroId);
    this.battleUI.hideLog();
    this.selectedHeroPanel.showPanel(heroId);
    this.stateObserver.emitSelectionChanged(heroId);
  }

  private handleCharacterVisualClick(characterId: string): void {
    const character = this.characters.find((c) => c.id === characterId);
    if (!character?.isAlive()) return;

    // Turn enforcement: only allow selecting the current actor
    if (characterId !== this.currentActorId) {
      this.battleUI.log(`It's not ${characterId}'s turn`);
      return;
    }

    // Select and show panel for current actor
    this.selectionManager.select(characterId);
    this.battleUI.hideLog();
    this.selectedHeroPanel.showPanel(characterId);
    this.stateObserver.emitSelectionChanged(characterId);
  }

  private createSelectedHeroPanel(): void {
    this.selectedHeroPanel = new SelectedHeroPanel(this);
    const actions = this.actionRegistry.getAll();
    this.selectedHeroPanel.create(actions, (actionId) => this.onActionSelected(actionId));

    const nameMap = new Map<string, string>();
    for (const character of this.characters) {
      nameMap.set(character.id, character.getName());
    }
    this.selectedHeroPanel.setHeroNames(nameMap);
  }

  private onActionSelected(actionId: string): void {
    if (this.pendingActionResolve) {
      this.pendingActionResolve(actionId);
      this.pendingActionResolve = undefined;
    }
  }

  /**
   * Create visual representations for state entities.
   * State objects already exist from BattleBuilder.
   */
  private createVisuals(): void {
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
        HERO_COLORS[i % HERO_COLORS.length]
      );
      if (visual) {
        this.characterVisuals.set(character.id, visual);
        // Add click handler for turn validation
        visual.onClick(() => this.handleCharacterVisualClick(character.id));
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

  // === BattleAdapter Implementation ===

  async promptTile(params: { range: number }): Promise<Position | null> {
    const actorId = this.selectionManager.getSelected();
    if (!actorId) return null;

    return this.targetingSystem.showTileTargeting(actorId, params.range, 'action');
  }

  async promptOptions(prompt: OptionPrompt): Promise<string[] | null> {
    const character = this.characters.find((c) => c.id === this.selectionManager.getSelected());
    if (!character || !this.optionSelectionPanel) return null;

    const beadCounts = character.getHandCounts() || { red: 0, blue: 0, green: 0, white: 0 };

    return new Promise<string[] | null>((resolve) => {
      this.optionSelectionPanel!.show({
        prompt: prompt.prompt,
        subtitle: prompt.subtitle,
        options: prompt.options,
        multiSelect: prompt.multiSelect ?? false,
        availableBeads: beadCounts,
        availableTime: 0,
        onConfirm: (selectedIds: string[]) => resolve(selectedIds),
        onCancel: () => resolve(null),
      });
    });
  }

  async promptEntity(prompt: EntityPrompt): Promise<string | null> {
    const actorId = this.selectionManager.getSelected();
    if (!actorId) return null;

    const validTargets = this.getValidEntityTargets(actorId, prompt);
    if (validTargets.length === 0) {
      this.battleUI.log('No valid targets in range');
      return null;
    }

    // Always show the target selector, even for single targets
    // This gives visual feedback and allows the player to cancel
    this.entityTargetingActive = true;
    this.highlightedEntityTargets = validTargets;
    const { highlights, targetHalos } = this.highlightEntityTargetsWithHalos(
      actorId,
      validTargets,
      prompt.range ?? 1
    );

    // Log the prompt to inform player what to do
    this.battleUI.log(prompt.prompt || 'Select target');

    // Track currently hovered target for visual feedback
    let hoveredTargetId: string | null = null;

    return new Promise((resolve) => {
      // Hover effect handler
      const onPointerMove = (pointer: Phaser.Input.Pointer): void => {
        const gridX = this.gridSystem.worldToGrid(pointer.x);
        const gridY = this.gridSystem.worldToGrid(pointer.y);

        let newHoveredTarget: string | null = null;
        for (const targetId of validTargets) {
          const targetPos = this.battleGrid.getPosition(targetId);
          if (targetPos && targetPos.x === gridX && targetPos.y === gridY) {
            newHoveredTarget = targetId;
            break;
          }
        }

        // Update hover visuals if hovered target changed
        if (newHoveredTarget !== hoveredTargetId) {
          // Reset previous hovered target
          if (hoveredTargetId && targetHalos.has(hoveredTargetId)) {
            this.updateTargetHalo(targetHalos.get(hoveredTargetId)!, hoveredTargetId, false);
          }
          // Highlight new hovered target
          if (newHoveredTarget && targetHalos.has(newHoveredTarget)) {
            this.updateTargetHalo(targetHalos.get(newHoveredTarget)!, newHoveredTarget, true);
          }
          hoveredTargetId = newHoveredTarget;
        }
      };

      const cleanup = (): void => {
        this.entityTargetingActive = false;
        this.highlightedEntityTargets = [];
        highlights.forEach((h) => h.destroy());
        targetHalos.forEach((h) => h.destroy());
        this.input.off('pointermove', onPointerMove);
        this.input.removeAllListeners('pointerdown');
        this.input.keyboard?.removeAllListeners('keydown-ESC');
      };

      // Add hover listener
      this.input.on('pointermove', onPointerMove);

      this.input.once('pointerdown', (pointer: Phaser.Input.Pointer) => {
        const gridX = this.gridSystem.worldToGrid(pointer.x);
        const gridY = this.gridSystem.worldToGrid(pointer.y);

        for (const targetId of validTargets) {
          const targetPos = this.battleGrid.getPosition(targetId);
          if (targetPos && targetPos.x === gridX && targetPos.y === gridY) {
            cleanup();
            resolve(targetId);
            return;
          }
        }

        // Click wasn't on a valid target - cancel
        cleanup();
        resolve(null);
      });

      this.input.keyboard?.once('keydown-ESC', () => {
        cleanup();
        resolve(null);
      });
    });
  }

  /**
   * Update a target halo's appearance based on hover state
   */
  private updateTargetHalo(
    graphics: Phaser.GameObjects.Graphics,
    targetId: string,
    isHovered: boolean
  ): void {
    const pos = this.battleGrid.getPosition(targetId);
    if (!pos) return;

    const worldX = this.gridSystem.gridToWorld(pos.x);
    const worldY = this.gridSystem.gridToWorld(pos.y);
    graphics.clear();

    if (isHovered) {
      // Hovered: dramatic yellow highlight with filled background
      // Filled yellow background for high visibility
      graphics.fillStyle(0xffff00, 0.4);
      graphics.fillCircle(worldX, worldY, this.GRID_SIZE / 2 + 12);
      // Thick bright yellow outer ring
      graphics.lineStyle(8, 0xffff00, 1.0);
      graphics.strokeCircle(worldX, worldY, this.GRID_SIZE / 2 + 12);
      // White inner glow for contrast
      graphics.lineStyle(4, 0xffffff, 0.8);
      graphics.strokeCircle(worldX, worldY, this.GRID_SIZE / 2 + 4);
    } else {
      // Normal: standard red halo
      graphics.lineStyle(4, 0xff0000, 0.9);
      graphics.strokeCircle(worldX, worldY, this.GRID_SIZE / 2 + 4);
    }
  }

  private getValidEntityTargets(actorId: string, prompt: EntityPrompt): string[] {
    const targets: string[] = [];
    const actorPos = this.battleGrid.getPosition(actorId);
    if (!actorPos) return [];

    if (prompt.filter === 'enemy' || prompt.filter === 'any') {
      const monsterPos = this.battleGrid.getPosition(this.monsterEntity.id);
      if (monsterPos && this.monsterEntity.isAlive()) {
        const distance = this.battleGrid.getDistance(actorId, this.monsterEntity.id);
        if (!prompt.range || distance <= prompt.range) {
          targets.push(this.monsterEntity.id);
        }
      }
    }

    if (prompt.filter === 'ally' || prompt.filter === 'any') {
      for (const char of this.characters) {
        if (char.id !== actorId && char.isAlive()) {
          const distance = this.battleGrid.getDistance(actorId, char.id);
          if (!prompt.range || distance <= prompt.range) {
            targets.push(char.id);
          }
        }
      }
    }

    return targets;
  }

  private highlightEntityTargetsWithHalos(
    actorId: string,
    targetIds: string[],
    range: number
  ): { highlights: Phaser.GameObjects.Graphics[]; targetHalos: Map<string, Phaser.GameObjects.Graphics> } {
    const highlights: Phaser.GameObjects.Graphics[] = [];
    const targetHalos = new Map<string, Phaser.GameObjects.Graphics>();
    const actorPos = this.battleGrid.getPosition(actorId);
    if (!actorPos) return { highlights, targetHalos };

    // 1. Get all tiles in range (green highlight)
    const tilesInRange: Position[] = [];
    const { width, height } = this.arena;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const distance = Math.max(Math.abs(x - actorPos.x), Math.abs(y - actorPos.y));
        if (distance > 0 && distance <= range) {
          tilesInRange.push({ x, y });
        }
      }
    }

    // Highlight all tiles in range with green
    if (tilesInRange.length > 0) {
      const rangeHighlight = this.gridVisual.highlightTiles(tilesInRange, 0x00ff00);
      highlights.push(rangeHighlight);
    }

    // 2. Add red halos around valid targets (stored separately for hover effects)
    for (const targetId of targetIds) {
      const pos = this.battleGrid.getPosition(targetId);
      if (pos) {
        const worldX = this.gridSystem.gridToWorld(pos.x);
        const worldY = this.gridSystem.gridToWorld(pos.y);
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xff0000, 0.9);
        graphics.strokeCircle(worldX, worldY, this.GRID_SIZE / 2 + 4);
        targetHalos.set(targetId, graphics);
      }
    }

    return { highlights, targetHalos };
  }

  async animate(events: AnimationEvent[]): Promise<void> {
    await this.animationExecutor.execute(events);
  }

  log(message: string): void {
    this.battleUI.log(message);
  }

  // === Phase 4 BattleAdapter methods ===

  showPlayerTurn(actorId: string): void {
    // Auto-select the current actor
    const character = this.characters.find((c) => c.id === actorId);
    if (character?.isAlive()) {
      this.selectionManager.select(character.id);
    }

    // Make characters clickable
    for (const char of this.characters) {
      if (char.isAlive()) {
        const visual = this.characterVisuals.get(char.id);
        visual?.setInteractive(true);
      }
    }

    // Show panel for selected hero
    this.battleUI.hideLog();
    this.selectedHeroPanel.showPanel(actorId);
    this.stateObserver.emitSelectionChanged(character?.id ?? null);
  }

  awaitPlayerAction(_actorId: string): Promise<string> {
    return new Promise((resolve) => {
      this.pendingActionResolve = resolve;
    });
  }

  transition(scene: string, data: object): void {
    this.scene.start(scene, data);
  }

  delay(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  notifyBeadsChanged(heroId: string, counts: import('@src/types/Beads').BeadCounts): void {
    this.stateObserver.emitHeroBeadsChanged(heroId, counts);
  }

  shutdown(): void {
    this.optionSelectionPanel?.destroy();
    this.gridVisual?.destroy();
  }
}
