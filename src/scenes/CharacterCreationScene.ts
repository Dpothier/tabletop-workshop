import Phaser from 'phaser';
import { CharacterStorageService } from '@src/services/CharacterStorageService';

// Attribute allocation constants
export const ATTRIBUTE_COLORS = {
  STR: 0xff0000, // Red
  DEX: 0x00ff00, // Green
  MND: 0x0000ff, // Blue
  SPR: 0xffffff, // White
} as const;

export const BEAD_COLOR_HEX = {
  STR: '#ff0000',
  DEX: '#00ff00',
  MND: '#0000ff',
  SPR: '#ffffff',
} as const;

export class CharacterCreationScene extends Phaser.Scene {
  private characterStorageService!: CharacterStorageService;
  private characterName: string = '';
  private characterCountText!: Phaser.GameObjects.Text;
  private errorText!: Phaser.GameObjects.Text;
  private previewText!: Phaser.GameObjects.Text;
  private previewDomElement!: HTMLDivElement;
  private errorDomElement!: HTMLDivElement;
  private characterNameLabel!: Phaser.GameObjects.Text;
  private continueButtonRect!: Phaser.GameObjects.Rectangle;
  private continueButtonText!: Phaser.GameObjects.Text;
  private cancelButtonRect!: Phaser.GameObjects.Rectangle;
  private cancelButtonText!: Phaser.GameObjects.Text;

  // Step 8.4: Attribute Allocation
  private attributes: { str: number; dex: number; mnd: number; spr: number } = {
    str: 1,
    dex: 1,
    mnd: 1,
    spr: 1,
  };
  private pointsRemaining: number = 8;
  private attributeButtons: Map<string, { plus: Phaser.GameObjects.Rectangle; minus: Phaser.GameObjects.Rectangle }> =
    new Map();
  private attributeValueTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private attributeDomButtons: Map<string, { plus: HTMLButtonElement; minus: HTMLButtonElement }> = new Map();
  private pointsRemainingText!: Phaser.GameObjects.Text;
  private beadPreviewContainer!: Phaser.GameObjects.Container;
  private beadPreviewDomElement!: HTMLDivElement;
  private showAttributeAllocation: boolean = false;
  private continueDomButton!: HTMLButtonElement;

  // Step 8.5: Weapon Selection & Save
  private weapons: Array<{ id: string; name: string; power: number; agility: number; range: number | string }> = [];
  private selectedWeaponId: string | null = null;
  private showWeaponSelection: boolean = false;
  private saveDomButton!: HTMLButtonElement;
  private weaponDomButtons: Map<string, HTMLButtonElement> = new Map();
  private weaponSelectionRectangles: Map<string, Phaser.GameObjects.Rectangle> = new Map();

  constructor() {
    super({ key: 'CharacterCreationScene' });
  }

  create(): void {
    this.characterStorageService = new CharacterStorageService();

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Title
    this.add
      .text(centerX, 60, 'CREATE CHARACTER', {
        fontSize: '48px',
        color: '#e0e0e0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Name Input Label
    this.characterNameLabel = this.add
      .text(centerX, 140, 'Character Name', {
        fontSize: '24px',
        color: '#ffaa00',
      })
      .setOrigin(0.5);

    // Name Input Field using DOM element
    this.add.dom(centerX, 190).createFromHTML(
      `<input type="text" id="character-name" maxlength="20"
              placeholder="Enter character name"
              style="font-size: 20px; padding: 10px; width: 250px;
                     background-color: #3d3d5d; color: #ffffff;
                     border: 2px solid #666666; border-radius: 4px;"/>`
    );

    // Character count display
    this.characterCountText = this.add
      .text(centerX, 230, '0/20', {
        fontSize: '16px',
        color: '#888888',
      })
      .setOrigin(0.5);

    // Token preview (visual Phaser element)
    this.add.circle(centerX - 150, centerY - 80, 40, 0x4488ff);

    this.previewText = this.add
      .text(centerX - 150, centerY - 80, '', {
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Hidden DOM element for E2E testing (token preview)
    this.previewDomElement = document.createElement('div');
    this.previewDomElement.setAttribute('data-testid', 'token-preview');
    this.previewDomElement.style.position = 'absolute';
    this.previewDomElement.style.visibility = 'hidden';
    this.previewDomElement.style.pointerEvents = 'none';
    document.body.appendChild(this.previewDomElement);

    // Error message display (visual Phaser element)
    this.errorText = this.add
      .text(centerX, centerY - 20, '', {
        fontSize: '16px',
        color: '#ff4444',
      })
      .setOrigin(0.5);

    // Hidden DOM element for E2E testing (error message)
    this.errorDomElement = document.createElement('div');
    this.errorDomElement.setAttribute('data-testid', 'error-message');
    this.errorDomElement.style.position = 'absolute';
    this.errorDomElement.style.visibility = 'hidden';
    this.errorDomElement.style.pointerEvents = 'none';
    document.body.appendChild(this.errorDomElement);

    // Handle name input changes - use getElementById for reliable DOM access
    const characterNameInput = document.getElementById('character-name') as HTMLInputElement;
    if (characterNameInput) {
      characterNameInput.addEventListener('input', () => {
        this.characterName = characterNameInput.value.trim();
        const charCount = this.characterName.length;
        this.characterCountText.setText(`${charCount}/20`);

        // Update preview with first letter
        if (charCount > 0) {
          const firstLetter = this.characterName.charAt(0).toUpperCase();
          this.previewText.setText(firstLetter);
          this.previewDomElement.textContent = firstLetter;
        } else {
          this.previewText.setText('');
          this.previewDomElement.textContent = '';
        }

        // Clear error when user starts typing
        if (this.characterName.length > 0) {
          this.errorText.setText('');
          this.errorDomElement.textContent = '';
        }
      });
    }

    // Continue Button
    this.continueButtonRect = this.add
      .rectangle(centerX - 120, centerY + 100, 150, 60, 0x4488ff)
      .setInteractive({ useHandCursor: true });

    this.continueButtonText = this.add
      .text(centerX - 120, centerY + 100, 'Continue', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.continueButtonRect.on('pointerover', () => this.continueButtonRect.setFillStyle(0x5599cc));
    this.continueButtonRect.on('pointerout', () => this.continueButtonRect.setFillStyle(0x4488ff));
    this.continueButtonRect.on('pointerdown', () => this.handleContinue());

    // DOM button for E2E testing
    const continueDomBtn = document.createElement('button');
    continueDomBtn.setAttribute('data-testid', 'continue-button');
    continueDomBtn.style.position = 'fixed';
    continueDomBtn.style.left = '0px';
    continueDomBtn.style.top = '0px';
    continueDomBtn.style.width = '1px';
    continueDomBtn.style.height = '1px';
    continueDomBtn.style.opacity = '0.01';
    continueDomBtn.style.pointerEvents = 'auto';
    continueDomBtn.onclick = () => this.handleContinue();
    document.body.appendChild(continueDomBtn);
    this.continueDomButton = continueDomBtn;

    // Cancel Button
    this.cancelButtonRect = this.add
      .rectangle(centerX + 120, centerY + 100, 150, 60, 0x884444)
      .setInteractive({ useHandCursor: true });

    this.cancelButtonText = this.add
      .text(centerX + 120, centerY + 100, 'Cancel', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.cancelButtonRect.on('pointerover', () => this.cancelButtonRect.setFillStyle(0x995555));
    this.cancelButtonRect.on('pointerout', () => this.cancelButtonRect.setFillStyle(0x884444));
    this.cancelButtonRect.on('pointerdown', () => this.handleCancel());

    // Focus the input
    const nameInput = document.getElementById('character-name') as HTMLInputElement;
    if (nameInput) {
      nameInput.focus();
    }
  }

  public handleContinue(): void {
    if (this.showWeaponSelection) {
      // Already on weapon selection, do nothing (save button handles this)
      return;
    }

    if (this.showAttributeAllocation) {
      // Move from attributes to weapon selection
      this.showWeaponSelectionUI();
      return;
    }

    const nameInput = document.getElementById('character-name') as HTMLInputElement;
    const trimmedName = nameInput?.value?.trim() || '';

    // Validate name is not empty
    if (trimmedName.length === 0) {
      const errorMsg = 'Name is required';
      this.errorText.setText(errorMsg);
      this.errorDomElement.textContent = errorMsg;
      return;
    }

    // Validate name is unique
    if (!this.characterStorageService.isNameUnique(trimmedName)) {
      const errorMsg = 'Name already taken';
      this.errorText.setText(errorMsg);
      this.errorDomElement.textContent = errorMsg;
      return;
    }

    // Move to attribute allocation step
    this.characterName = trimmedName;
    this.showAttributeAllocationUI();
  }

  private handleCancel(): void {
    this.cleanupDomElements();
    this.scene.start('MenuScene');
  }

  private showAttributeAllocationUI(): void {
    this.showAttributeAllocation = true;

    const centerX = this.cameras.main.width / 2;

    // Hide name input section
    const nameInput = document.getElementById('character-name');
    if (nameInput) {
      (nameInput as HTMLElement).style.display = 'none';
    }
    this.characterCountText.setVisible(false);
    this.previewText.setVisible(false);
    this.characterNameLabel.setVisible(false);
    const previewCircle = this.children.list.find(
      (obj) => obj.type === 'Arc' && (obj as any).x === centerX - 150
    );
    if (previewCircle) {
      (previewCircle as Phaser.GameObjects.Arc).setVisible(false);
    }

    // Add section title
    this.add
      .text(centerX, 250, 'Allocate Attributes', {
        fontSize: '32px',
        color: '#ffaa00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Add points remaining counter
    this.pointsRemainingText = this.add
      .text(centerX, 290, `Points Remaining: ${this.pointsRemaining}`, {
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Create attribute rows
    const attributeNames = ['STR', 'DEX', 'MND', 'SPR'];
    const startY = 340;
    const rowHeight = 60;

    attributeNames.forEach((attr, index) => {
      const y = startY + index * rowHeight;
      this.createAttributeRow(attr, y, centerX);
    });

    // Create bead preview
    this.createBeadPreview(centerX);

    // Reposition Continue and Cancel buttons below the bead preview
    const newButtonY = 660;
    this.continueButtonRect.setPosition(centerX - 120, newButtonY);
    this.continueButtonText.setPosition(centerX - 120, newButtonY);
    this.cancelButtonRect.setPosition(centerX + 120, newButtonY);
    this.cancelButtonText.setPosition(centerX + 120, newButtonY);

    // Update button states
    this.updateAttributeButtonStates();
  }

  private createAttributeRow(attribute: string, y: number, centerX: number): void {
    const lowerAttr = attribute.toLowerCase() as 'str' | 'dex' | 'mnd' | 'spr';
    const currentValue = this.attributes[lowerAttr];

    // Attribute label
    this.add
      .text(centerX - 120, y, attribute, {
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Minus button
    const minusButton = this.add
      .rectangle(centerX - 40, y, 40, 40, 0x884444)
      .setInteractive({ useHandCursor: true });
    minusButton.setData('attribute', lowerAttr);
    minusButton.setData('action', 'minus');
    const minusDomBtn = document.createElement('button');
    minusDomBtn.setAttribute('data-attribute', lowerAttr);
    minusDomBtn.setAttribute('data-action', 'decrement');
    minusDomBtn.style.display = 'none';
    document.body.appendChild(minusDomBtn);

    this.add
      .text(centerX - 40, y, '−', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    minusButton.on('pointerover', () => minusButton.setFillStyle(0x995555));
    minusButton.on('pointerout', () => minusButton.setFillStyle(0x884444));
    minusButton.on('pointerdown', () => this.decrementAttribute(lowerAttr));

    // Value display
    const valueText = this.add
      .text(centerX, y, currentValue.toString(), {
        fontSize: '24px',
        color: '#ffff00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.attributeValueTexts.set(lowerAttr, valueText);

    // Plus button
    const plusButton = this.add
      .rectangle(centerX + 40, y, 40, 40, 0x4488ff)
      .setInteractive({ useHandCursor: true });
    plusButton.setData('attribute', lowerAttr);
    plusButton.setData('action', 'plus');
    const plusDomBtn = document.createElement('button');
    plusDomBtn.setAttribute('data-attribute', lowerAttr);
    plusDomBtn.setAttribute('data-action', 'increment');
    plusDomBtn.style.display = 'none';
    document.body.appendChild(plusDomBtn);

    this.add
      .text(centerX + 40, y, '+', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    plusButton.on('pointerover', () => plusButton.setFillStyle(0x5599cc));
    plusButton.on('pointerout', () => plusButton.setFillStyle(0x4488ff));
    plusButton.on('pointerdown', () => this.incrementAttribute(lowerAttr));

    this.attributeButtons.set(lowerAttr, { plus: plusButton, minus: minusButton });
    this.attributeDomButtons.set(lowerAttr, { plus: plusDomBtn, minus: minusDomBtn });

    // Store DOM elements for testing
    (minusDomBtn as any).__button = minusButton;
    (plusDomBtn as any).__button = plusButton;
  }

  public incrementAttribute(attribute: 'str' | 'dex' | 'mnd' | 'spr'): void {
    // Check if can increment (points available and not at max)
    if (this.pointsRemaining === 0 || this.attributes[attribute] >= 6) {
      return;
    }

    this.attributes[attribute]++;
    this.pointsRemaining--;
    this.updateAttributeDisplay();
  }

  public decrementAttribute(attribute: 'str' | 'dex' | 'mnd' | 'spr'): void {
    // Check if can decrement (not at min)
    if (this.attributes[attribute] <= 1) {
      return;
    }

    this.attributes[attribute]--;
    this.pointsRemaining++;
    this.updateAttributeDisplay();
  }

  private updateAttributeDisplay(): void {
    if (!this.showAttributeAllocation) return;

    // Update value texts
    this.attributeValueTexts.forEach((text, attr) => {
      const value = this.attributes[attr as 'str' | 'dex' | 'mnd' | 'spr'];
      text.setText(value.toString());
    });

    // Update points remaining text
    this.pointsRemainingText.setText(`Points Remaining: ${this.pointsRemaining}`);

    // Update button states
    this.updateAttributeButtonStates();

    // Update bead preview
    this.updateBeadPreview();
  }

  private updateAttributeButtonStates(): void {
    const attributes = ['str', 'dex', 'mnd', 'spr'] as const;

    attributes.forEach((attr) => {
      const buttons = this.attributeButtons.get(attr);
      if (!buttons) return;

      const value = this.attributes[attr];

      // Disable minus if at minimum
      const minusDisabled = value <= 1;
      buttons.minus.setFillStyle(minusDisabled ? 0x664444 : 0x884444);
      buttons.minus.disableInteractive();
      if (!minusDisabled) {
        buttons.minus.setInteractive({ useHandCursor: true });
      }

      // Disable plus if at maximum or no points remaining
      const plusDisabled = value >= 6 || this.pointsRemaining === 0;
      buttons.plus.setFillStyle(plusDisabled ? 0x334466 : 0x4488ff);
      buttons.plus.disableInteractive();
      if (!plusDisabled) {
        buttons.plus.setInteractive({ useHandCursor: true });
      }

      // Update DOM buttons using stored references
      const domButtons = this.attributeDomButtons.get(attr);
      if (domButtons) {
        domButtons.minus.disabled = minusDisabled;
        domButtons.plus.disabled = plusDisabled;
      }
    });
  }

  private createBeadPreview(centerX: number): void {
    const y = 600;

    // Title
    this.add
      .text(centerX, y - 40, 'Bead Bag Preview', {
        fontSize: '18px',
        color: '#ffaa00',
      })
      .setOrigin(0.5);

    // Create container for beads
    this.beadPreviewContainer = this.add.container(centerX, y);

    // Hidden DOM element for E2E testing (bead preview)
    this.beadPreviewDomElement = document.createElement('div');
    this.beadPreviewDomElement.setAttribute('data-testid', 'bead-preview');
    this.beadPreviewDomElement.style.position = 'fixed';
    this.beadPreviewDomElement.style.left = '0px';
    this.beadPreviewDomElement.style.top = '0px';
    this.beadPreviewDomElement.style.width = '1px';
    this.beadPreviewDomElement.style.height = '1px';
    this.beadPreviewDomElement.style.opacity = '0.01';
    this.beadPreviewDomElement.style.pointerEvents = 'none';
    document.body.appendChild(this.beadPreviewDomElement);

    // Initial population
    this.updateBeadPreview();
  }

  private updateBeadPreview(): void {
    // Clear existing beads
    this.beadPreviewContainer.removeAll(true);

    const beadRadius = 8;
    const spacing = 20;
    const groupGap = 10;

    const attributes = [
      { key: 'str', color: ATTRIBUTE_COLORS.STR },
      { key: 'dex', color: ATTRIBUTE_COLORS.DEX },
      { key: 'mnd', color: ATTRIBUTE_COLORS.MND },
      { key: 'spr', color: ATTRIBUTE_COLORS.SPR },
    ];

    // Calculate total width first
    let totalWidth = 0;
    attributes.forEach(({ key }, index) => {
      const value = this.attributes[key as 'str' | 'dex' | 'mnd' | 'spr'];
      totalWidth += value * spacing;
      if (index < attributes.length - 1) totalWidth += groupGap;
    });

    // Start from centered position
    let xOffset = -totalWidth / 2;

    attributes.forEach(({ key, color }, index) => {
      const value = this.attributes[key as 'str' | 'dex' | 'mnd' | 'spr'];

      for (let i = 0; i < value; i++) {
        const x = xOffset + i * spacing;
        const circle = this.add.circle(x, 0, beadRadius, color);
        circle.setData('attribute', key);
        this.beadPreviewContainer.add(circle);
      }

      xOffset += value * spacing;
      if (index < attributes.length - 1) xOffset += groupGap;
    });
  }

  private cleanupDomElements(): void {
    if (this.previewDomElement && this.previewDomElement.parentNode) {
      this.previewDomElement.parentNode.removeChild(this.previewDomElement);
    }
    if (this.errorDomElement && this.errorDomElement.parentNode) {
      this.errorDomElement.parentNode.removeChild(this.errorDomElement);
    }
    if (this.beadPreviewDomElement && this.beadPreviewDomElement.parentNode) {
      this.beadPreviewDomElement.parentNode.removeChild(this.beadPreviewDomElement);
    }
    if (this.continueDomButton && this.continueDomButton.parentNode) {
      this.continueDomButton.parentNode.removeChild(this.continueDomButton);
    }
    if (this.saveDomButton && this.saveDomButton.parentNode) {
      this.saveDomButton.parentNode.removeChild(this.saveDomButton);
    }

    // Clean up attribute buttons
    document.querySelectorAll('[data-attribute][data-action]').forEach((btn) => {
      if (btn.parentNode) {
        btn.parentNode.removeChild(btn);
      }
    });

    // Clean up weapon buttons
    this.weaponDomButtons.forEach((btn) => {
      if (btn.parentNode) {
        btn.parentNode.removeChild(btn);
      }
    });
    this.weaponDomButtons.clear();
  }

  public get attributeAllocationState(): {
    attributes: { [key: string]: number };
    pointsRemaining: number;
    isShowing: boolean;
  } | null {
    // Return null if attribute allocation UI is not showing
    if (!this.showAttributeAllocation) {
      return null;
    }
    return {
      attributes: {
        STR: this.attributes.str,
        DEX: this.attributes.dex,
        MND: this.attributes.mnd,
        SPR: this.attributes.spr,
      },
      pointsRemaining: this.pointsRemaining,
      isShowing: true,
    };
  }

  private loadWeapons(): void {
    this.weapons = [
      { id: 'sword', name: 'Sword', power: 1, agility: 1, range: 1 },
      { id: 'axe', name: 'Axe', power: 2, agility: 0, range: 1 },
      { id: 'mace', name: 'Mace', power: 1, agility: 0, range: 1 },
      { id: 'spear', name: 'Spear', power: 1, agility: 1, range: '1-2' },
    ];
  }

  private showWeaponSelectionUI(): void {
    this.showWeaponSelection = true;
    this.loadWeapons();

    const centerX = this.cameras.main.width / 2;

    // Hide attribute allocation UI
    if (this.pointsRemainingText) {
      this.pointsRemainingText.setVisible(false);
    }
    if (this.beadPreviewContainer) {
      this.beadPreviewContainer.setVisible(false);
    }

    // Hide the original Continue/Cancel buttons
    this.continueButtonRect.setVisible(false);
    this.continueButtonText.setVisible(false);
    this.cancelButtonRect.setVisible(false);
    this.cancelButtonText.setVisible(false);

    // Hide attribute title text
    this.children.list.forEach((obj) => {
      if (obj.type === 'Text') {
        const text = obj as Phaser.GameObjects.Text;
        if (text.text === 'Allocate Attributes' || text.text === 'Bead Bag Preview') {
          text.setVisible(false);
        }
      }
    });

    // Hide attribute rows
    this.attributeButtons.forEach((buttons) => {
      buttons.plus.setVisible(false);
      buttons.minus.setVisible(false);
    });
    this.attributeValueTexts.forEach((text) => {
      text.setVisible(false);
    });
    this.children.list.forEach((obj) => {
      if (obj.type === 'Text') {
        const text = obj as Phaser.GameObjects.Text;
        if (
          text.text === 'STR' ||
          text.text === 'DEX' ||
          text.text === 'MND' ||
          text.text === 'SPR' ||
          text.text === '+' ||
          text.text === '−'
        ) {
          text.setVisible(false);
        }
      }
    });

    // Add weapon selection title
    this.add
      .text(centerX, 250, 'Choose Your Weapon', {
        fontSize: '32px',
        color: '#ffaa00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Display weapons
    const startY = 320;
    const rowHeight = 80;

    this.weapons.forEach((weapon, index) => {
      const y = startY + index * rowHeight;
      this.createWeaponRow(weapon, y, centerX);
    });

    // Calculate button position below the last weapon row
    const buttonY = startY + (this.weapons.length - 1) * rowHeight + 100;

    // Create Save button
    const saveButton = this.add
      .rectangle(centerX - 120, buttonY, 150, 60, 0x448844)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(centerX - 120, buttonY, 'Save', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    saveButton.on('pointerover', () => saveButton.setFillStyle(0x559955));
    saveButton.on('pointerout', () => saveButton.setFillStyle(0x448844));
    saveButton.on('pointerdown', () => this.handleSave());

    // DOM button for E2E testing
    const saveDomBtn = document.createElement('button');
    saveDomBtn.setAttribute('data-testid', 'save-button');
    saveDomBtn.style.position = 'fixed';
    saveDomBtn.style.left = '0px';
    saveDomBtn.style.top = '0px';
    saveDomBtn.style.width = '1px';
    saveDomBtn.style.height = '1px';
    saveDomBtn.style.opacity = '0.01';
    saveDomBtn.style.pointerEvents = 'auto';
    saveDomBtn.onclick = () => this.handleSave();
    saveDomBtn.disabled = true;
    document.body.appendChild(saveDomBtn);
    this.saveDomButton = saveDomBtn;

    // Create Cancel button
    const cancelButton = this.add
      .rectangle(centerX + 120, buttonY, 150, 60, 0x884444)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(centerX + 120, buttonY, 'Cancel', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    cancelButton.on('pointerover', () => cancelButton.setFillStyle(0x995555));
    cancelButton.on('pointerout', () => cancelButton.setFillStyle(0x884444));
    cancelButton.on('pointerdown', () => this.handleCancel());
  }

  private createWeaponRow(weapon: { id: string; name: string; power: number; agility: number; range: number | string }, y: number, centerX: number): void {
    const rectWidth = 300;
    const rectHeight = 60;

    // Create weapon selection rectangle
    const weaponRect = this.add
      .rectangle(centerX, y, rectWidth, rectHeight, 0x3d3d5d)
      .setInteractive({ useHandCursor: true });
    weaponRect.setStrokeStyle(2, 0x666666);
    weaponRect.setData('weaponId', weapon.id);

    this.weaponSelectionRectangles.set(weapon.id, weaponRect);

    // Weapon name
    this.add
      .text(centerX - 120, y - 15, weapon.name, {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    // Weapon stats
    const statsText = `Power: ${weapon.power} | Agility: ${weapon.agility} | Range: ${weapon.range}`;
    this.add
      .text(centerX - 120, y + 15, statsText, {
        fontSize: '14px',
        color: '#cccccc',
      })
      .setOrigin(0, 0.5);

    // Handle weapon selection
    weaponRect.on('pointerover', () => {
      if (this.selectedWeaponId !== weapon.id) {
        weaponRect.setFillStyle(0x4d4d6d);
      }
    });
    weaponRect.on('pointerout', () => {
      if (this.selectedWeaponId !== weapon.id) {
        weaponRect.setFillStyle(0x3d3d5d);
      }
    });
    weaponRect.on('pointerdown', () => this.selectWeapon(weapon.id));

    // DOM button for E2E testing
    const weaponDomBtn = document.createElement('button');
    weaponDomBtn.setAttribute('data-weapon', weapon.id);
    weaponDomBtn.style.display = 'none';
    weaponDomBtn.onclick = () => this.selectWeapon(weapon.id);
    document.body.appendChild(weaponDomBtn);
    this.weaponDomButtons.set(weapon.id, weaponDomBtn);
  }

  public selectWeapon(weaponId: string): void {
    this.selectedWeaponId = weaponId;

    // Update visual highlight
    this.weaponSelectionRectangles.forEach((rect, id) => {
      if (id === weaponId) {
        rect.setFillStyle(0x4488ff);
        rect.setStrokeStyle(2, 0x6699ff);
      } else {
        rect.setFillStyle(0x3d3d5d);
        rect.setStrokeStyle(2, 0x666666);
      }
    });

    // Enable save button
    if (this.saveDomButton) {
      this.saveDomButton.disabled = false;
    }
  }

  public handleSave(): void {
    if (!this.selectedWeaponId) {
      return;
    }

    const selectedWeapon = this.weapons.find((w) => w.id === this.selectedWeaponId);
    if (!selectedWeapon) {
      return;
    }

    // Build character data and save
    this.characterStorageService.save({
      name: this.characterName,
      attributes: {
        str: this.attributes.str,
        dex: this.attributes.dex,
        mnd: this.attributes.mnd,
        spr: this.attributes.spr,
      },
      weapon: this.selectedWeaponId,
      isDefault: false,
    });

    // Clean up and navigate back
    this.cleanupDomElements();
    this.scene.start('MenuScene');
  }

  public get weaponSelectionState(): {
    weapons: Array<{ id: string; name: string; power: number; agility: number; range: number | string }>;
    selectedWeaponId: string | null;
    canSave: boolean;
  } | null {
    if (!this.showWeaponSelection) return null;
    return {
      weapons: this.weapons,
      selectedWeaponId: this.selectedWeaponId,
      canSave: this.selectedWeaponId !== null,
    };
  }
}
