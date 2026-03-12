import Phaser from 'phaser';
import { loadGameData, GameData } from '@src/systems/DataLoader';
import { BattleBuilder } from '@src/builders/BattleBuilder';
import { CharacterStorageService } from '@src/services/CharacterStorageService';
import { CharacterSelectionPopup } from '@src/ui/CharacterSelectionPopup';
import { CharacterManagementPanel } from '@src/ui/CharacterManagementPanel';
import { CombatLogStorage } from '@src/recording/CombatLogStorage';
import { CombatLogSerializer } from '@src/recording/CombatLogSerializer';
import type { CharacterData } from '@src/types/CharacterData';

export class MenuScene extends Phaser.Scene {
  private gameData!: GameData;
  private builder!: BattleBuilder;
  private characterStorage!: CharacterStorageService;
  private selectedCharacters: (CharacterData | null)[] = [null, null, null, null];
  private slotContainers: Phaser.GameObjects.Container[] = [];
  private startButton!: Phaser.GameObjects.Rectangle;
  private characterSelectionPopup!: CharacterSelectionPopup;
  private characterManagementPanel!: CharacterManagementPanel;
  private recentCombats: Array<{
    id: string;
    monsterName: string;
    outcome: 'victory' | 'defeat';
    date: number;
  }> = [];
  private replayPanelVisible: boolean = false;
  private errorMessage: string | null = null;
  private fileInput?: HTMLInputElement;
  private replayCombatButtons: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super({ key: 'MenuScene' });
  }

  async create(): Promise<void> {
    // Reset state for scene restart
    this.slotContainers = [];
    this.selectedCharacters = [null, null, null, null];

    this.gameData = await loadGameData();

    // Initialize builder with defaults
    this.builder = new BattleBuilder()
      .withMonster(this.gameData.monsters[0])
      .withArena(this.gameData.arenas[0])
      .withPartySize(4)
      .withClasses(this.gameData.classes)
      .withActions(this.gameData.actions);

    const centerX = this.cameras.main.width / 2;

    // Title
    this.add
      .text(centerX, 60, 'BOSS BATTLE', {
        fontSize: '48px',
        color: '#e0e0e0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 110, 'Tabletop Prototype', {
        fontSize: '20px',
        color: '#888888',
      })
      .setOrigin(0.5);

    // Monster Selection
    this.add
      .text(centerX, 180, 'Select Monster', {
        fontSize: '24px',
        color: '#ffaa00',
      })
      .setOrigin(0.5);

    const monsterNames = this.gameData.monsters.map((m) => m.name);
    this.createSelector(centerX, 220, monsterNames, (index) => {
      this.builder.withMonster(this.gameData.monsters[index]);
    });

    // Arena Selection
    this.add
      .text(centerX, 300, 'Select Arena', {
        fontSize: '24px',
        color: '#00aaff',
      })
      .setOrigin(0.5);

    const arenaNames = this.gameData.arenas.map((a) => a.name);
    this.createSelector(centerX, 340, arenaNames, (index) => {
      this.builder.withArena(this.gameData.arenas[index]);
    });

    // Select Party
    this.add
      .text(centerX, 400, 'Select Party', {
        fontSize: '24px',
        color: '#00ff88',
      })
      .setOrigin(0.5);

    this.createCharacterSlots();

    // Start Button (keep at original position for E2E tests)
    this.startButton = this.add
      .rectangle(centerX, 580, 200, 60, 0x44aa44)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(centerX, 580, 'START BATTLE', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.startButton.on('pointerover', () => this.startButton.setFillStyle(0x55cc55));
    this.startButton.on('pointerout', () => this.startButton.setFillStyle(0x44aa44));
    this.startButton.on('pointerdown', () => this.startBattle());

    this.updateStartButtonState();

    // Create Character Button (below Start Battle)
    const createCharButton = this.add
      .rectangle(centerX, 650, 180, 40, 0x4488ff)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(centerX, 650, 'Create Character', {
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    createCharButton.on('pointerover', () => createCharButton.setFillStyle(0x5599cc));
    createCharButton.on('pointerout', () => createCharButton.setFillStyle(0x4488ff));
    createCharButton.on('pointerdown', () => this.createCharacter());

    // Manage Characters Button
    const manageCharButton = this.add
      .rectangle(centerX, 700, 180, 40, 0x668899)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(centerX, 700, 'Manage Characters', {
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    manageCharButton.on('pointerover', () => manageCharButton.setFillStyle(0x7799aa));
    manageCharButton.on('pointerout', () => manageCharButton.setFillStyle(0x668899));
    manageCharButton.on('pointerdown', () => this.manageCharacters());

    // Replay Combat Button
    const replayBtn = this.add
      .rectangle(centerX, 750, 180, 40, 0x885566)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(centerX, 750, 'Rejouer un combat', {
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    replayBtn.on('pointerover', () => replayBtn.setFillStyle(0x996677));
    replayBtn.on('pointerout', () => replayBtn.setFillStyle(0x885566));
    replayBtn.on('pointerdown', () => this.showReplayPanel());

    // Instructions
    this.add
      .text(centerX, 790, 'Click arrows to select, then START BATTLE', {
        fontSize: '16px',
        color: '#666666',
      })
      .setOrigin(0.5);

    // Character Selection Popup
    this.characterSelectionPopup = new CharacterSelectionPopup(this);

    // Character Management Panel
    this.characterManagementPanel = new CharacterManagementPanel(this);

    // Create hidden file input for replay panel
    this.createFileInput();

    // Expose state for E2E testing
    (this as any).__menuReplayState = (): Record<string, any> => ({
      hasReplayButton: true,
      recentCombats: this.recentCombats.map((c) => ({
        id: c.id,
        monsterName: c.monsterName,
        outcome: c.outcome,
        date: c.date,
      })),
      replayPanelVisible: this.replayPanelVisible,
      errorMessage: this.errorMessage,
    });
  }

  private createSelector(
    x: number,
    y: number,
    options: string[],
    onChange: (index: number) => void,
    defaultIndex: number = 0
  ): void {
    let currentIndex = defaultIndex;

    const displayText = this.add
      .text(x, y, options[currentIndex], {
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const leftArrow = this.add
      .text(x - 150, y, '<', {
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const rightArrow = this.add
      .text(x + 150, y, '>', {
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    leftArrow.on('pointerdown', () => {
      currentIndex = (currentIndex - 1 + options.length) % options.length;
      displayText.setText(options[currentIndex]);
      onChange(currentIndex);
    });

    rightArrow.on('pointerdown', () => {
      currentIndex = (currentIndex + 1) % options.length;
      displayText.setText(options[currentIndex]);
      onChange(currentIndex);
    });
  }

  private createCharacterSlots(): void {
    this.characterStorage = new CharacterStorageService();
    const allCharacters = this.characterStorage.getAll();

    // Auto-populate with first 4 characters
    for (let i = 0; i < 4 && i < allCharacters.length; i++) {
      this.selectedCharacters[i] = allCharacters[i];
    }

    // Slot positions: X: [218, 414, 610, 806], Y: 470
    const slotPositions = [
      { x: 218, y: 470 },
      { x: 414, y: 470 },
      { x: 610, y: 470 },
      { x: 806, y: 470 },
    ];

    for (let i = 0; i < 4; i++) {
      const container = this.add.container(slotPositions[i].x, slotPositions[i].y);
      this.slotContainers.push(container);

      // Create hit area for slot
      const hitArea = this.add
        .rectangle(0, 0, 180, 100, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      container.add(hitArea);

      hitArea.on('pointerdown', () => this.handleSlotClick(i));

      this.renderSlot(i);
    }
  }

  private renderSlot(index: number): void {
    const container = this.slotContainers[index];
    const character = this.selectedCharacters[index];

    // Clear existing children (except hit area at index 0)
    while (container.list.length > 1) {
      const child = container.list[container.list.length - 1] as Phaser.GameObjects.GameObject;
      container.remove(child, true);
    }

    if (character === null) {
      // Empty slot
      const bgEmpty = this.add.rectangle(0, 0, 180, 100, 0x3d3d5d);
      container.add(bgEmpty);

      const plusText = this.add.text(0, -10, '+', {
        fontSize: '40px',
        color: '#ffffff',
      });
      plusText.setOrigin(0.5);
      container.add(plusText);

      const emptyText = this.add.text(0, 25, 'Empty', {
        fontSize: '14px',
        color: '#999999',
      });
      emptyText.setOrigin(0.5);
      container.add(emptyText);
    } else {
      // Filled slot
      const bgFilled = this.add.rectangle(0, 0, 180, 100, 0x4a4a6a);
      container.add(bgFilled);

      // Letter circle based on first letter
      const firstLetter = character.name[0].toUpperCase();
      const letterColor = this.getLetterColor(firstLetter);
      const circle = this.add.circle(0, -25, 18, letterColor);
      container.add(circle);

      const letterText = this.add.text(0, -25, firstLetter, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      letterText.setOrigin(0.5);
      container.add(letterText);

      // Character name
      const nameText = this.add.text(0, 0, character.name, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      nameText.setOrigin(0.5);
      container.add(nameText);

      // Attributes string: S:X D:X M:X R:X
      const attrString = `S:${character.attributes.str} D:${character.attributes.dex} M:${character.attributes.mnd} R:${character.attributes.spr}`;
      const attrText = this.add.text(0, 20, attrString, {
        fontSize: '12px',
        color: '#aaaaaa',
      });
      attrText.setOrigin(0.5);
      container.add(attrText);

      // Weapon name
      const weaponText = this.add.text(0, 35, character.weapon, {
        fontSize: '12px',
        color: '#ffaa88',
      });
      weaponText.setOrigin(0.5);
      container.add(weaponText);
    }
  }

  private getLetterColor(letter: string): number {
    const colorMap: { [key: string]: number } = {
      W: 0x8866cc,
      M: 0x66aaee,
      R: 0xaa66ee,
      C: 0xeeaa66,
    };
    return colorMap[letter] || 0x666666;
  }

  private handleSlotClick(index: number): void {
    const allCharacters = this.characterStorage.getAll();
    const selectedIds = this.selectedCharacters.map((c) => c?.id ?? null);

    this.characterSelectionPopup.show(index, allCharacters, selectedIds, {
      onSelect: (character: CharacterData) => {
        this.selectedCharacters[index] = character;
        this.renderSlot(index);
        this.updateStartButtonState();
      },
      onRemove: () => {
        this.selectedCharacters[index] = null;
        this.renderSlot(index);
        this.updateStartButtonState();
      },
      onCreateNew: () => {
        this.characterSelectionPopup.hide();
        this.scene.start('CharacterCreationScene');
      },
      onClose: () => {
        // No changes needed
      },
    });
  }

  private updateStartButtonState(): void {
    const hasAnyCharacter = this.selectedCharacters.some((c) => c !== null);

    if (hasAnyCharacter) {
      this.startButton.setFillStyle(0x44aa44);
      this.startButton.setInteractive({ useHandCursor: true });
    } else {
      this.startButton.setFillStyle(0x666666);
      this.startButton.disableInteractive();
    }

    const partySize = this.selectedCharacters.filter(Boolean).length || 1;
    this.builder.withPartySize(partySize);
  }

  public get characterSlotsState(): {
    slots: Array<{
      id: string;
      name: string;
      attributes: { str: number; dex: number; mnd: number; spr: number };
      weapon: string;
    } | null>;
    canStartBattle: boolean;
  } {
    return {
      slots: this.selectedCharacters.map((char) => {
        if (!char) return null;
        return {
          id: char.id,
          name: char.name,
          attributes: { ...char.attributes },
          weapon: char.weapon,
        };
      }),
      canStartBattle: this.selectedCharacters.some((c) => c !== null),
    };
  }

  public get characterPopupState() {
    return this.characterSelectionPopup?.getState() ?? null;
  }

  public get hasManageCharactersButton(): boolean {
    return true;
  }

  public get characterManagementState() {
    return this.characterManagementPanel?.getState() ?? null;
  }

  private createCharacter(): void {
    this.scene.start('CharacterCreationScene');
  }

  private manageCharacters(): void {
    const allCharacters = this.characterStorage.getAll();
    const partyIds = this.selectedCharacters
      .filter((c): c is CharacterData => c !== null)
      .map((c) => c.id);

    this.characterManagementPanel.show(allCharacters, partyIds, {
      onEdit: (character) => {
        this.characterManagementPanel.hide();
        this.scene.start('CharacterCreationScene', { editCharacter: character });
      },
      onDelete: (characterId) => {
        this.characterStorage.delete(characterId);
        // Remove from party if present
        this.selectedCharacters = this.selectedCharacters.map((c) =>
          c?.id === characterId ? null : c
        );
        this.slotContainers.forEach((_, i) => this.renderSlot(i));
        this.updateStartButtonState();
      },
      onExport: () => {
        this.exportCharacters();
      },
      onImport: () => {
        this.importCharacters();
      },
      onClose: () => {
        // No changes needed
      },
    });
  }

  private exportCharacters(): void {
    const allCharacters = this.characterStorage.getAll();
    const customCharacters = allCharacters.filter((c) => !c.isDefault);
    const json = JSON.stringify(customCharacters, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'characters.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  private importCharacters(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result as string);
          if (!Array.isArray(imported)) return;
          for (const char of imported) {
            if (char.name && char.attributes && char.weapon) {
              try {
                this.characterStorage.save({
                  name: char.name,
                  attributes: char.attributes,
                  weapon: char.weapon,
                  isDefault: false,
                });
              } catch {
                // Skip duplicates or limit exceeded
              }
            }
          }
          // Refresh the management panel
          this.characterManagementPanel.hide();
          this.manageCharacters();
        } catch {
          // Invalid JSON, ignore
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  private startBattle(): void {
    if (!this.selectedCharacters.some((c) => c !== null)) return;
    const party = this.selectedCharacters.filter((c): c is CharacterData => c !== null);
    this.builder.withCharacterData(party);
    const state = this.builder.build();
    this.scene.start('BattleScene', { state });
  }

  private createFileInput(): void {
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = '.jsonl';
      this.fileInput.style.display = 'none';
      this.fileInput.onchange = () => this.handleFileUpload();
      document.body.appendChild(this.fileInput);
    }
  }

  private showReplayPanel(): void {
    this.replayPanelVisible = true;
    this.errorMessage = null;

    const storage = new CombatLogStorage(localStorage);
    this.recentCombats = storage.listRecordings().map((rec) => ({
      id: rec.id,
      monsterName: rec.monsterName,
      outcome: rec.outcome,
      date: typeof rec.date === 'number' ? rec.date : Date.now(),
    }));

    // Create panel UI
    this.createReplayPanel();
  }

  private createReplayPanel(): void {
    const centerX = this.cameras.main.width / 2;
    const panelY = 250;

    // Clear existing buttons
    this.replayCombatButtons.forEach((btn) => btn.destroy());
    this.replayCombatButtons = [];

    // Panel background
    this.add.rectangle(centerX, panelY, 400, 300, 0x222244, 0.9);

    // Title
    this.add
      .text(centerX, panelY - 130, 'Recent Combats', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // List recent combats
    this.recentCombats.forEach((combat, index) => {
      const yPos = panelY - 80 + index * 50;
      const btn = this.add
        .rectangle(centerX, yPos, 350, 40, 0x4a4a6a)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(centerX - 150, yPos, `${combat.monsterName} (${combat.outcome})`, {
          fontSize: '14px',
          color: '#ffffff',
        })
        .setOrigin(0, 0.5);

      btn.on('pointerover', () => btn.setFillStyle(0x5a5a7a));
      btn.on('pointerout', () => btn.setFillStyle(0x4a4a6a));
      btn.on('pointerdown', () => {
        this.selectCombatForReplay(combat.id);
      });

      this.replayCombatButtons.push(btn);
    });

    // File upload button
    const uploadY = panelY + 80;
    const uploadBtn = this.add
      .rectangle(centerX - 100, uploadY, 80, 40, 0x4488cc)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(centerX - 100, uploadY, 'Upload', {
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    uploadBtn.on('pointerover', () => uploadBtn.setFillStyle(0x5599dd));
    uploadBtn.on('pointerout', () => uploadBtn.setFillStyle(0x4488cc));
    uploadBtn.on('pointerdown', () => {
      this.fileInput?.click();
    });

    // Close button
    const closeBtn = this.add
      .rectangle(centerX + 100, uploadY, 80, 40, 0x884444)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(centerX + 100, uploadY, 'Close', {
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x995555));
    closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x884444));
    closeBtn.on('pointerdown', () => {
      this.hideReplayPanel();
    });

    // Error message if present
    if (this.errorMessage) {
      this.add
        .text(centerX, panelY + 130, this.errorMessage, {
          fontSize: '12px',
          color: '#ff6666',
          wordWrap: { width: 350 },
          align: 'center',
        })
        .setOrigin(0.5);
    }
  }

  private hideReplayPanel(): void {
    this.replayPanelVisible = false;
    this.replayCombatButtons.forEach((btn) => btn.destroy());
    this.replayCombatButtons = [];
  }

  private handleFileUpload(): void {
    const file = this.fileInput?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const jsonl = reader.result as string;
        const recording = CombatLogSerializer.fromJSONL(jsonl);
        this.scene.start('ReplayScene', recording);
      } catch (error) {
        this.errorMessage = error instanceof Error ? error.message : 'Invalid JSONL file';
        this.createReplayPanel();
      }
    };
    reader.readAsText(file);
  }

  private selectCombatForReplay(combatId: string): void {
    const storage = new CombatLogStorage(localStorage);
    const recording = storage.loadFromLocalStorage(combatId);
    if (recording) {
      this.scene.start('ReplayScene', recording);
    }
  }

  shutdown(): void {
    if (this.fileInput) {
      this.fileInput.remove();
      this.fileInput = undefined as any;
    }
  }
}
