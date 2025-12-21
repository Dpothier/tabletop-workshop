import Phaser from 'phaser';
import { Arena, Monster, CharacterClass } from '@src/systems/DataLoader';
import { Token, CharacterToken, MonsterToken } from '@src/entities/Token';
import { DiceRoller } from '@src/systems/DiceRoller';
import { GridSystem } from '@src/systems/GridSystem';
import { MovementValidator } from '@src/systems/MovementValidator';
import { CombatResolver } from '@src/systems/CombatResolver';
import { MonsterAI, BeadBasedAction } from '@src/systems/MonsterAI';
import { ActionWheel } from '@src/systems/ActionWheel';

interface BattleData {
  monster: Monster;
  arena: Arena;
  partySize: number;
  classes: CharacterClass[];
}

// Action costs for the wheel
const ACTION_COSTS = {
  move: 1,
  run: 2,
  attack: 2,
  rest: 2,
} as const;

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

  // Visual elements
  private grid!: Phaser.GameObjects.Graphics;
  private tokens: Token[] = [];
  private characterTokens: CharacterToken[] = [];
  private monsterToken!: MonsterToken;

  // Systems
  private actionWheel!: ActionWheel;
  private gridSystem!: GridSystem;
  private movementValidator!: MovementValidator;
  private combatResolver!: CombatResolver;
  private monsterAI!: MonsterAI;

  // State - no more phases, just track current actor
  private currentActorId: string | null = null;
  private selectedToken: CharacterToken | null = null;

  // Valid movement tiles for E2E testing
  public currentValidMoves: { x: number; y: number }[] = [];

  // Constants
  private readonly GRID_SIZE = 64;
  private readonly GRID_OFFSET_X = 80;
  private readonly GRID_OFFSET_Y = 80;

  // UI elements
  private statusText!: Phaser.GameObjects.Text;
  private actionButtons: Phaser.GameObjects.Container[] = [];
  private logText!: Phaser.GameObjects.Text;
  private logMessages: string[] = [];

  // UI for wheel and beads
  private wheelGraphics!: Phaser.GameObjects.Graphics;
  private beadHandContainer!: Phaser.GameObjects.Container;
  private monsterBeadText!: Phaser.GameObjects.Text;

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
    this.drawGrid();
    this.createTokens();
    this.createUI();
    this.initializeActionWheel();
    this.initializeBeadHands();
    this.processTurn();
  }

  private initializeSystems(): void {
    const diceRoller = new DiceRoller();

    this.gridSystem = new GridSystem(
      this.GRID_SIZE,
      this.GRID_OFFSET_X,
      this.GRID_OFFSET_Y,
      this.arena.width,
      this.arena.height
    );

    this.movementValidator = new MovementValidator(this.gridSystem, () =>
      this.tokens.filter((t) => t.currentHealth > 0).map((t) => ({ x: t.gridX, y: t.gridY }))
    );

    this.combatResolver = new CombatResolver(diceRoller);
    this.monsterAI = new MonsterAI(this.combatResolver);
    this.actionWheel = new ActionWheel();
  }

  private initializeActionWheel(): void {
    // Add all characters to wheel at position 0 using stable index-based IDs
    for (const token of this.characterTokens) {
      this.actionWheel.addEntity(`hero-${token.index}`, 0);
    }
    // Add monster at position 0
    this.actionWheel.addEntity('monster', 0);

    this.updateWheelDisplay();
  }

  /**
   * Find a CharacterToken by its action wheel ID
   */
  private getCharacterTokenById(wheelId: string): CharacterToken | null {
    if (!wheelId.startsWith('hero-')) return null;
    const index = parseInt(wheelId.replace('hero-', ''), 10);
    return this.characterTokens.find((t) => t.index === index) ?? null;
  }

  private initializeBeadHands(): void {
    // Initialize bead hands for all characters
    for (const token of this.characterTokens) {
      token.initializeBeadHand();
      // Draw starting beads (3)
      token.beadHand?.drawToHand(3);
    }
    this.updateBeadHandDisplay();
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

  private createTokens(): void {
    const spawnPoints = this.arena.playerSpawns || [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ];

    const classColors = [0x4488ff, 0xff4444, 0x44ff44, 0xffff44];

    for (let i = 0; i < this.partySize; i++) {
      const charClass = this.classes[i % this.classes.length];
      const spawn = spawnPoints[i];
      const token = new CharacterToken(
        this,
        this.gridSystem.gridToWorld(spawn.x),
        this.gridSystem.gridToWorld(spawn.y),
        charClass,
        classColors[i],
        i
      );
      token.setGridPosition(spawn.x, spawn.y);
      this.characterTokens.push(token);
      this.tokens.push(token);
    }

    const monsterSpawn = this.arena.monsterSpawn || { x: 5, y: 4 };
    this.monsterToken = new MonsterToken(
      this,
      this.gridSystem.gridToWorld(monsterSpawn.x),
      this.gridSystem.gridToWorld(monsterSpawn.y),
      this.monster
    );
    this.monsterToken.setGridPosition(monsterSpawn.x, monsterSpawn.y);
    this.tokens.push(this.monsterToken);
  }

  private createUI(): void {
    // Status panel
    this.add.rectangle(900, 100, 200, 150, 0x1a1a2e).setStrokeStyle(2, 0x4a4a6a);
    this.statusText = this.add.text(810, 40, '', {
      fontSize: '14px',
      color: '#ffffff',
      lineSpacing: 6,
    });
    this.updateStatusText();

    // Action wheel display area
    this.wheelGraphics = this.add.graphics();
    this.add
      .text(900, 180, 'Action Wheel', {
        fontSize: '12px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    // Action buttons area
    this.add.rectangle(900, 380, 200, 180, 0x1a1a2e).setStrokeStyle(2, 0x4a4a6a);
    this.add
      .text(900, 300, 'Actions', {
        fontSize: '18px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    // Bead hand display area
    this.beadHandContainer = this.add.container(810, 480);
    this.add
      .text(900, 475, 'Beads in Hand', {
        fontSize: '12px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    // Monster bead discard display
    this.monsterBeadText = this.add.text(810, 155, '', {
      fontSize: '11px',
      color: '#cccccc',
    });

    // Battle log
    this.add.rectangle(900, 640, 200, 180, 0x1a1a2e).setStrokeStyle(2, 0x4a4a6a);
    this.add
      .text(900, 555, 'Battle Log', {
        fontSize: '16px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);
    this.logText = this.add.text(810, 570, '', {
      fontSize: '11px',
      color: '#cccccc',
      wordWrap: { width: 180 },
      lineSpacing: 3,
    });
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 160, 36, 0x444466).setInteractive({ useHandCursor: true });
    const label = this.add
      .text(0, 0, text, {
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x555588));
    bg.on('pointerout', () => bg.setFillStyle(0x444466));
    bg.on('pointerdown', callback);

    container.add([bg, label]);
    return container;
  }

  private updateStatusText(): void {
    const nextActor = this.actionWheel.getNextActor();
    const actorName = nextActor === 'monster' ? this.monster.name : 'Player';

    const lines = [
      `Monster: ${this.monster.name}`,
      `HP: ${this.monsterToken.currentHealth}/${this.monster.stats.health}`,
      '',
      `Current Actor: ${actorName}`,
    ];
    this.statusText.setText(lines.join('\n'));
  }

  private updateWheelDisplay(): void {
    this.wheelGraphics.clear();

    const centerX = 900;
    const centerY = 240;
    const radius = 50;

    // Draw wheel segments
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      const nextAngle = ((i + 1) * Math.PI) / 4 - Math.PI / 2;

      this.wheelGraphics.lineStyle(2, 0x4a4a6a);
      this.wheelGraphics.beginPath();
      this.wheelGraphics.moveTo(centerX, centerY);
      this.wheelGraphics.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      this.wheelGraphics.arc(centerX, centerY, radius, angle, nextAngle, false);
      this.wheelGraphics.lineTo(centerX, centerY);
      this.wheelGraphics.strokePath();

      // Position number
      const midAngle = (angle + nextAngle) / 2;
      const textX = centerX + Math.cos(midAngle) * (radius * 0.6);
      const textY = centerY + Math.sin(midAngle) * (radius * 0.6);

      // Count entities at this position
      const entitiesAtPos = this.actionWheel.getEntitiesAtPosition(i);
      if (entitiesAtPos.length > 0) {
        this.wheelGraphics.fillStyle(0x88ff88, 0.3);
        this.wheelGraphics.fillCircle(textX, textY, 12);
      }
    }

    // Highlight next actor's position
    const nextActor = this.actionWheel.getNextActor();
    if (nextActor) {
      const pos = this.actionWheel.getPosition(nextActor) || 0;
      const angle = (pos * Math.PI) / 4 - Math.PI / 2;
      const nextAngle = ((pos + 1) * Math.PI) / 4 - Math.PI / 2;

      this.wheelGraphics.fillStyle(0xffff00, 0.4);
      this.wheelGraphics.beginPath();
      this.wheelGraphics.moveTo(centerX, centerY);
      this.wheelGraphics.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      this.wheelGraphics.arc(centerX, centerY, radius, angle, nextAngle, false);
      this.wheelGraphics.lineTo(centerX, centerY);
      this.wheelGraphics.fillPath();
    }
  }

  private updateBeadHandDisplay(): void {
    // Clear existing bead display
    this.beadHandContainer.removeAll(true);

    if (!this.selectedToken?.beadHand) return;

    const counts = this.selectedToken.beadHand.getHandCounts();
    const colors: Record<string, number> = {
      red: 0xff4444,
      blue: 0x4444ff,
      green: 0x44ff44,
      white: 0xffffff,
    };

    let x = 0;
    for (const [color, count] of Object.entries(counts)) {
      for (let i = 0; i < count; i++) {
        const bead = this.add.circle(x, 10, 8, colors[color]).setStrokeStyle(1, 0x000000);
        this.beadHandContainer.add(bead);
        x += 20;
      }
    }
  }

  private updateMonsterBeadDisplay(): void {
    if (!this.monsterToken.hasBeadSystem()) {
      this.monsterBeadText.setText('');
      return;
    }

    const discarded = this.monsterToken.beadBag?.getDiscardedCounts();
    if (discarded) {
      this.monsterBeadText.setText(
        `Discards: R:${discarded.red} B:${discarded.blue} G:${discarded.green} W:${discarded.white}`
      );
    }
  }

  private log(message: string): void {
    this.logMessages.unshift(message);
    if (this.logMessages.length > 8) {
      this.logMessages.pop();
    }
    this.logText.setText(this.logMessages.join('\n'));
  }

  /**
   * Main turn processing loop - called after each action
   */
  private processTurn(): void {
    // Check for victory/defeat
    if (this.monsterToken.currentHealth <= 0) {
      this.victory();
      return;
    }

    const aliveCharacters = this.characterTokens.filter((c) => c.currentHealth > 0);
    if (aliveCharacters.length === 0) {
      this.defeat();
      return;
    }

    // Get next actor from wheel
    this.currentActorId = this.actionWheel.getNextActor();

    if (!this.currentActorId) {
      this.log('No actors on wheel!');
      return;
    }

    this.updateStatusText();
    this.updateWheelDisplay();

    if (this.currentActorId === 'monster') {
      this.log('--- Monster Turn ---');
      this.time.delayedCall(500, () => this.executeMonsterTurn());
    } else {
      this.log('--- Player Turn ---');
      this.showPlayerActions();
    }
  }

  private showPlayerActions(): void {
    // Clear any existing selection
    if (this.selectedToken) {
      this.selectedToken.setSelected(false);
    }

    // Find and select the current actor's token
    const currentToken = this.getCharacterTokenById(this.currentActorId!);
    if (currentToken && currentToken.currentHealth > 0) {
      this.selectedToken = currentToken;
      this.selectedToken.setSelected(true);
    }

    // Make characters clickable (validation happens in selectCharacter)
    for (const token of this.characterTokens) {
      if (token.currentHealth > 0) {
        token.setInteractive(true);
        token.onClick(() => this.selectCharacter(token));
      }
    }

    this.updateActionButtons();
    this.updateBeadHandDisplay();
  }

  private selectCharacter(token: CharacterToken): void {
    if (this.currentActorId === 'monster') return;

    // Verify this token is the current actor
    const expectedId = `hero-${token.index}`;
    if (expectedId !== this.currentActorId) {
      this.log(`Not ${token.characterClass.name}'s turn`);
      return;
    }

    if (this.selectedToken) {
      this.selectedToken.setSelected(false);
    }

    this.selectedToken = token;
    token.setSelected(true);
    this.updateActionButtons();
    this.updateBeadHandDisplay();
    this.log(`Selected: ${token.characterClass.name}`);
  }

  private updateActionButtons(): void {
    this.actionButtons.forEach((btn) => btn.destroy());
    this.actionButtons = [];

    if (!this.selectedToken || this.currentActorId === 'monster') return;

    let yOffset = 320;

    // Move button (cost 1)
    const moveBtn = this.createButton(900, yOffset, `Move (${ACTION_COSTS.move})`, () =>
      this.startMove()
    );
    this.actionButtons.push(moveBtn);
    yOffset += 40;

    // Run button (cost 2)
    const runBtn = this.createButton(900, yOffset, `Run (${ACTION_COSTS.run})`, () =>
      this.startRun()
    );
    this.actionButtons.push(runBtn);
    yOffset += 40;

    // Attack button (cost 2)
    const attackBtn = this.createButton(900, yOffset, `Attack (${ACTION_COSTS.attack})`, () =>
      this.executeAttack()
    );
    this.actionButtons.push(attackBtn);
    yOffset += 40;

    // Rest button (cost 2)
    const restBtn = this.createButton(900, yOffset, `Rest (${ACTION_COSTS.rest})`, () =>
      this.executeRest()
    );
    this.actionButtons.push(restBtn);
  }

  private startMove(): void {
    if (!this.selectedToken) return;
    this.log('Click a tile to move');
    this.highlightMovementRange(MOVEMENT_RANGES.move, ACTION_COSTS.move);
  }

  private startRun(): void {
    if (!this.selectedToken) return;
    this.log('Click a tile to run');
    this.highlightMovementRange(MOVEMENT_RANGES.run, ACTION_COSTS.run);
  }

  private highlightMovementRange(range: number, wheelCost: number): void {
    if (!this.selectedToken) return;

    const graphics = this.add.graphics();
    graphics.fillStyle(0x00ff00, 0.2);

    const currentX = this.selectedToken.gridX;
    const currentY = this.selectedToken.gridY;

    // Use MovementValidator to get valid moves
    const validMoves = this.movementValidator.getValidMoves(currentX, currentY, range);
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

        if (this.movementValidator.isValidMove(currentX, currentY, gridX, gridY, range)) {
          this.moveToken(this.selectedToken!, gridX, gridY, wheelCost);
        } else {
          this.log('Invalid move');
        }
      });
    });
  }

  private moveToken(token: CharacterToken, gridX: number, gridY: number, wheelCost: number): void {
    token.setGridPosition(gridX, gridY);

    this.tweens.add({
      targets: token.sprite,
      x: this.gridSystem.gridToWorld(gridX),
      y: this.gridSystem.gridToWorld(gridY),
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.log(`${token.characterClass.name} moved`);
        this.advanceAndProcessTurn(this.currentActorId!, wheelCost);
      },
    });
  }

  private executeAttack(): void {
    if (!this.selectedToken) return;

    // Check if adjacent to monster (range 1)
    const inRange = this.combatResolver.isInRange(
      this.selectedToken.gridX,
      this.selectedToken.gridY,
      this.monsterToken.gridX,
      this.monsterToken.gridY,
      1
    );

    if (!inRange) {
      this.log('Monster out of range! Must be adjacent.');
      return;
    }

    // Fixed damage of 1
    this.monsterToken.takeDamage(1);
    this.log(`${this.selectedToken.characterClass.name} attacks for 1 damage!`);

    this.updateStatusText();
    this.advanceAndProcessTurn(this.currentActorId!, ACTION_COSTS.attack);
  }

  private executeRest(): void {
    if (!this.selectedToken?.beadHand) return;

    const drawn = this.selectedToken.beadHand.drawToHand(2);
    this.log(`${this.selectedToken.characterClass.name} rests, draws: ${drawn.join(', ')}`);

    this.updateBeadHandDisplay();
    this.advanceAndProcessTurn(this.currentActorId!, ACTION_COSTS.rest);
  }

  private advanceAndProcessTurn(entityId: string, wheelCost: number): void {
    this.actionWheel.advanceEntity(entityId, wheelCost);

    // Clear selection and buttons
    if (this.selectedToken) {
      this.selectedToken.setSelected(false);
      this.selectedToken = null;
    }
    this.updateActionButtons();

    // Small delay before next turn
    this.time.delayedCall(300, () => this.processTurn());
  }

  private executeMonsterTurn(): void {
    if (!this.monsterToken.hasBeadSystem()) {
      this.log('Monster has no bead system!');
      this.advanceAndProcessTurn('monster', 2);
      return;
    }

    // Build character info for AI
    const characterInfo = this.characterTokens
      .filter((c) => c.currentHealth > 0)
      .map((c) => ({
        x: c.gridX,
        y: c.gridY,
        health: c.currentHealth,
      }));

    // Build blocked positions (alive tokens)
    const blockedPositions = this.tokens
      .filter((t) => t.currentHealth > 0)
      .map((t) => ({ x: t.gridX, y: t.gridY }));

    // Use bead-based AI
    const action: BeadBasedAction = this.monsterAI.selectBeadBasedAction(
      this.monsterToken.beadBag!,
      this.monsterToken.stateMachine!,
      { x: this.monsterToken.gridX, y: this.monsterToken.gridY },
      this.monster,
      characterInfo,
      this.arena.width,
      this.arena.height,
      blockedPositions
    );

    // Log the bead draw and state
    const beadColor = action.drawnBead || 'unknown';
    const stateName = action.state?.name || 'unknown';
    this.log(`Drew ${beadColor} → ${stateName}`);
    this.updateMonsterBeadDisplay();

    // Determine wheel cost from state
    const wheelCost = action.state?.wheel_cost || 2;

    if (action.type === 'attack' && action.target && action.state) {
      // Find the actual character token
      const targetToken = this.characterTokens.find(
        (c) => c.gridX === action.target!.x && c.gridY === action.target!.y
      );

      if (targetToken) {
        const damage = action.state.damage || 1;
        targetToken.takeDamage(damage);
        this.log(`${this.monster.name} hits for ${damage}!`);

        // Check for defeat
        const aliveChars = this.characterTokens.filter((c) => c.currentHealth > 0);
        if (aliveChars.length === 0) {
          this.time.delayedCall(500, () => this.defeat());
          return;
        }
      }

      this.time.delayedCall(500, () => this.advanceAndProcessTurn('monster', wheelCost));
    } else if (action.type === 'move' && action.destination) {
      this.log(`${this.monster.name} moves`);
      this.moveMonster(action.destination.x, action.destination.y, wheelCost);
    } else {
      // 'none' action - monster does nothing useful
      this.log(`${this.monster.name} hesitates...`);
      this.time.delayedCall(500, () => this.advanceAndProcessTurn('monster', wheelCost));
    }
  }

  private moveMonster(gridX: number, gridY: number, wheelCost: number): void {
    this.monsterToken.setGridPosition(gridX, gridY);

    this.tweens.add({
      targets: this.monsterToken.sprite,
      x: this.gridSystem.gridToWorld(gridX),
      y: this.gridSystem.gridToWorld(gridY),
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(300, () => this.advanceAndProcessTurn('monster', wheelCost));
      },
    });
  }

  private victory(): void {
    this.scene.start('VictoryScene', {
      victory: true,
      monster: this.monster.name,
      turns: 0, // We no longer track turns the same way
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
