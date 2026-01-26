import Phaser from 'phaser';
import { CharacterStorageService } from '@src/services/CharacterStorageService';

export class CharacterCreationScene extends Phaser.Scene {
  private characterStorageService!: CharacterStorageService;
  private characterName: string = '';
  private nameInput!: HTMLInputElement;
  private characterCountText!: Phaser.GameObjects.Text;
  private errorText!: Phaser.GameObjects.Text;
  private previewText!: Phaser.GameObjects.Text;
  private previewDomElement!: HTMLDivElement;
  private errorDomElement!: HTMLDivElement;

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
    this.add
      .text(centerX, 140, 'Character Name', {
        fontSize: '24px',
        color: '#ffaa00',
      })
      .setOrigin(0.5);

    // Name Input Field using DOM element
    const inputElement = this.add.dom(centerX, 190).createFromHTML(
      `<input type="text" id="character-name" maxlength="20"
              placeholder="Enter character name"
              style="font-size: 20px; padding: 10px; width: 250px;
                     background-color: #3d3d5d; color: #ffffff;
                     border: 2px solid #666666; border-radius: 4px;"/>`
    );

    this.nameInput = inputElement.node as HTMLInputElement;

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

    // Handle name input changes
    this.nameInput.addEventListener('input', () => {
      this.characterName = this.nameInput.value.trim();
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

    // Continue Button
    const continueButton = this.add
      .rectangle(centerX - 120, centerY + 100, 150, 60, 0x4488ff)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(centerX - 120, centerY + 100, 'Continue', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    continueButton.on('pointerover', () => continueButton.setFillStyle(0x5599cc));
    continueButton.on('pointerout', () => continueButton.setFillStyle(0x4488ff));
    continueButton.on('pointerdown', () => this.handleContinue());

    // Cancel Button
    const cancelButton = this.add
      .rectangle(centerX + 120, centerY + 100, 150, 60, 0x884444)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(centerX + 120, centerY + 100, 'Cancel', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    cancelButton.on('pointerover', () => cancelButton.setFillStyle(0x995555));
    cancelButton.on('pointerout', () => cancelButton.setFillStyle(0x884444));
    cancelButton.on('pointerdown', () => this.handleCancel());

    // Focus the input
    this.nameInput.focus();
  }

  private handleContinue(): void {
    const trimmedName = this.nameInput.value.trim();

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

    // For now, just log - will be expanded in 8.4
    console.log(`Creating character: ${trimmedName}`);
    this.cleanupDomElements();
    this.scene.start('MenuScene');
  }

  private handleCancel(): void {
    this.cleanupDomElements();
    this.scene.start('MenuScene');
  }

  private cleanupDomElements(): void {
    if (this.previewDomElement && this.previewDomElement.parentNode) {
      this.previewDomElement.parentNode.removeChild(this.previewDomElement);
    }
    if (this.errorDomElement && this.errorDomElement.parentNode) {
      this.errorDomElement.parentNode.removeChild(this.errorDomElement);
    }
  }
}
