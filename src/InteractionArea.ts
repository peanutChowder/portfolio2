import Phaser from 'phaser';
import { InteractionAreaData, MarkerInfoConfig } from './InteractionAreaData';
import fishingRod from '../assets/fishing/rod.jpg'


export default class InteractionArea {
    // The ellipse representing the clickable region
    private ellipse: Phaser.Geom.Ellipse;
    private graphics: Phaser.GameObjects.Graphics;
    private isVisible: boolean;

    public id!: string;

    // Scene & overlay references
    private scene: Phaser.Scene;
    private overlayName: string;        // eg: "experienceOverlay-Teck"
    private displayName: string;        // eg: "Teck"

    // Player proximity tracking
    private isPlayerInside: boolean = false;

    // A floating text object (e.g. "Software Engineer Intern\n @ Apple")
    private floatingText: Phaser.GameObjects.Text | null = null;

    // The ring/marker info used by MapSystem
    public markerInfo?: { color: number; radius: number; locationType: string };

    // The "areaType" (e.g. "fishing") & minigame name (e.g. "fishPunch")
    private gameElementType: string;
    private minigameId: string = "";

    // Button properties for InteractionArea Overlay
    private interactionButton!: Phaser.GameObjects.Container;
    private buttonBg!: Phaser.GameObjects.Graphics;
    private buttonText!: Phaser.GameObjects.Text;
    private ignoreButtonClick: boolean = false;
    private normalColor: number;
    private hoverColor: number;
    private buttonX: number = 0;
    private buttonY: number = 0;
    private buttonWidth: number;
    private buttonHeight: number;

    // Game Element button properties
    private gameElementButton?: Phaser.GameObjects.Container;
    private geButtonX: number = 0;
    private geButtonY: number = 0;
    private geButtonWidth: number;
    private geButtonHeight: number;

    // If there's a custom action (e.g. fireworks) instead of the normal overlay
    private buttonClickHandler?: (scene: Phaser.Scene) => void;

    // Data object containing things like "displayName", "overlayKey", "position", etc.
    private areaData: InteractionAreaData;

    // Glowing effect for InteractionAreas with Game elements assigned
    private glowGraphics!: Phaser.GameObjects.Graphics | undefined;
    private glowTween?: Phaser.Tweens.Tween;
    private minigameIdGlowColors: { [key: string]: number } = {
        "fishPunch": 0xe8feff
    };

    static preload(scene: Phaser.Scene): void {
        scene.load.image('fishingRod', fishingRod);
    }

    constructor(scene: Phaser.Scene, areaData: InteractionAreaData) {
        this.scene = scene;
        this.isVisible = true;
        this.areaData = areaData;

        this.id = areaData.id;

        // Convert new data fields to old fields
        this.displayName = areaData.displayName;
        this.overlayName = areaData.overlayKey;

        // Convert elliptical geometry
        this.ellipse = new Phaser.Geom.Ellipse(
            areaData.positionX,
            areaData.positionY,
            areaData.width,
            areaData.height
        );

        // We used lineColor/fillColor in the old code – 
        // let's reuse areaBaseColor for both (with alpha) 
        const lineColor = areaData.areaBaseColor;
        const fillColor = areaData.areaBaseColor;

        // Initialize the graphics object for drawing the ellipse
        this.graphics = this.scene.add.graphics();

        // If there's marker info, convert baseColor->color to match old usage
        // so MapSystem can do markerInfo.color, markerInfo.radius, etc.
        if (areaData.markerInfo) {
            this.markerInfo = {
                color: areaData.markerInfo.baseColor,
                radius: areaData.markerInfo.radius,
                locationType: areaData.markerInfo.locationType
            };
        }

        // If there's floating text info, create it
        if (areaData.floatingText) {
            this.addFloatingText(areaData.floatingText);
        }

        // If there's a custom interaction (e.g. fireworks), store it
        this.buttonClickHandler = areaData.customInteraction;

        // Minigame data
        // E.g. "fishing" -> areaType, "fishPunch" -> gameOverlayName
        this.gameElementType = areaData.gameElementType || '';

        // Draw the ellipse
        this.drawEllipse(lineColor, fillColor);

        // Setup the button text & colors (fallback if no button info was given)
        const fallbackText = areaData.displayName || 'No Title';
        const fallbackFont = 'Arial';
        const fallbackFontColor = '#ffffff';
        const fallbackBaseColor = areaData.areaBaseColor;
        const fallbackHoverColor = areaData.areaHoverColor;

        const buttonData = areaData.buttonConfig || {
            text: fallbackText,
            font: fallbackFont,
            fontColor: fallbackFontColor,
            baseColor: fallbackBaseColor,
            hoverColor: fallbackHoverColor
        };

        // Normal & hover color for the button
        this.normalColor = buttonData.baseColor;
        this.hoverColor = buttonData.hoverColor;

        // Decide the button dimensions based on device
        if (this.scene.sys.game.device.os.desktop) {
            this.buttonWidth = 300;
            this.buttonHeight = 90;
            this.geButtonHeight = 90;
            this.geButtonWidth = 90;
        } else {
            this.buttonWidth = 0.7 * this.scene.cameras.main.width;
            this.buttonHeight = 0.1 * this.scene.cameras.main.height;
            this.geButtonHeight = 0.1 * this.scene.cameras.main.height;
            this.geButtonWidth = 0.1 * this.scene.cameras.main.height;
        }

        // Initialize interaction and game element buttons
        this.initInteractionButton(buttonData.text, buttonData.font);

        // Finally, hide the button until the player steps inside
        this.interactionButton.setVisible(false);
    }


    /**
     * Draw the ellipse for the area.
     */
    private drawEllipse(lineColor: number, fillColor: number) {
        this.graphics.clear();
        if (!this.isVisible) return;

        this.graphics.lineStyle(10, lineColor, 1);
        this.graphics.fillStyle(fillColor, 0.4);
        this.graphics.strokeEllipseShape(this.ellipse);
        this.graphics.fillEllipseShape(this.ellipse);
    }

    /**
     * Create a clickable button for this interaction area (e.g. "Click for my time at Apple").
     */
    private initInteractionButton(text: string, font: string) {
        this.interactionButton = this.scene.add.container(this.buttonX, this.buttonY);
        this.interactionButton.setScrollFactor(0);
        this.interactionButton.setDepth(50);

        this.buttonBg = this.scene.add.graphics();
        this.drawButtonBackground(this.normalColor);

        this.buttonText = this.scene.add.text(this.buttonX, this.buttonY, text, {
            font: '20px',
            color: '#ffffff'
        });
        this.buttonText.setOrigin(0.5);
        this.buttonText.setFontFamily(font);

        this.interactionButton.add([this.buttonBg, this.buttonText]);

        // Interactivity
        this.interactionButton.setInteractive(
            new Phaser.Geom.Rectangle(
                this.buttonX - (this.buttonWidth / 2),
                this.buttonY - (this.buttonHeight / 2),
                this.buttonWidth,
                this.buttonHeight
            ),
            Phaser.Geom.Rectangle.Contains,
        );
        this.interactionButton.on('pointerover', this.onButtonHover, this);
        this.interactionButton.on('pointerout', this.onButtonOut, this);
        this.interactionButton.on('pointerdown', this.handleClick, this);
    }

    /**
     * If this area is assigned a minigame (treasure, fishing, etc.), 
     * create a second container for that game element button.
     */
    private initGameElementButton(): void {
        if (!this.minigameId) return;
    
        // Create container centered at origin (we'll position it later)
        this.gameElementButton = this.scene.add.container(0, 0);
        this.gameElementButton.setScrollFactor(0);
        this.gameElementButton.setDepth(50);
        this.gameElementButton.setVisible(false);
    
        const bg = this.scene.add.graphics();
    
        const drawBg = (borderColor: number) => {
            bg.clear();
    
            // Base fill (centered at 0,0)
            bg.fillStyle(0xffffff, 1);
            bg.fillRoundedRect(
                -this.geButtonWidth / 2,
                -this.geButtonHeight / 2,
                this.geButtonWidth,
                this.geButtonHeight,
                20
            );
    
            // Thin inner border (accent color)
            bg.lineStyle(10, borderColor, 1);
            bg.strokeRoundedRect(
                -this.geButtonWidth / 2 + 2,
                -this.geButtonHeight / 2 + 2,
                this.geButtonWidth - 4,
                this.geButtonHeight - 4,
                18
            );
        };
    
        drawBg(this.normalColor);
    
        const icon = this.scene.add.image(0, 0, 'fishingRod');
        icon.setDisplaySize(48, 48);
        icon.setOrigin(0.5);
    
        this.gameElementButton.add([bg, icon]);
    
        // Set the hit area relative to container center (0,0)
        this.gameElementButton.setSize(this.geButtonWidth, this.geButtonHeight);
        this.gameElementButton.setInteractive(
            new Phaser.Geom.Rectangle(
                0,
                0,
                this.geButtonWidth,
                this.geButtonHeight
            ),
            Phaser.Geom.Rectangle.Contains
        );
    
        this.gameElementButton.on('pointerover', () => drawBg(this.hoverColor), this);
        this.gameElementButton.on('pointerout', () => drawBg(this.normalColor), this);
    
        this.gameElementButton.on('pointerdown', () => {
            if ((this.scene as any).showGameOverlay) {
                (this.scene as any).showGameOverlay(this.minigameId);
            } else {
                console.warn(`No showGameOverlay method found on scene for minigameId=${this.minigameId}`);
            }
        });
    }
    


    /**
     * Draw/Redraw the button background on hover changes.
     */
    private drawButtonBackground(color: number) {
        this.buttonBg.clear();
        this.buttonBg.fillStyle(color, 1);
        this.buttonBg.fillRoundedRect(
            this.buttonX - (this.buttonWidth / 2),
            this.buttonY - (this.buttonHeight / 2),
            this.buttonWidth,
            this.buttonHeight,
            20
        );
        this.buttonBg.lineStyle(4, 0xffffff, 1);
        this.buttonBg.strokeRoundedRect(
            this.buttonX - (this.buttonWidth / 2),
            this.buttonY - (this.buttonHeight / 2),
            this.buttonWidth,
            this.buttonHeight,
            20
        );
    }

    private onButtonHover = () => {
        this.drawButtonBackground(this.hoverColor);
    };

    private onButtonOut = () => {
        this.drawButtonBackground(this.normalColor);
    };

    /**
     * Called when the user clicks the button.
     */
    private handleClick = (pointer: Phaser.Input.Pointer) => {
        if (this.isPlayerInside && this.interactionButton.visible && !this.ignoreButtonClick) {
            this.ignoreButtonClick = true;
            this.handleInteraction();
        }
    };

    /**
     * If there's text to display above the ellipse, add it with a pulsing animation.
     */
    private addFloatingText(info: InteractionAreaData['floatingText']) {
        if (!info) return;
        const xPos = this.ellipse.x + info.offset.x;
        const yPos = this.ellipse.y + info.offset.y;

        this.floatingText = this.scene.add.text(xPos, yPos, info.text, {
            font: info.fontSize,
            fontFamily: info.font,
            color: info.color
        });
        this.floatingText.setOrigin(0.5);
        this.floatingText.setDepth(2);

        this.scene.tweens.add({
            targets: this.floatingText,
            scale: { from: 1, to: 1.2 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Called by IsometricScene each frame to check if the player is inside the ellipse
     * and show/hide the button accordingly.
     */
    checkPlayerInArea(x: number, y: number): void {
        const wasInside = this.isPlayerInside;
        this.isPlayerInside = this.containsPoint(x, y);

        if (this.isPlayerInside !== wasInside) {
            this.interactionButton.setVisible(this.isPlayerInside);
    
            if (this.gameElementButton) {
                this.gameElementButton.setVisible(this.isPlayerInside);
            }
    
            this.updateButtonPosition();
        }
    }
    

    private updateButtonPosition(): void {
        const camera = this.scene.cameras.main;
    
        // Main interaction button near bottom-center
        this.interactionButton.setPosition(camera.width / 2, camera.height);
        this.interactionButton.setScale(1 / camera.zoom);
    
        // The second button, offset by +120 px
        if (this.gameElementButton) {
            this.gameElementButton.setPosition(camera.width / 2 + this.geButtonX, camera.height + this.geButtonY);
            this.gameElementButton.setScale(1 / camera.zoom);
        }
    }
    

    /**
     * The main logic for overlay or custom interaction. 
     */
    handleInteraction(): void {
        if (!this.isPlayerInside) return;

        console.info(`Player inside area: '${this.displayName}'`);

        // If there's a custom buttonClickHandler, use that
        if (this.buttonClickHandler) {
            this.buttonClickHandler(this.scene);
            this.ignoreButtonClick = false;
            return;
        }

        // Otherwise, show an overlay (the old default)
        // e.g. (this.scene as any).showOverlay(this.overlayName, this.areaType, this.gameOverlayName)
        if ((this.scene as any).showOverlay) {
            (this.scene as any).showOverlay(this.overlayName, this.gameElementType, this.minigameId);
        }
        this.ignoreButtonClick = false;
    }

    /**
     * Checks if a given point (playerX, playerY) is within the ellipse shape.
     */
    containsPoint(x: number, y: number, threshold: number = 1): boolean {
        const translatedX = x - this.ellipse.x;
        const translatedY = y - this.ellipse.y;
        const rotatedX = -translatedX;
        const rotatedY = -translatedY;

        return (rotatedX * rotatedX) / (this.ellipse.width * this.ellipse.width / 4) +
            (rotatedY * rotatedY) / (this.ellipse.height * this.ellipse.height / 4) <= threshold;
    }

    /**
     * Toggles the visibility of this area (ellipse & floating text).
     */
    setVisible(visible: boolean): void {
        this.isVisible = visible;
        this.drawEllipse(this.normalColor, this.normalColor);
        if (this.floatingText) {
            this.floatingText.setVisible(visible);
        }
    }

    /**
     * Clean up references.
     */
    destroy(): void {
        this.graphics.destroy();
        if (this.glowTween) this.glowTween.stop();
        this.glowGraphics?.destroy();

        this.interactionButton.off('pointerover', this.onButtonHover, this);
        this.interactionButton.off('pointerout', this.onButtonOut, this);
        this.interactionButton.off('pointerdown', this.handleClick, this);
        this.interactionButton.destroy();

        if (this.floatingText) {
            this.floatingText.destroy();
        }
        this.scene.input.off('pointerdown', this.handleClick, this);
    }

    /**
     * Returns center of the ellipse for minimap usage, etc.
     */
    getCenter(): { x: number; y: number } {
        return { x: this.ellipse.x, y: this.ellipse.y };
    }

    getName(): string {
        return this.displayName;
    }

    /**
     * The old code used setIgnoreButtonClick() so overlays don't get triggered twice.
     */
    setIgnoreButtonClick(ignore: boolean): void {
        this.ignoreButtonClick = ignore;
    }

    public getGameElementType(): string | null {
        return this.gameElementType;
    }

    public setMinigameId(minigameId: string): void {
        this.minigameId = minigameId;

        if (!this.gameElementButton) {
            this.initGameElementButton();
        }
    }

    public handleGlowEffect(glowEffectDepth: number): void {
        if (this.glowTween) {
            this.glowTween.stop();
            this.glowTween = undefined;
        }
        
        if (this.glowGraphics) {
            this.glowGraphics.clear();
            this.glowGraphics.destroy();
            this.glowGraphics = undefined;
        }

        // only add graphics if assigned a game element
        if (this.minigameIdGlowColors.hasOwnProperty(this.minigameId) === false) {
            return
        }

        this.glowGraphics = this.scene.add.graphics();
        this.glowGraphics.setDepth(glowEffectDepth);
        const glowColor: number = this.minigameIdGlowColors[this.minigameId];
        this.glowGraphics.lineStyle(30, glowColor, 1); 
        this.glowGraphics.strokeEllipseShape(this.ellipse);

        this.glowTween = this.scene.tweens.add({
            targets: this.glowGraphics,
            alpha: { from: 0.2, to: 1.0 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeIn'
        });
    }
}
