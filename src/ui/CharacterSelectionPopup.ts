import Phaser from 'phaser';
import type { CharacterData } from '@src/types/CharacterData';

interface PopupCallbacks {
  onSelect: (character: CharacterData) => void;
  onRemove: () => void;
  onCreateNew: () => void;
  onClose: () => void;
}

interface CharacterPopupEntry {
  character: CharacterData;
  available: boolean;
}

interface CharacterPopupState {
  visible: boolean;
  slotIndex: number;
  characters: Array<{
    id: string;
    name: string;
    attributes: { str: number; dex: number; mnd: number; spr: number };
    weapon: string;
    isDefault: boolean;
    available: boolean;
  }>;
  hasRemoveButton: boolean;
  currentPage: number;
  totalPages: number;
  visibleCount: number;
}

export class CharacterSelectionPopup {
  private static readonly ITEMS_PER_PAGE = 4;
  private scene: Phaser.Scene;
  private overlay!: Phaser.GameObjects.Rectangle;
  private container!: Phaser.GameObjects.Container;
  private _visible: boolean = false;
  private slotIndex: number = -1;
  private entries: CharacterPopupEntry[] = [];
  private hasRemoveButton: boolean = false;
  private callbacks: PopupCallbacks | null = null;
  private currentPage: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializePopup();
  }

  private initializePopup(): void {
    // Create overlay (semi-transparent black background covering entire canvas)
    this.overlay = this.scene.add.rectangle(512, 384, 1024, 768, 0x000000, 0.5);
    this.overlay.setInteractive({ useHandCursor: false });
    this.overlay.setDepth(1000);
    this.overlay.setVisible(false);

    // Create main popup container
    this.container = this.scene.add.container(512, 384);
    this.container.setDepth(1001);
    this.container.setVisible(false);

    // Popup panel background
    const panelBg = this.scene.add.rectangle(0, 0, 500, 450, 0x2a2a4a);
    this.container.add(panelBg);

    // Title
    const title = this.scene.add.text(0, -185, 'Select Character', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // Close button (X)
    const closeButton = this.scene.add.text(228, -204, 'X', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    closeButton.setOrigin(0.5);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on('pointerdown', () => this.handleClose());
    this.container.add(closeButton);

    // Overlay click handler
    this.overlay.on('pointerdown', () => this.handleClose());
  }

  show(
    slotIndex: number,
    allCharacters: CharacterData[],
    selectedCharacterIds: (string | null)[],
    callbacks: PopupCallbacks
  ): void {
    this.currentPage = 0;
    this.slotIndex = slotIndex;
    this.callbacks = callbacks;
    this.hasRemoveButton = selectedCharacterIds[slotIndex] !== null;

    // Determine which characters are available
    this.entries = allCharacters.map((character) => {
      const available = !selectedCharacterIds.some(
        (id, idx) => id === character.id && idx !== slotIndex
      );
      return { character, available };
    });

    // Render character list
    this.renderCharacterList();

    // Show popup
    this._visible = true;
    this.overlay.setVisible(true);
    this.overlay.setInteractive();
    this.container.setVisible(true);
  }

  private renderCharacterList(): void {
    // Remove existing rows from container (keep panel bg, title, close button)
    while (this.container.list.length > 3) {
      const child = this.container.list[this.container.list.length - 1];
      this.container.remove(child, true);
    }

    // Calculate page slice
    const startIndex = this.currentPage * CharacterSelectionPopup.ITEMS_PER_PAGE;
    const endIndex = Math.min(
      startIndex + CharacterSelectionPopup.ITEMS_PER_PAGE,
      this.entries.length
    );
    const pageEntries = this.entries.slice(startIndex, endIndex);

    // Render character rows for current page
    const startY = -134;
    const rowHeight = 50;

    pageEntries.forEach((entry, index) => {
      const rowY = startY + index * rowHeight;
      this.renderCharacterRow(entry, rowY);
    });

    // Render pagination controls (between rows and action buttons)
    if (this.getTotalPages() > 1) {
      this.renderPaginationControls();
    }

    // Render action buttons
    this.renderActionButtons();
  }

  private renderCharacterRow(entry: CharacterPopupEntry, rowY: number): void {
    const rowWidth = 460;
    const rowHeight = 44;

    // Row background
    const bgColor = entry.available ? 0x3a3a5a : 0x2a2a4a;
    const bgRect = this.scene.add.rectangle(0, rowY, rowWidth, rowHeight, bgColor);

    if (entry.available) {
      bgRect.setInteractive({ useHandCursor: true });
      bgRect.on('pointerover', () => bgRect.setFillStyle(0x4a4a7a));
      bgRect.on('pointerout', () => bgRect.setFillStyle(bgColor));
      bgRect.on('pointerdown', () => this.handleSelectCharacter(entry.character));
    }

    this.container.add(bgRect);

    // Character name with lock prefix for default characters
    const namePrefix = entry.character.isDefault ? '🔒 ' : '';
    const nameText = this.scene.add.text(-215, rowY, `${namePrefix}${entry.character.name}`, {
      fontSize: '16px',
      color: entry.available ? '#ffffff' : '#666666',
    });
    nameText.setOrigin(0, 0.5);
    this.container.add(nameText);

    // Attributes string: S:X D:X M:X R:X
    const attrString = `S:${entry.character.attributes.str} D:${entry.character.attributes.dex} M:${entry.character.attributes.mnd} R:${entry.character.attributes.spr}`;
    const attrText = this.scene.add.text(0, rowY, attrString, {
      fontSize: '12px',
      color: entry.available ? '#aaaaaa' : '#555555',
    });
    attrText.setOrigin(0.5);
    this.container.add(attrText);

    // Weapon name
    const weaponText = this.scene.add.text(210, rowY, entry.character.weapon, {
      fontSize: '12px',
      color: entry.available ? '#ffaa88' : '#666666',
    });
    weaponText.setOrigin(1, 0.5);
    this.container.add(weaponText);

    // Apply dimming to unavailable characters
    if (!entry.available) {
      bgRect.setAlpha(0.4);
      nameText.setAlpha(0.4);
      attrText.setAlpha(0.4);
      weaponText.setAlpha(0.4);
    }
  }

  private renderPaginationControls(): void {
    const controlsY = 90;
    const totalPages = this.getTotalPages();

    // Previous button
    const prevColor = this.currentPage > 0 ? 0xffffff : 0x555555;
    const prevButton = this.scene.add.text(-100, controlsY, '◀ Prev', {
      fontSize: '14px',
      color: prevColor === 0xffffff ? '#ffffff' : '#555555',
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

    // Page indicator text
    const pageText = this.scene.add.text(
      0,
      controlsY,
      `Page ${this.currentPage + 1}/${totalPages}`,
      {
        fontSize: '14px',
        color: '#aaaaaa',
      }
    );
    pageText.setOrigin(0.5);
    this.container.add(pageText);

    // Next button
    const nextColor = this.currentPage < totalPages - 1 ? 0xffffff : 0x555555;
    const nextButton = this.scene.add.text(100, controlsY, 'Next ▶', {
      fontSize: '14px',
      color: nextColor === 0xffffff ? '#ffffff' : '#555555',
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

  private renderActionButtons(): void {
    const buttonY = 146;

    // Remove button (if applicable)
    if (this.hasRemoveButton) {
      const removeButton = this.scene.add.rectangle(-92, buttonY, 120, 36, 0xaa4444);
      removeButton.setInteractive({ useHandCursor: true });
      removeButton.on('pointerover', () => removeButton.setFillStyle(0xbb5555));
      removeButton.on('pointerout', () => removeButton.setFillStyle(0xaa4444));
      removeButton.on('pointerdown', () => this.handleRemove());
      this.container.add(removeButton);

      const removeText = this.scene.add.text(-92, buttonY, 'Remove', {
        fontSize: '14px',
        color: '#ffffff',
      });
      removeText.setOrigin(0.5);
      this.container.add(removeText);
    }

    // Create New button
    const createButton = this.scene.add.rectangle(88, buttonY, 120, 36, 0x4488ff);
    createButton.setInteractive({ useHandCursor: true });
    createButton.on('pointerover', () => createButton.setFillStyle(0x5599cc));
    createButton.on('pointerout', () => createButton.setFillStyle(0x4488ff));
    createButton.on('pointerdown', () => this.handleCreateNew());
    this.container.add(createButton);

    const createText = this.scene.add.text(88, buttonY, 'Create New', {
      fontSize: '14px',
      color: '#ffffff',
    });
    createText.setOrigin(0.5);
    this.container.add(createText);
  }

  private handleSelectCharacter(character: CharacterData): void {
    if (this.callbacks) {
      this.callbacks.onSelect(character);
      this.hide();
    }
  }

  private handleRemove(): void {
    if (this.callbacks) {
      this.callbacks.onRemove();
      this.hide();
    }
  }

  private handleCreateNew(): void {
    if (this.callbacks) {
      this.callbacks.onCreateNew();
      this.hide();
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
    this.entries = [];
  }

  getState(): CharacterPopupState | null {
    if (!this._visible) return null;

    return {
      visible: true,
      slotIndex: this.slotIndex,
      characters: this.entries.map((e) => ({
        id: e.character.id,
        name: e.character.name,
        attributes: { ...e.character.attributes },
        weapon: e.character.weapon,
        isDefault: e.character.isDefault,
        available: e.available,
      })),
      hasRemoveButton: this.hasRemoveButton,
      currentPage: this.currentPage,
      totalPages: this.getTotalPages(),
      visibleCount: this.getVisibleCount(),
    };
  }

  private getTotalPages(): number {
    return Math.ceil(this.entries.length / CharacterSelectionPopup.ITEMS_PER_PAGE);
  }

  private getVisibleCount(): number {
    const startIndex = this.currentPage * CharacterSelectionPopup.ITEMS_PER_PAGE;
    return Math.min(CharacterSelectionPopup.ITEMS_PER_PAGE, this.entries.length - startIndex);
  }

  destroy(): void {
    this.overlay.destroy();
    this.container.destroy(true);
    this.entries = [];
  }
}
