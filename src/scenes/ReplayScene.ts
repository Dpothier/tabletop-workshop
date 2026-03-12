import Phaser from 'phaser';
import { CombatLogPlayer } from '@src/recording/CombatLogPlayer';
import { SnapshotHydrator } from '@src/recording/SnapshotHydrator';
import type { BattleSnapshot } from '@src/recording/BattleSnapshot';
import type { CombatLogEntry } from '@src/recording/CombatRecorder';
import { GridSystem } from '@src/systems/GridSystem';
import { GridVisual } from '@src/visuals/GridVisual';
import { AnimationExecutor } from '@src/ui/AnimationExecutor';
import { CharacterVisual } from '@src/visuals/CharacterVisual';
import { MonsterVisual } from '@src/visuals/MonsterVisual';
import { HERO_COLORS } from '@src/ui/colors';

interface ReplayData {
  snapshot: BattleSnapshot;
  entries: CombatLogEntry[];
}

export class ReplayScene extends Phaser.Scene {
  private player!: CombatLogPlayer;
  private hydrator!: SnapshotHydrator;
  private snapshot!: BattleSnapshot;
  private entries!: CombatLogEntry[];

  // Visuals
  private gridSystem!: GridSystem;
  private gridVisual!: GridVisual;
  private characterVisuals!: Map<string, CharacterVisual>;
  private monsterVisual!: MonsterVisual;
  private animationExecutor!: AnimationExecutor;

  // State
  private isPaused: boolean = true;
  private isAutoPlay: boolean = false;
  private currentStepIndex: number = 0;
  private totalSteps: number = 0;
  private currentRound: number = 1;
  private isAnimating: boolean = false;
  private autoPlayTimer?: Phaser.Time.TimerEvent;

  // UI elements
  private progressText!: Phaser.GameObjects.Text;
  private infoPanel!: Phaser.GameObjects.Text;
  private nextButton!: Phaser.GameObjects.Text;
  private autoButton!: Phaser.GameObjects.Text;
  private menuButton!: Phaser.GameObjects.Text;

  // Constants
  private readonly GRID_SIZE = 64;
  private readonly GRID_OFFSET_X = 80;
  private readonly GRID_OFFSET_Y = 80;

  constructor() {
    super({ key: 'ReplayScene' });
  }

  init(data: ReplayData): void {
    this.snapshot = data.snapshot;
    this.entries = data.entries;
    this.isPaused = true;
    this.isAutoPlay = false;
    this.currentStepIndex = 0;
    this.currentRound = 1;
    this.isAnimating = false;
  }

  create(): void {
    // 1. Create CombatLogPlayer and build steps
    this.player = new CombatLogPlayer();
    this.player.buildSteps(this.entries);
    this.totalSteps = this.player.getTotalSteps();

    // Check for empty recording
    if (this.totalSteps === 0) {
      this.createControls();
      this.infoPanel.setText('No combat data to replay');
      this.progressText.setText('No data');
      this.nextButton.removeInteractive();
      this.nextButton.setAlpha(0.3);
      this.autoButton.removeInteractive();
      this.autoButton.setAlpha(0.3);
      (this as any).__replayState = (): Record<string, any> => this.getState();
      return;
    }

    // 2. Create SnapshotHydrator
    this.hydrator = new SnapshotHydrator();

    // 3. Create GridSystem
    const arenaWidth = this.snapshot.arena?.width ?? 9;
    const arenaHeight = this.snapshot.arena?.height ?? 9;
    this.gridSystem = new GridSystem(
      this.GRID_SIZE,
      this.GRID_OFFSET_X,
      this.GRID_OFFSET_Y,
      arenaWidth,
      arenaHeight
    );

    // 4. Create GridVisual
    const arenaForVisual = {
      name: this.snapshot.arena?.name ?? 'Arena',
      width: arenaWidth,
      height: arenaHeight,
      terrain: (this.snapshot.arena as any)?.terrain,
      playerSpawns: [],
      monsterSpawn: { x: 0, y: 0 },
    };
    this.gridVisual = new GridVisual(this, {
      arena: arenaForVisual as any,
      gridSystem: this.gridSystem,
    });
    this.gridVisual.draw();

    // 5. Create entity visuals from snapshot positions
    this.characterVisuals = new Map();
    const positions = this.hydrator.getInitialPositions(this.snapshot);

    // Create character visuals
    let charIndex = 0;
    for (const character of this.snapshot.characters) {
      const pos = positions.get(character.id);
      if (pos) {
        const worldX = this.gridSystem.gridToWorld(pos.x);
        const worldY = this.gridSystem.gridToWorld(pos.y);
        const mockClass = { stats: { health: character.maxHealth } } as any;
        const color = HERO_COLORS[charIndex % HERO_COLORS.length];
        const cv = new CharacterVisual(this, worldX, worldY, mockClass, color, charIndex);
        cv.updateHealth(character.currentHealth, character.maxHealth);
        this.characterVisuals.set(character.id, cv);
        charIndex++;
      }
    }

    // Create monster visual
    const monsterPos = positions.get(this.snapshot.monster.id);
    if (monsterPos) {
      const worldX = this.gridSystem.gridToWorld(monsterPos.x);
      const worldY = this.gridSystem.gridToWorld(monsterPos.y);
      const mockMonster = {
        name: this.snapshot.monster.name,
        stats: { health: this.snapshot.monster.maxHealth },
      } as any;
      this.monsterVisual = new MonsterVisual(this, worldX, worldY, mockMonster);
      this.monsterVisual.updateHealth(
        this.snapshot.monster.health,
        this.snapshot.monster.maxHealth
      );
    }

    // 6. Create AnimationExecutor with mock BattleUI
    const mockBattleUI = {
      addLogEntry: (msg: string): void => {
        this.updateInfoPanel(msg);
      },
    } as any;

    this.animationExecutor = new AnimationExecutor(
      this.gridSystem,
      this.characterVisuals,
      this.monsterVisual,
      mockBattleUI,
      undefined,
      undefined
    );

    // 7. Create UI controls
    this.createControls();

    // 8. Set up keyboard shortcuts
    this.input.keyboard?.on('keydown-RIGHT', (): void => {
      this.stepNext();
    });
    this.input.keyboard?.on('keydown-SPACE', (): void => {
      this.toggleAutoPlay();
    });

    // 9. Expose state for E2E testing
    (this as any).__replayState = (): Record<string, any> => this.getState();
  }

  private createControls(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Progress text (top center)
    this.progressText = this.add
      .text(width / 2, 20, `Step 0 / ${this.totalSteps} | Round 1`, {
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    // Info panel (right side)
    this.infoPanel = this.add.text(width - 200, 100, 'Ready to replay', {
      fontSize: '14px',
      color: '#cccccc',
      wordWrap: { width: 180 },
    });

    // Next button (bottom center-left)
    this.nextButton = this.add
      .text(width / 2 - 80, height - 50, '▶ Next', {
        fontSize: '20px',
        color: '#44ff88',
        backgroundColor: '#333355',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.nextButton.on('pointerdown', (): void => {
      this.stepNext();
    });

    // Auto/Pause button (bottom center-right)
    this.autoButton = this.add
      .text(width / 2 + 80, height - 50, '⏵ Auto', {
        fontSize: '20px',
        color: '#ffff44',
        backgroundColor: '#333355',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.autoButton.on('pointerdown', (): void => {
      this.toggleAutoPlay();
    });

    // Menu button (bottom left)
    this.menuButton = this.add
      .text(20, height - 50, '← Menu', {
        fontSize: '16px',
        color: '#aaaaaa',
        backgroundColor: '#333355',
        padding: { x: 10, y: 5 },
      })
      .setInteractive({ useHandCursor: true });
    this.menuButton.on('pointerdown', (): void => {
      this.scene.start('MenuScene');
    });
  }

  private async stepNext(): Promise<void> {
    if (this.isAnimating || this.player.isComplete()) return;

    this.isAnimating = true;
    const step = this.player.nextStep();
    if (!step) {
      this.isAnimating = false;
      this.onReplayComplete();
      return;
    }

    this.currentStepIndex = this.player.getCurrentStepIndex();

    // Update round counter
    if (step.includesRoundEnd) {
      this.currentRound++;
    }

    // Update info panel
    this.updateInfoPanel(`${step.actorName}'s turn`);

    // Convert to animation events and play
    const events = this.player.toAnimationEvents(step);
    if (events.length > 0) {
      await this.animationExecutor.execute(events);
    }

    // Update progress
    this.updateProgress();

    this.isAnimating = false;

    // If auto-play, don't pause
    if (!this.isAutoPlay) {
      this.isPaused = true;
    }
  }

  private toggleAutoPlay(): void {
    if (this.isAutoPlay) {
      // Stop auto-play
      this.isAutoPlay = false;
      this.isPaused = true;
      if (this.autoPlayTimer) {
        this.autoPlayTimer.remove();
        this.autoPlayTimer = undefined;
      }
      this.autoButton.setText('⏵ Auto');
    } else {
      // Start auto-play
      this.isAutoPlay = true;
      this.isPaused = false;
      this.autoButton.setText('⏸ Pause');
      this.autoPlayStep();
    }
  }

  private async autoPlayStep(): Promise<void> {
    if (!this.isAutoPlay || this.player.isComplete()) {
      this.isAutoPlay = false;
      this.isPaused = true;
      this.autoButton.setText('⏵ Auto');
      return;
    }

    await this.stepNext();

    if (this.isAutoPlay && !this.player.isComplete()) {
      this.autoPlayTimer = this.time.delayedCall(1000, (): void => {
        this.autoPlayStep();
      });
    } else {
      this.isAutoPlay = false;
      this.isPaused = true;
      this.autoButton.setText('⏵ Auto');
    }
  }

  private updateProgress(): void {
    this.progressText.setText(
      `Step ${this.currentStepIndex + 1} / ${this.totalSteps} | Round ${this.currentRound}`
    );
  }

  private updateInfoPanel(message: string): void {
    this.infoPanel.setText(message);
  }

  private onReplayComplete(): void {
    // Find battle-end entry for outcome
    const battleEnd = this.entries.find((e): e is any => (e as any).type === 'battle-end') as
      | any
      | undefined;
    const outcome = battleEnd?.outcome ?? 'unknown';

    this.updateInfoPanel(
      `Replay complete - ${outcome === 'victory' ? 'Victory!' : 'Defeat'}\n${this.currentRound} rounds`
    );
    this.nextButton.setText('Complete');
    this.nextButton.removeInteractive();
    this.autoButton.setVisible(false);
  }

  public getState(): Record<string, any> {
    return {
      scene: 'ReplayScene',
      isPaused: this.isPaused,
      isAutoPlay: this.isAutoPlay,
      currentStepIndex: this.currentStepIndex,
      totalSteps: this.totalSteps,
      currentRound: this.currentRound,
    };
  }
}
