import Phaser from 'phaser';
import type { CharacterData } from '@src/types/CharacterData';

interface ManagementCallbacks {
  onEdit: (character: CharacterData) => void;
  onDelete: (characterId: string) => void;
  onExport: () => void;
  onImport: () => void;
  onClose: () => void;
}

interface CharacterManagementState {
  visible: boolean;
  characters: Array<{
    id: string;
    name: string;
    attributes: { str: number; dex: number; mnd: number; spr: number };
    weapon: string;
    isDefault: boolean;
    hasEditButton: boolean;
    hasDeleteButton: boolean;
    deleteDisabled: boolean;
  }>;
  currentPage: number;
  totalPages: number;
  confirmingDeleteId: string | null;
}

export class CharacterManagementPanel {
  private static readonly ITEMS_PER_PAGE = 4;
  private scene: Phaser.Scene;
  private overlay!: Phaser.GameObjects.Rectangle;
  private container!: Phaser.GameObjects.Container;
  private _visible: boolean = false;
  private allCharacters: CharacterData[] = [];
  private partyCharacterIds: string[] = [];
  private callbacks: ManagementCallbacks | null = null;
  private currentPage: number = 0;
  private confirmingDeleteId: string | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializePanel();
  }

  private initializePanel(): void {
    this.overlay = this.scene.add.rectangle(512, 384, 1024, 768, 0x000000, 0.5);
    this.overlay.setInteractive({ useHandCursor: false });
    this.overlay.setDepth(1000);
    this.overlay.setVisible(false);

    this.container = this.scene.add.container(512, 384);
    this.container.setDepth(1001);
    this.container.setVisible(false);

    const panelBg = this.scene.add.rectangle(0, 0, 600, 550, 0x2a2a4a);
    this.container.add(panelBg);

    const title = this.scene.add.text(0, -245, 'Manage Characters', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.container.add(title);

    const closeButton = this.scene.add.text(278, -253, 'X', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    closeButton.setOrigin(0.5);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on('pointerdown', () => this.handleClose());
    this.container.add(closeButton);

    this.overlay.on('pointerdown', () => this.handleClose());
  }

  show(
    allCharacters: CharacterData[],
    partyCharacterIds: string[],
    callbacks: ManagementCallbacks
  ): void {
    this.currentPage = 0;
    this.confirmingDeleteId = null;
    this.allCharacters = allCharacters;
    this.partyCharacterIds = partyCharacterIds;
    this.callbacks = callbacks;

    this.renderCharacterList();

    this._visible = true;
    this.overlay.setVisible(true);
    this.overlay.setInteractive();
    this.container.setVisible(true);
  }

  private renderCharacterList(): void {
    while (this.container.list.length > 3) {
      const child = this.container.list[this.container.list.length - 1];
      this.container.remove(child, true);
    }

    const startIndex = this.currentPage * CharacterManagementPanel.ITEMS_PER_PAGE;
    const endIndex = Math.min(
      startIndex + CharacterManagementPanel.ITEMS_PER_PAGE,
      this.allCharacters.length
    );
    const pageCharacters = this.allCharacters.slice(startIndex, endIndex);

    const startY = -155;
    const rowHeight = 60;

    pageCharacters.forEach((character, index) => {
      const rowY = startY + index * rowHeight;
      const isInParty = this.partyCharacterIds.includes(character.id);
      this.renderCharacterRow(character, rowY, isInParty);
    });

    if (this.getTotalPages() > 1) {
      this.renderPaginationControls();
    }

    this.renderBottomButtons();
  }

  private renderCharacterRow(
    character: CharacterData,
    rowY: number,
    isInParty: boolean
  ): void {
    const rowWidth = 560;
    const rowHeight = 54;

    const bgRect = this.scene.add.rectangle(0, rowY, rowWidth, rowHeight, 0x3a3a5a);
    this.container.add(bgRect);

    if (this.confirmingDeleteId === character.id) {
      // Show confirmation UI
      const confirmText = this.scene.add.text(-100, rowY, `Delete ${character.name}?`, {
        fontSize: '14px',
        color: '#ff6666',
      });
      confirmText.setOrigin(0, 0.5);
      this.container.add(confirmText);

      // Yes button
      const yesRect = this.scene.add.rectangle(170, rowY, 40, 30, 0xaa4444);
      yesRect.setInteractive({ useHandCursor: true });
      yesRect.on('pointerdown', () => this.handleConfirmDelete(character.id));
      this.container.add(yesRect);

      const yesText = this.scene.add.text(170, rowY, 'Yes', {
        fontSize: '12px',
        color: '#ffffff',
      });
      yesText.setOrigin(0.5);
      this.container.add(yesText);

      // No button
      const noRect = this.scene.add.rectangle(220, rowY, 40, 30, 0x4488ff);
      noRect.setInteractive({ useHandCursor: true });
      noRect.on('pointerdown', () => this.handleCancelDelete());
      this.container.add(noRect);

      const noText = this.scene.add.text(220, rowY, 'No', {
        fontSize: '12px',
        color: '#ffffff',
      });
      noText.setOrigin(0.5);
      this.container.add(noText);
      return;
    }

    // Character name with lock prefix for default characters
    const namePrefix = character.isDefault ? '🔒 ' : '';
    const nameText = this.scene.add.text(-265, rowY, `${namePrefix}${character.name}`, {
      fontSize: '16px',
      color: '#ffffff',
    });
    nameText.setOrigin(0, 0.5);
    this.container.add(nameText);

    // Attributes string
    const attrString = `S:${character.attributes.str} D:${character.attributes.dex} M:${character.attributes.mnd} R:${character.attributes.spr}`;
    const attrText = this.scene.add.text(-30, rowY, attrString, {
      fontSize: '12px',
      color: '#aaaaaa',
    });
    attrText.setOrigin(0.5);
    this.container.add(attrText);

    // Weapon name
    const weaponText = this.scene.add.text(100, rowY, character.weapon, {
      fontSize: '12px',
      color: '#ffaa88',
    });
    weaponText.setOrigin(0, 0.5);
    this.container.add(weaponText);

    // Edit and Delete buttons only for custom characters
    if (!character.isDefault) {
      // Edit button
      const editRect = this.scene.add.rectangle(170, rowY, 50, 30, 0x4488ff);
      editRect.setInteractive({ useHandCursor: true });
      editRect.on('pointerdown', () => this.handleEdit(character));
      this.container.add(editRect);

      const editText = this.scene.add.text(170, rowY, 'Edit', {
        fontSize: '12px',
        color: '#ffffff',
      });
      editText.setOrigin(0.5);
      this.container.add(editText);

      // Delete button
      const deleteColor = isInParty ? 0x666666 : 0xaa4444;
      const deleteRect = this.scene.add.rectangle(220, rowY, 50, 30, deleteColor);
      if (!isInParty) {
        deleteRect.setInteractive({ useHandCursor: true });
        deleteRect.on('pointerdown', () => this.handleDeleteRequest(character.id));
      }
      this.container.add(deleteRect);

      const deleteText = this.scene.add.text(220, rowY, 'Del', {
        fontSize: '12px',
        color: isInParty ? '#999999' : '#ffffff',
      });
      deleteText.setOrigin(0.5);
      this.container.add(deleteText);
    }
  }

  private renderPaginationControls(): void {
    const controlsY = 110;
    const totalPages = this.getTotalPages();

    const prevColor = this.currentPage > 0 ? '#ffffff' : '#555555';
    const prevButton = this.scene.add.text(-100, controlsY, '◀ Prev', {
      fontSize: '14px',
      color: prevColor,
    });
    prevButton.setOrigin(0.5);
    if (this.currentPage > 0) {
      prevButton.setInteractive({ useHandCursor: true });
      prevButton.on('pointerdown', () => {
        this.currentPage--;
        this.renderCharacterList();
      });
    }
    this.container.add(prevButton);

    const pageText = this.scene.add.text(0, controlsY, `Page ${this.currentPage + 1}/${totalPages}`, {
      fontSize: '14px',
      color: '#aaaaaa',
    });
    pageText.setOrigin(0.5);
    this.container.add(pageText);

    const nextColor = this.currentPage < totalPages - 1 ? '#ffffff' : '#555555';
    const nextButton = this.scene.add.text(100, controlsY, 'Next ▶', {
      fontSize: '14px',
      color: nextColor,
    });
    nextButton.setOrigin(0.5);
    if (this.currentPage < totalPages - 1) {
      nextButton.setInteractive({ useHandCursor: true });
      nextButton.on('pointerdown', () => {
        this.currentPage++;
        this.renderCharacterList();
      });
    }
    this.container.add(nextButton);
  }

  private renderBottomButtons(): void {
    // Export All button
    const exportRect = this.scene.add.rectangle(-180, 210, 100, 36, 0x448844);
    exportRect.setInteractive({ useHandCursor: true });
    exportRect.on('pointerdown', () => this.handleExport());
    this.container.add(exportRect);

    const exportText = this.scene.add.text(-180, 210, 'Export All', {
      fontSize: '12px',
      color: '#ffffff',
    });
    exportText.setOrigin(0.5);
    this.container.add(exportText);

    // Import button
    const importRect = this.scene.add.rectangle(180, 210, 100, 36, 0x4488ff);
    importRect.setInteractive({ useHandCursor: true });
    importRect.on('pointerdown', () => this.handleImport());
    this.container.add(importRect);

    const importText = this.scene.add.text(180, 210, 'Import', {
      fontSize: '12px',
      color: '#ffffff',
    });
    importText.setOrigin(0.5);
    this.container.add(importText);

    // Close button
    const closeRect = this.scene.add.rectangle(0, 240, 80, 36, 0x666666);
    closeRect.setInteractive({ useHandCursor: true });
    closeRect.on('pointerdown', () => this.handleClose());
    this.container.add(closeRect);

    const closeText = this.scene.add.text(0, 240, 'Close', {
      fontSize: '12px',
      color: '#ffffff',
    });
    closeText.setOrigin(0.5);
    this.container.add(closeText);
  }

  private handleEdit(character: CharacterData): void {
    if (this.callbacks) {
      this.callbacks.onEdit(character);
      this.hide();
    }
  }

  private handleDeleteRequest(characterId: string): void {
    this.confirmingDeleteId = characterId;
    this.renderCharacterList();
  }

  private handleConfirmDelete(characterId: string): void {
    if (this.callbacks) {
      this.callbacks.onDelete(characterId);
    }
    // Remove from local list
    this.allCharacters = this.allCharacters.filter((c) => c.id !== characterId);
    this.confirmingDeleteId = null;
    // Adjust page if needed
    if (this.currentPage > 0 && this.currentPage >= this.getTotalPages()) {
      this.currentPage--;
    }
    this.renderCharacterList();
  }

  private handleCancelDelete(): void {
    this.confirmingDeleteId = null;
    this.renderCharacterList();
  }

  private handleExport(): void {
    if (this.callbacks) {
      this.callbacks.onExport();
    }
  }

  private handleImport(): void {
    if (this.callbacks) {
      this.callbacks.onImport();
    }
  }

  private handleClose(): void {
    if (this.callbacks) {
      this.callbacks.onClose();
    }
    this.hide();
  }

  hide(): void {
    this._visible = false;
    this.overlay.setVisible(false);
    this.overlay.disableInteractive();
    this.container.setVisible(false);
    this.allCharacters = [];
    this.confirmingDeleteId = null;
  }

  getState(): CharacterManagementState | null {
    if (!this._visible) return null;

    return {
      visible: true,
      characters: this.allCharacters.map((c) => {
        const isInParty = this.partyCharacterIds.includes(c.id);
        return {
          id: c.id,
          name: c.name,
          attributes: { ...c.attributes },
          weapon: c.weapon,
          isDefault: c.isDefault,
          hasEditButton: !c.isDefault,
          hasDeleteButton: !c.isDefault,
          deleteDisabled: isInParty,
        };
      }),
      currentPage: this.currentPage,
      totalPages: this.getTotalPages(),
      confirmingDeleteId: this.confirmingDeleteId,
    };
  }

  private getTotalPages(): number {
    return Math.max(1, Math.ceil(this.allCharacters.length / CharacterManagementPanel.ITEMS_PER_PAGE));
  }

  destroy(): void {
    this.overlay.destroy();
    this.container.destroy(true);
    this.allCharacters = [];
  }
}
