import Phaser from 'phaser';

export default class InteractionArea {
    private ellipse: Phaser.Geom.Ellipse;
    private graphics: Phaser.GameObjects.Graphics;
    private isVisible: boolean;
    private areaLineColor: number;
    private areaFillColor: number;
    private scene: Phaser.Scene;
    private isPlayerInside: boolean = false;
    private overlayName: string;
    private displayName: string;
    private floatingText: Phaser.GameObjects.Text | null = null;

    private interactionButton!: Phaser.GameObjects.Container;
    private buttonBg!: Phaser.GameObjects.Graphics;
    private buttonText!: Phaser.GameObjects.Text;
    private normalColor: number;
    private hoverColor: number;
    private buttonX: number;
    private buttonY: number;
    private buttonHeight: number;
    private buttonWidth: number;

    constructor(
        scene: Phaser.Scene,
        x: number, y: number,
        width: number, height: number,
        displayName: string,
        overlayName: string,
        lineColor: number,
        fillColor: number,
        buttonInfo: {text: string, font: string, fontColor: string, color: number, hoverColor: number},
        floatingTextInfo?: {text: string, offset: {x: number, y: number}, font: string, fontSize: string, color: string}
    ) {
        this.scene = scene;
        this.ellipse = new Phaser.Geom.Ellipse(x, y, width, height);
        this.graphics = scene.add.graphics();
        this.isVisible = true;
        this.overlayName = overlayName;
        this.displayName = displayName;
        this.areaLineColor = lineColor;
        this.areaFillColor = fillColor;
        this.draw();

        if (floatingTextInfo) {
            this.addFloatingText(floatingTextInfo);
        }

        // Init the button used to open the overlay
        this.normalColor = buttonInfo.color;
        this.hoverColor = buttonInfo.hoverColor;
        this.buttonX = 0;
        this.buttonY = 0;
        if (this.scene.sys.game.device.os.desktop) {
            this.buttonWidth = 300;
            this.buttonHeight = 90;
        } else {
            this.buttonWidth = 0.7 * this.scene.cameras.main.width;
            this.buttonHeight = 0.1 * this.scene.cameras.main.height;
        }

        this.initInteractionButton(buttonInfo.text, buttonInfo.font);
    }

    private initInteractionButton(text: string, font: string) {
        // Create container that will act as the bounds for the interaction prompt button
        this.interactionButton = this.scene.add.container(
            this.buttonX, this.buttonY
        );
        this.interactionButton.setScrollFactor(0);
        this.interactionButton.setDepth(1000);

        this.buttonBg = this.scene.add.graphics();
        this.drawButtonBackground(this.normalColor);

        // Add button text
        this.buttonText = this.scene.add.text(this.buttonX, this.buttonY, text, {
            font: '20px',
            color: '#ffffff'
        });
        this.buttonText.setOrigin(0.5);
        this.buttonText.setFontFamily(font);

        this.interactionButton.add([this.buttonBg, this.buttonText]);
        this.interactionButton.setVisible(false);

        // Add hover effect
        this.interactionButton.setInteractive(
            new Phaser.Geom.Rectangle(
                this.buttonX - (this.buttonWidth / 2), this.buttonY - (this.buttonHeight / 2), 
                this.buttonWidth, this.buttonHeight, 
            ), 
            Phaser.Geom.Rectangle.Contains
        );
        this.interactionButton.on('pointerover', this.onButtonHover, this);
        this.interactionButton.on('pointerout', this.onButtonOut, this);
        this.interactionButton.on('pointerdown', this.handleClick, this);
    }

    private drawButtonBackground(color: number) {
        this.buttonBg.clear();
        this.buttonBg.fillStyle(color, 1);
        this.buttonBg.fillRoundedRect(
            this.buttonX - (this.buttonWidth / 2), this.buttonY - (this.buttonHeight / 2), 
            this.buttonWidth, this.buttonHeight, 
            20
        );
        this.buttonBg.lineStyle(4, 0xffffff, 1);
        this.buttonBg.strokeRoundedRect(
            this.buttonX - (this.buttonWidth / 2), this.buttonY - (this.buttonHeight / 2), 
            this.buttonWidth, this.buttonHeight, 
            20
        );
    }

    private onButtonHover() {
        this.drawButtonBackground(this.hoverColor);
    }

    private onButtonOut() {
        this.drawButtonBackground(this.normalColor);
    }

    private handleClick = (pointer: Phaser.Input.Pointer): void => {
        if (this.isPlayerInside && this.interactionButton.visible) {
            const buttonBounds = this.interactionButton.getBounds();

            // Calculate the click position relative to the button in screen space
            const relativeClickX = (pointer.x - buttonBounds.x);
            const relativeClickY = (pointer.y - buttonBounds.y + 300);

            // Check if the click position is within the button's dimensions
            if (relativeClickX >= 0 && relativeClickX <= buttonBounds.width &&
                relativeClickY >= 0 && relativeClickY <= buttonBounds.height) {
                this.handleInteraction();
            }
        }
    }

    private addFloatingText(info: {text: string, offset: {x: number, y: number}, font: string, fontSize: string, color: string}) {
        this.floatingText = this.scene.add.text(this.ellipse.x + info.offset.x, this.ellipse.y + info.offset.y, info.text, {
            font: info.fontSize,
            fontFamily: info.font,
            color: info.color
        });
        this.floatingText.setOrigin(0.5);
        this.floatingText.setDepth(100); 

        // Pulsing animation
        this.scene.tweens.add({
            targets: this.floatingText,
            scale: { from: 1, to: 1.2 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private draw() {
        this.graphics.clear();
        if (!this.isVisible) return;
        this.graphics.lineStyle(10, this.areaLineColor, 1);
        this.graphics.fillStyle(this.areaFillColor, 0.4);
        this.graphics.strokeEllipseShape(this.ellipse);
        this.graphics.fillEllipseShape(this.ellipse);
    }

    checkPlayerInArea(x: number, y: number): void {
        const wasInside = this.isPlayerInside;
        this.isPlayerInside = this.containsPoint(x, y);
        if (this.isPlayerInside !== wasInside) {
            this.interactionButton.setVisible(this.isPlayerInside);
            this.updateButtonPosition();
        }
    }

    private updateButtonPosition = (): void => {
        const camera = this.scene.cameras.main;
        this.interactionButton.setPosition(camera.width / 2, camera.height - 50);
        this.interactionButton.setScale(1 / camera.zoom);
    }

    handleInteraction(): void {
        if (this.isPlayerInside) {
            console.info(`Player inside area '${this.displayName}'`);
            (this.scene as any).showOverlay(this.overlayName);
        }
    }

    containsPoint(x: number, y: number, threshold: number = 1): boolean {
        const translatedX = x - this.ellipse.x;
        const translatedY = y - this.ellipse.y;
        const rotatedX = -translatedX;
        const rotatedY = -translatedY;
        return (rotatedX * rotatedX) / (this.ellipse.width * this.ellipse.width / 4) +
            (rotatedY * rotatedY) / (this.ellipse.height * this.ellipse.height / 4) <= threshold;
    }

    setVisible(visible: boolean) {
        this.isVisible = visible;
        this.draw();
        if (this.floatingText) {
            this.floatingText.setVisible(visible);
        }
    }

    destroy() {
        this.graphics.destroy();
        this.interactionButton.off('pointerover', this.onButtonHover, this);
        this.interactionButton.off('pointerout', this.onButtonOut, this);
        this.interactionButton.destroy();
        if (this.floatingText) {
            this.floatingText.destroy();
        }
        this.scene.input.off('pointerdown', this.handleClick, this);
    }

    getCenter(): { x: number, y: number } {
        return { x: this.ellipse.x, y: this.ellipse.y };
    }

    getName(): string {
        return this.displayName;
    }

    getLineColor(): number {
        return this.areaLineColor;
    }
}