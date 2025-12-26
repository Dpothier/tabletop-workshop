import Phaser from 'phaser';
import { Arena, Monster, CharacterClass } from '@src/systems/DataLoader';
import { GridSystem } from '@src/systems/GridSystem';
import { ActionWheel } from '@src/systems/ActionWheel';

// New architecture imports
import { BattleGrid } from '@src/state/BattleGrid';
import { Character } from '@src/entities/Character';
import { MonsterEntity, StateConfig } from '@src/entities/MonsterEntity';
import { Entity } from '@src/entities/Entity';
import { CharacterVisual, MonsterVisual } from '@src/visuals';
import { BattleUI } from '@src/ui/BattleUI';
import { AnimationExecutor } from '@src/ui/AnimationExecutor';
import { HeroSelectionBar, HeroCardData } from '@src/ui/HeroSelectionBar';
import { SelectedHeroPanel } from '@src/ui/SelectedHeroPanel';

interface BattleData {
  monster: Monster;
  arena: Arena;
  partySize: number;
  classes: CharacterClass[];
}

// Movement ranges for actions
const MOVEMENT_RANGES = {
  move: 2,
  run: 6,
} as const;

export class BattleScene extends Phaser.Scene {
  private arena!: Arena;
  private monster!: Monster;
  private partySize!: number;
  private classes!: CharacterClass[];

  // === STATE (Game Logic) ===
  private battleGrid!: BattleGrid;
  private characters: Character[] = [];
  private monsterEntity!: MonsterEntity;
  private entityMap: Map<string, Entity> = new Map();

  // === VISUALS (Rendering) ===
  private characterVisuals: Map<string, CharacterVisual> = new Map();
  private monsterVisual!: MonsterVisual;
  private grid!: Phaser.GameObjects.Graphics;

  // Systems
  private actionWheel!: ActionWheel;
  private gridSystem!: GridSystem;

  // Turn state
  private currentActorId: string | null = null;
  private selectedCharacterId: string | null = null;

  // Valid movement tiles for E2E testing
  public currentValidMoves: { x: number; y: number }[] = [];

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

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: BattleData): void {
    this.monster = data.monster;
    this.arena = data.arena;
    this.partySize = data.partySize;
    this.classes = data.classes;
  }

  create(): void {
    this.initializeSystems();
    this.initializeState();
    this.drawGrid();
    this.createEntitiesAndVisuals();
    this.createBattleUI();
    this.initializeActionWheel();
    this.initializeBeadHands();
    this.processTurn();
  }

  private createBattleUI(): void {
    this.battleUI = new BattleUI(this);
    this.battleUI.createAllPanels({
      onMove: () => this.startMove(),
      onRun: () => this.startRun(),
      onAttack: () => this.executeAttack(),
      onRest: () => this.executeRest(),
    });

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
    this.selectedHeroPanel.create({
      Move: () => this.startMove(),
      Run: () => this.startRun(),
      Attack: () => this.executeAttack(),
      Rest: () => this.executeRest(),
    });
  }

  private initializeSystems(): void {
    this.gridSystem = new GridSystem(
      this.GRID_SIZE,
      this.GRID_OFFSET_X,
      this.GRID_OFFSET_Y,
      this.arena.width,
      this.arena.height
    );

    this.actionWheel = new ActionWheel();
  }

  private initializeState(): void {
    // Create the single source of truth for positions
    this.battleGrid = new BattleGrid(this.arena.width, this.arena.height);
    this.characters = [];
    this.entityMap = new Map();
    this.characterVisuals = new Map();
  }

  private initializeActionWheel(): void {
    // Add all characters to wheel at position 0
    for (const character of this.characters) {
      this.actionWheel.addEntity(character.id, 0);
    }
    // Add monster at position 0
    this.actionWheel.addEntity('monster', 0);

    this.updateUI();
  }

  private initializeBeadHands(): void {
    // Initialize bead hands for all characters
    for (const character of this.characters) {
      character.initializeBeadHand();
      // Draw starting beads (3)
      if (character.hasBeadHand()) {
        character.drawBeadsToHand(3);
      }
    }
    this.updateUI();
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
          this.selectedHeroPanel.updateAffordability(beadCounts);
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

  private createEntitiesAndVisuals(): void {
    const spawnPoints = this.arena.playerSpawns || [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ];

    const classColors = [0x4488ff, 0xff4444, 0x44ff44, 0xffff44];

    // Create characters (state) and their visuals
    for (let i = 0; i < this.partySize; i++) {
      const charClass = this.classes[i % this.classes.length];
      const spawn = spawnPoints[i];
      const characterId = `hero-${i}`;

      // Register position in grid (single source of truth)
      this.battleGrid.register(characterId, spawn.x, spawn.y);

      // Create Character entity (game logic)
      const character = new Character(
        characterId,
        charClass.stats.health,
        this.battleGrid,
        this.entityMap
      );
      this.characters.push(character);
      this.entityMap.set(characterId, character);

      // Create CharacterVisual (rendering)
      const worldX = this.gridSystem.gridToWorld(spawn.x);
      const worldY = this.gridSystem.gridToWorld(spawn.y);
      const visual = new CharacterVisual(this, worldX, worldY, charClass, classColors[i], i);
      this.characterVisuals.set(characterId, visual);
    }

    // Create monster entity and visual
    const monsterSpawn = this.arena.monsterSpawn || { x: 5, y: 4 };

    // Register monster position
    this.battleGrid.register('monster', monsterSpawn.x, monsterSpawn.y);

    // Create MonsterEntity (game logic)
    this.monsterEntity = new MonsterEntity('monster', this.monster.stats.health, this.battleGrid);
    this.entityMap.set('monster', this.monsterEntity);

    // Initialize monster bead system if configured
    if (this.monster.beads && this.monster.states && this.monster.start_state) {
      this.monsterEntity.initializeBeadBag(this.monster.beads);

      // Convert states record to array of StateConfig
      const stateConfigs: StateConfig[] = Object.entries(this.monster.states).map(
        ([name, state]) => ({
          name,
          damage: state.damage,
          wheel_cost: state.wheel_cost,
          range: state.range,
          area: state.area,
          transitions: state.transitions,
        })
      );

      this.monsterEntity.initializeStateMachine(stateConfigs, this.monster.start_state);
    }

    // Create MonsterVisual (rendering)
    const monsterWorldX = this.gridSystem.gridToWorld(monsterSpawn.x);
    const monsterWorldY = this.gridSystem.gridToWorld(monsterSpawn.y);
    this.monsterVisual = new MonsterVisual(this, monsterWorldX, monsterWorldY, this.monster);
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

    this.battleUI.showActionButtons(false);
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

    this.battleUI.showActionButtons(false);
    this.updateUI();
    this.battleUI.log(`Selected: ${visual?.getClassName() || characterId}`);
  }

  private startMove(): void {
    if (!this.selectedCharacterId) return;
    this.battleUI.log('Click a tile to move');
    this.highlightMovementRange(MOVEMENT_RANGES.move, 'move');
  }

  private startRun(): void {
    if (!this.selectedCharacterId) return;
    this.battleUI.log('Click a tile to run');
    this.highlightMovementRange(MOVEMENT_RANGES.run, 'run');
  }

  private highlightMovementRange(range: number, actionType: 'move' | 'run'): void {
    if (!this.selectedCharacterId) return;

    const character = this.characters.find((c) => c.id === this.selectedCharacterId);
    if (!character) return;

    const currentPos = character.getPosition();
    if (!currentPos) return;

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
          this.moveCharacter(character, gridX, gridY, actionType);
        } else {
          this.battleUI.log('Invalid move');
        }
      });
    });
  }

  private async moveCharacter(
    character: Character,
    gridX: number,
    gridY: number,
    actionType: 'move' | 'run'
  ): Promise<void> {
    // Phase 1: State - resolve the action
    const result = character.resolveAction(actionType, { target: { x: gridX, y: gridY } });

    if (!result.success) {
      this.battleUI.log(result.reason || 'Move failed');
      return;
    }

    // Phase 2: Animate - play all events
    await this.animationExecutor.execute(result.events);

    const visual = this.characterVisuals.get(character.id);
    this.battleUI.log(`${visual?.getClassName() || character.id} moved`);
    this.advanceAndProcessTurn(this.currentActorId!, result.wheelCost);
  }

  private async executeAttack(): Promise<void> {
    if (!this.selectedCharacterId) return;

    const character = this.characters.find((c) => c.id === this.selectedCharacterId);
    if (!character) return;

    // Phase 1: State - resolve the action
    const result = character.resolveAction('attack', { targetEntityId: 'monster' });

    if (!result.success) {
      this.battleUI.log(result.reason || 'Attack failed');
      return;
    }

    // Phase 2: Animate - play all events
    await this.animationExecutor.execute(result.events);

    this.updateUI();
    this.advanceAndProcessTurn(this.currentActorId!, result.wheelCost);
  }

  private async executeRest(): Promise<void> {
    if (!this.selectedCharacterId) return;

    const character = this.characters.find((c) => c.id === this.selectedCharacterId);
    if (!character) return;

    // Phase 1: State - resolve the action
    const result = character.resolveAction('rest', {});

    if (!result.success) {
      this.battleUI.log(result.reason || 'Rest failed');
      return;
    }

    // Phase 2: Animate - play all events
    await this.animationExecutor.execute(result.events);

    this.updateUI();
    this.advanceAndProcessTurn(this.currentActorId!, result.wheelCost);
  }

  private advanceAndProcessTurn(entityId: string, wheelCost: number): void {
    this.actionWheel.advanceEntity(entityId, wheelCost);

    // Clear selection
    if (this.selectedCharacterId) {
      const visual = this.characterVisuals.get(this.selectedCharacterId);
      visual?.setSelected(false);
      this.selectedCharacterId = null;
    }
    this.battleUI.hideActionButtons();

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
}
