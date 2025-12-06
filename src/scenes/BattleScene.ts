import Phaser from 'phaser';
import { Arena, Monster, CharacterClass, Rules } from '../systems/DataLoader';
import { Token, CharacterToken, MonsterToken } from '../entities/Token';
import { TurnManager } from '../systems/TurnManager';
import { DiceRoller } from '../systems/DiceRoller';
import { GridSystem } from '../systems/GridSystem';
import { MovementValidator } from '../systems/MovementValidator';
import { CombatResolver } from '../systems/CombatResolver';
import { MonsterAI } from '../systems/MonsterAI';

interface BattleData {
  monster: Monster;
  arena: Arena;
  partySize: number;
  classes: CharacterClass[];
  rules: Rules;
}

export class BattleScene extends Phaser.Scene {
  private arena!: Arena;
  private monster!: Monster;
  private rules!: Rules;
  private partySize!: number;
  private classes!: CharacterClass[];

  // Visual elements
  private grid!: Phaser.GameObjects.Graphics;
  private tokens: Token[] = [];
  private characterTokens: CharacterToken[] = [];
  private monsterToken!: MonsterToken;

  // Systems
  private turnManager!: TurnManager;
  private gridSystem!: GridSystem;
  private movementValidator!: MovementValidator;
  private combatResolver!: CombatResolver;
  private monsterAI!: MonsterAI;

  // State
  private selectedToken: CharacterToken | null = null;
  private currentPhase: 'select' | 'move' | 'action' | 'monster' = 'select';

  // Constants
  private readonly GRID_SIZE = 64;
  private readonly GRID_OFFSET_X = 80;
  private readonly GRID_OFFSET_Y = 80;

  // UI elements
  private statusText!: Phaser.GameObjects.Text;
  private actionButtons: Phaser.GameObjects.Container[] = [];
  private logText!: Phaser.GameObjects.Text;
  private logMessages: string[] = [];

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: BattleData): void {
    this.monster = data.monster;
    this.arena = data.arena;
    this.partySize = data.partySize;
    this.classes = data.classes;
    this.rules = data.rules;
  }

  create(): void {
    this.initializeSystems();
    this.drawGrid();
    this.createTokens();
    this.turnManager = new TurnManager(this.characterTokens, this.monsterToken, this.rules);
    this.createUI();
    this.startPlayerTurn();
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

    // Action buttons area
    this.add.rectangle(900, 350, 200, 200, 0x1a1a2e).setStrokeStyle(2, 0x4a4a6a);
    this.add
      .text(900, 260, 'Actions', {
        fontSize: '18px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    // Battle log
    this.add.rectangle(900, 600, 200, 250, 0x1a1a2e).setStrokeStyle(2, 0x4a4a6a);
    this.add
      .text(900, 480, 'Battle Log', {
        fontSize: '16px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);
    this.logText = this.add.text(810, 500, '', {
      fontSize: '12px',
      color: '#cccccc',
      wordWrap: { width: 180 },
      lineSpacing: 4,
    });

    // End Turn button
    const endTurnBtn = this.createButton(900, 720, 'End Turn', () => this.endPlayerTurn());
    endTurnBtn.setVisible(true);
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 160, 40, 0x444466).setInteractive({ useHandCursor: true });
    const label = this.add
      .text(0, 0, text, {
        fontSize: '16px',
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
    const lines = [
      `Monster: ${this.monster.name}`,
      `HP: ${this.monsterToken.currentHealth}/${this.monster.stats.health}`,
      '',
      `Turn: ${this.turnManager?.currentTurn || 1}`,
      `Phase: ${this.currentPhase.toUpperCase()}`,
    ];
    this.statusText.setText(lines.join('\n'));
  }

  private log(message: string): void {
    this.logMessages.unshift(message);
    if (this.logMessages.length > 10) {
      this.logMessages.pop();
    }
    this.logText.setText(this.logMessages.join('\n'));
  }

  private startPlayerTurn(): void {
    this.currentPhase = 'select';
    this.log('--- Player Turn ---');

    this.characterTokens.forEach((token) => {
      token.hasMoved = false;
      token.hasActed = false;
      token.setInteractive(true);
      token.onClick(() => this.selectCharacter(token));
    });

    this.updateActionButtons();
    this.updateStatusText();
  }

  private selectCharacter(token: CharacterToken): void {
    if (this.currentPhase === 'monster') return;

    if (this.selectedToken) {
      this.selectedToken.setSelected(false);
    }

    this.selectedToken = token;
    token.setSelected(true);
    this.currentPhase = 'select';
    this.updateActionButtons();
    this.updateStatusText();
    this.log(`Selected: ${token.characterClass.name}`);
  }

  private updateActionButtons(): void {
    this.actionButtons.forEach((btn) => btn.destroy());
    this.actionButtons = [];

    if (!this.selectedToken) return;

    let yOffset = 290;

    if (!this.selectedToken.hasMoved) {
      const moveBtn = this.createButton(900, yOffset, 'Move', () => this.startMove());
      this.actionButtons.push(moveBtn);
      yOffset += 50;
    }

    if (!this.selectedToken.hasActed) {
      const attackBtn = this.createButton(900, yOffset, 'Attack', () => this.startAttack());
      this.actionButtons.push(attackBtn);
      yOffset += 50;

      if (this.selectedToken.characterClass.abilities?.length) {
        const abilityBtn = this.createButton(900, yOffset, 'Special', () => this.useAbility());
        this.actionButtons.push(abilityBtn);
      }
    }
  }

  private startMove(): void {
    if (!this.selectedToken || this.selectedToken.hasMoved) return;

    this.currentPhase = 'move';
    this.updateStatusText();
    this.log('Click a tile to move');
    this.highlightMovementRange();
  }

  private highlightMovementRange(): void {
    if (!this.selectedToken) return;

    const speed = this.selectedToken.characterClass.stats.speed;
    const graphics = this.add.graphics();
    graphics.fillStyle(0x00ff00, 0.2);

    const currentX = this.selectedToken.gridX;
    const currentY = this.selectedToken.gridY;

    // Use MovementValidator to get valid moves
    const validMoves = this.movementValidator.getValidMoves(currentX, currentY, speed);

    for (const move of validMoves) {
      graphics.fillRect(
        this.GRID_OFFSET_X + move.x * this.GRID_SIZE + 2,
        this.GRID_OFFSET_Y + move.y * this.GRID_SIZE + 2,
        this.GRID_SIZE - 4,
        this.GRID_SIZE - 4
      );
    }

    this.input.once('pointerdown', (pointer: Phaser.Input.Pointer) => {
      graphics.destroy();
      const gridX = this.gridSystem.worldToGrid(pointer.x);
      const gridY = this.gridSystem.worldToGrid(pointer.y);

      if (this.movementValidator.isValidMove(currentX, currentY, gridX, gridY, speed)) {
        this.moveToken(this.selectedToken!, gridX, gridY);
      } else {
        this.currentPhase = 'select';
        this.updateStatusText();
      }
    });
  }

  private moveToken(token: Token, gridX: number, gridY: number): void {
    token.setGridPosition(gridX, gridY);

    this.tweens.add({
      targets: token.sprite,
      x: this.gridSystem.gridToWorld(gridX),
      y: this.gridSystem.gridToWorld(gridY),
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        if (token instanceof CharacterToken) {
          token.hasMoved = true;
          this.currentPhase = 'select';
          this.updateActionButtons();
          this.updateStatusText();
          this.log(`${token.characterClass.name} moved`);
        }
      },
    });
  }

  private startAttack(): void {
    if (!this.selectedToken || this.selectedToken.hasActed) return;

    this.currentPhase = 'action';
    this.updateStatusText();

    const range = this.selectedToken.characterClass.stats.range || 1;
    const inRange = this.combatResolver.isInRange(
      this.selectedToken.gridX,
      this.selectedToken.gridY,
      this.monsterToken.gridX,
      this.monsterToken.gridY,
      range
    );

    if (inRange) {
      this.executeAttack(this.selectedToken, this.monsterToken);
    } else {
      this.log('Monster out of range!');
      this.currentPhase = 'select';
      this.updateStatusText();
    }
  }

  private executeAttack(attacker: CharacterToken, target: MonsterToken): void {
    const attackResult = this.combatResolver.resolveAttack(
      attacker.characterClass.stats.damage,
      target.monster.stats.armor || 0
    );

    target.takeDamage(attackResult.damage);
    attacker.hasActed = true;

    this.log(`${attacker.characterClass.name} attacks!`);
    this.log(
      `Rolled ${attackResult.rawRoll} - ${attackResult.armorReduction} armor = ${attackResult.damage} damage`
    );

    this.updateStatusText();
    this.updateActionButtons();

    if (target.currentHealth <= 0) {
      this.time.delayedCall(500, () => this.victory());
    }
  }

  private useAbility(): void {
    if (!this.selectedToken || this.selectedToken.hasActed) return;

    const ability = this.selectedToken.characterClass.abilities?.[0];
    if (!ability) return;

    this.log(`${this.selectedToken.characterClass.name} uses ${ability.name}!`);

    if (ability.effect === 'heal') {
      const healResult = this.combatResolver.resolveAttack(ability.value || '1d6', 0);
      this.selectedToken.heal(healResult.rawRoll);
      this.log(`Healed for ${healResult.rawRoll}`);
    } else if (ability.effect === 'damage') {
      const damageResult = this.combatResolver.resolveAttack(ability.value || '2d6', 0);
      this.monsterToken.takeDamage(damageResult.rawRoll);
      this.log(`Dealt ${damageResult.rawRoll} damage!`);
    }

    this.selectedToken.hasActed = true;
    this.updateActionButtons();
    this.updateStatusText();

    if (this.monsterToken.currentHealth <= 0) {
      this.time.delayedCall(500, () => this.victory());
    }
  }

  private endPlayerTurn(): void {
    this.selectedToken?.setSelected(false);
    this.selectedToken = null;
    this.currentPhase = 'monster';
    this.updateStatusText();
    this.updateActionButtons();

    this.log('--- Monster Turn ---');
    this.time.delayedCall(500, () => this.executeMonsterTurn());
  }

  private executeMonsterTurn(): void {
    // Build character info for AI
    const characterInfo = this.characterTokens.map((c) => ({
      x: c.gridX,
      y: c.gridY,
      health: c.currentHealth,
    }));

    // Build blocked positions (alive tokens)
    const blockedPositions = this.tokens
      .filter((t) => t.currentHealth > 0)
      .map((t) => ({ x: t.gridX, y: t.gridY }));

    // Get monster's current phase
    const currentPhase = this.monsterToken.getCurrentPhase() || null;

    // Use MonsterAI to decide action
    const action = this.monsterAI.decideAction(
      { x: this.monsterToken.gridX, y: this.monsterToken.gridY },
      this.monster,
      currentPhase,
      characterInfo,
      this.arena.width,
      this.arena.height,
      blockedPositions
    );

    if (!action || action.type === 'none') {
      this.turnManager.nextTurn();
      this.startPlayerTurn();
      return;
    }

    if (action.type === 'attack' && action.target && action.attack) {
      // Find the actual character token
      const targetToken = this.characterTokens.find(
        (c) => c.gridX === action.target!.x && c.gridY === action.target!.y
      );

      if (targetToken) {
        const attackResult = this.combatResolver.resolveAttack(action.attack.damage, 0);
        targetToken.takeDamage(attackResult.damage);

        this.log(`${this.monster.name} uses ${action.attack.name}!`);
        this.log(`${targetToken.characterClass.name} takes ${attackResult.damage} damage`);

        if (action.attack.effect) {
          this.log(`Effect: ${action.attack.effect}`);
        }

        // Check for defeat using TurnManager
        if (this.turnManager.isPartyDefeated()) {
          this.time.delayedCall(500, () => this.defeat());
          return;
        }
      }

      this.turnManager.nextTurn();
      this.time.delayedCall(800, () => this.startPlayerTurn());
    } else if (action.type === 'move' && action.destination) {
      this.log(`${this.monster.name} moves closer`);
      this.moveMonster(action.destination.x, action.destination.y);
    }
  }

  private moveMonster(gridX: number, gridY: number): void {
    this.monsterToken.setGridPosition(gridX, gridY);

    this.tweens.add({
      targets: this.monsterToken.sprite,
      x: this.gridSystem.gridToWorld(gridX),
      y: this.gridSystem.gridToWorld(gridY),
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.turnManager.nextTurn();
        this.time.delayedCall(500, () => this.startPlayerTurn());
      },
    });
  }

  private victory(): void {
    this.scene.start('VictoryScene', {
      victory: true,
      monster: this.monster.name,
      turns: this.turnManager.currentTurn,
    });
  }

  private defeat(): void {
    this.scene.start('VictoryScene', {
      victory: false,
      monster: this.monster.name,
      turns: this.turnManager.currentTurn,
    });
  }
}
