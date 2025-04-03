import Phaser from 'phaser';
import { InteractionAreaData, ResourceBehavior } from './InteractionAreaData';
import fishingRod from '../assets/fishing/rod.jpg';

/**
 * Manages a single "InteractionArea" on the map – could be
 * a fishing spot, a safehouse, or a static area.
 */
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
    private resourceBehavior: ResourceBehavior = "none";

    // Button properties for InteractionArea Overlay
    private interactionButton: Phaser.GameObjects.Container | null = null;
    private buttonBg!: Phaser.GameObjects.Graphics;
    private buttonText!: Phaser.GameObjects.Text;
    private ignoreButtonClick: boolean = false;
    private normalColor: number;
    private hoverColor: number;
    private buttonX: number = 0;
    private buttonY: number = 0;
    private buttonWidth: number;
    private buttonHeight: number;

    // Game element depletion (e.g. are we out of fish or treasure?)
    private activeBlockers: Set<string> = new Set(); // blockers that should prevent users from clicking on a depletable area
    private depletionCross?: Phaser.GameObjects.Graphics;

    // Game Element button properties
    private gameElementButton?: Phaser.GameObjects.Container;
    private geButtonWidth: number;
    private geButtonHeight: number;

    // If there's a custom action (e.g. fireworks) instead of the normal overlay
    private buttonClickHandler?: (scene: Phaser.Scene) => void;

    // Data object containing things like "displayName", "overlayKey", "position", etc.
    // @ts-ignore
    private areaData: InteractionAreaData;

    // Glow effect for assigned minigame color
    private assignedGlowColor: string | undefined;
    private glowGraphics?: Phaser.GameObjects.Graphics;
    private glowTween?: Phaser.Tweens.Tween;

    // If no band color is assigned, fallback to these minigame-based glow colors
    private minigameIdGlowColors: { [key: string]: number } = {
        "fishPunch": 0xe8feff,
        "fishBounce": 0xe8feff
    };

    static preload(scene: Phaser.Scene): void {
        scene.load.image('fishingRod', fishingRod);
    }

    constructor(scene: Phaser.Scene, areaData: InteractionAreaData) {
        this.scene = scene;
        this.isVisible = true;
        this.areaData = areaData;
        this.id = areaData.id;

        this.resourceBehavior = areaData.resourceBehavior ?? 'none';

        this.displayName = areaData.displayName;
        this.overlayName = areaData.overlayKey;

        // Convert elliptical geometry
        this.ellipse = new Phaser.Geom.Ellipse(
            areaData.positionX,
            areaData.positionY,
            areaData.width,
            areaData.height
        );


        const lineColor = areaData.areaEdgeColor;
        const fillColor = areaData.areaBaseColor;

        this.graphics = this.scene.add.graphics();

        if (areaData.markerInfo) {
            this.markerInfo = {
                color: areaData.markerInfo.baseColor,
                radius: areaData.markerInfo.radius,
                locationType: areaData.markerInfo.locationType
            };
        }

        if (areaData.floatingText) {
            this.addFloatingText(areaData.floatingText);
        }

        this.buttonClickHandler = areaData.customInteraction;
        this.gameElementType = areaData.gameElementType || '';

        // Draw the ellipse
        this.drawEllipse(lineColor, fillColor);

        // Setup button text & colors
        const fallbackText = areaData.displayName || 'No Title';
        const fallbackFont = 'Arial';
        const fallbackFontColor = '#ffffff';
        const fallbackBaseColor = areaData.areaBaseColor;
        const fallbackHoverColor = areaData.areaEdgeColor;

        const buttonData = areaData.buttonConfig || {
            text: fallbackText,
            font: fallbackFont,
            fontColor: fallbackFontColor,
            baseColor: fallbackBaseColor,
            hoverColor: fallbackHoverColor
        };

        this.normalColor = buttonData.baseColor;
        this.hoverColor = buttonData.hoverColor;

        // Decide button dimensions (desktop vs. mobile)
        if (this.scene.sys.game.device.os.desktop) {
            this.buttonWidth = 300;
            this.buttonHeight = 90;
            this.geButtonWidth = 90;
            this.geButtonHeight = 90;
        } else {
            this.buttonWidth = 0.7 * this.scene.cameras.main.width;
            this.buttonHeight = 0.1 * this.scene.cameras.main.height;
            this.geButtonWidth = 0.1 * this.scene.cameras.main.height;
            this.geButtonHeight = 0.1 * this.scene.cameras.main.height;
        }

        // If it's a "static" resource, we skip creating the main overlay button
        if (this.resourceBehavior !== 'static') {
            this.initInteractionButton(buttonData.text, buttonData.font);
            this.interactionButton?.setVisible(false);
        } else {
            this.interactionButton = null;
        }
    }

    private drawEllipse(lineColor: number, fillColor: number) {
        this.graphics.clear();
        if (!this.isVisible) return;

        if (lineColor) {
            this.graphics.lineStyle(10, lineColor, 1);
            this.graphics.fillStyle(fillColor, 0.4);
        }
       
        this.graphics.strokeEllipseShape(this.ellipse);
        this.graphics.fillEllipseShape(this.ellipse);
    }

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
            Phaser.Geom.Rectangle.Contains
        );
        this.interactionButton.on('pointerover', this.onButtonHover, this);
        this.interactionButton.on('pointerout', this.onButtonOut, this);
        this.interactionButton.on('pointerdown', this.handleClick, this);
    }

    private initGameElementButton(): void {
        if (!this.minigameId) return;

        this.gameElementButton = this.scene.add.container(0, 0);
        this.gameElementButton.setScrollFactor(0);
        this.gameElementButton.setDepth(50);
        this.gameElementButton.setVisible(false);

        if (this.gameElementType === 'safehouse') {
            // Example safehouse button
            const btnWidth = 300;
            const btnHeight = 90;
            const btnRadius = 20;
            const btnLineWidth = 6;

            const bg = this.scene.add.graphics();
            bg.fillStyle(this.normalColor, 1);
            bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);
            bg.lineStyle(btnLineWidth, 0xffffff, 1);
            bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);

            const label = this.scene.add.text(0, 0, 'Enter Safehouse', {
                font: `24px Prompt`,
                color: '#ffffff'
            });
            label.setOrigin(0.5);

            this.gameElementButton.add([bg, label]);
            this.gameElementButton.setSize(btnWidth, btnHeight);

            this.gameElementButton.setInteractive(
                new Phaser.Geom.Rectangle(0, 0, btnWidth, btnHeight),
                Phaser.Geom.Rectangle.Contains
            );

            this.gameElementButton.on('pointerover', () => {
                bg.clear();
                bg.fillStyle(this.hoverColor, 1);
                bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);
                bg.lineStyle(btnLineWidth, 0xffffff, 1);
                bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);
            });

            this.gameElementButton.on('pointerout', () => {
                bg.clear();
                bg.fillStyle(this.normalColor, 1);
                bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);
                bg.lineStyle(btnLineWidth, 0xffffff, 1);
                bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnRadius);
            });

        } else if (this.gameElementType === 'fishing') {
            // Example fishing button
            const bg = this.scene.add.graphics();
            const drawBg = (borderColor: number) => {
                bg.clear();
                bg.fillStyle(0xffffff, 1);
                bg.fillRoundedRect(
                    -this.geButtonWidth / 2,
                    -this.geButtonHeight / 2,
                    this.geButtonWidth,
                    this.geButtonHeight,
                    20
                );
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
            this.gameElementButton.setSize(this.geButtonWidth, this.geButtonHeight);

            this.gameElementButton.setInteractive(
                new Phaser.Geom.Rectangle(0, 0, this.geButtonWidth, this.geButtonHeight),
                Phaser.Geom.Rectangle.Contains
            );

            this.gameElementButton.on('pointerover', () => drawBg(this.hoverColor));
            this.gameElementButton.on('pointerout', () => drawBg(this.normalColor));
        }

        // Behavior on pointerdown for the "game element" button
        this.gameElementButton.on('pointerdown', () => {
            const blockers = this.activeBlockers;

            if (blockers.has('depletion')) {
                const label = this.gameElementType === 'fishing'
                    ? 'Fish'
                    : this.gameElementType === 'treasure'
                        ? 'Treasure'
                        : 'Resource';
                this.showDepletionPopup(`${label} has been depleted at this island, find another spot.`);
                return;
            }

            if (blockers.has('inventoryFull')) {
                this.showDepletionPopup(`Inventory full! Sell or store items first.`);
                return;
            }

            if (blockers.has('noEnergy')) {
                this.showDepletionPopup(`You are too tired to fish here; go rest at a safehouse.`);
                return;
            }

            if ((this.scene as any).showGameOverlay) {
                (this.scene as any).showGameOverlay(this.minigameId);
            }
        });
    }

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

    private handleClick = (_pointer: Phaser.Input.Pointer) => {
        if (this.isPlayerInside && this.interactionButton?.visible && !this.ignoreButtonClick) {
            this.ignoreButtonClick = true;
            this.handleInteraction();
        }
    };

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
        this.floatingText.setDepth(50);

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
     * and to show/hide the button accordingly.
     */
    checkPlayerInArea(x: number, y: number): void {
        const wasInside = this.isPlayerInside;
        this.isPlayerInside = this.containsPoint(x, y);

        if (this.isPlayerInside !== wasInside) {
            this.interactionButton?.setVisible(this.isPlayerInside);
            if (this.gameElementButton) {
                this.gameElementButton.setVisible(this.isPlayerInside);
            }
            this.updateButtonPosition();
        }
    }

    private updateButtonPosition(): void {
        const camera = this.scene.cameras.main;

        // Main overlay button near bottom-center
        if (this.interactionButton) {
            this.interactionButton.setPosition(camera.width / 2, camera.height);
            this.interactionButton.setScale(1 / camera.zoom);
        }

        let gameElementOffsetX = 0;
        let gameElementOffsetY = 0;
        if (this.scene.sys.game.device.os.desktop) {
            gameElementOffsetX = (this.buttonWidth / 2) / camera.zoom + (this.geButtonWidth / 2) / camera.zoom + 50;
        } else {
            gameElementOffsetX = -((this.buttonWidth / 3) / camera.zoom);
            gameElementOffsetY = -((this.buttonHeight) / camera.zoom + 50);
        }

        if (this.gameElementButton) {
            if (this.gameElementType === 'safehouse') {
                // Example: position the safehouse button differently
                this.gameElementButton.setPosition(camera.width / 2, camera.height - 100);
            } else if (this.gameElementType === 'fishing') {
                this.gameElementButton.setPosition(
                    camera.width / 2 + gameElementOffsetX,
                    camera.height + gameElementOffsetY
                );
            }
            this.gameElementButton.setScale(1 / camera.zoom);
        }
    }

    handleInteraction(): void {
        if (!this.isPlayerInside) return;
        if (this.resourceBehavior === "static") return;

        // custom buttonClickHandler?
        if (this.buttonClickHandler) {
            this.buttonClickHandler(this.scene);
            this.ignoreButtonClick = false;
            return;
        }

        // otherwise show the default overlay
        if ((this.scene as any).showOverlay) {
            (this.scene as any).showOverlay(this.overlayName, this.gameElementType, this.minigameId);
        }
        this.ignoreButtonClick = false;
    }

    containsPoint(x: number, y: number, threshold: number = 1): boolean {
        const translatedX = x - this.ellipse.x;
        const translatedY = y - this.ellipse.y;
        const rotatedX = -translatedX;
        const rotatedY = -translatedY;

        return (
            (rotatedX * rotatedX) / (this.ellipse.width * this.ellipse.width / 4) +
            (rotatedY * rotatedY) / (this.ellipse.height * this.ellipse.height / 4) <= threshold
        );
    }

    setVisible(visible: boolean): void {
        this.isVisible = visible;
        this.drawEllipse(this.normalColor, this.normalColor);
        if (this.floatingText) {
            this.floatingText.setVisible(visible);
        }
    }

    destroy(): void {
        this.graphics.destroy();
        if (this.glowTween) {
            this.glowTween.stop();
        }
        this.glowGraphics?.destroy();

        this.interactionButton?.off('pointerover', this.onButtonHover, this);
        this.interactionButton?.off('pointerout', this.onButtonOut, this);
        this.interactionButton?.off('pointerdown', this.handleClick, this);
        this.interactionButton?.destroy();

        if (this.floatingText) {
            this.floatingText.destroy();
        }
        this.scene.input.off('pointerdown', this.handleClick, this);
    }

    getCenter(): { x: number; y: number } {
        return { x: this.ellipse.x, y: this.ellipse.y };
    }

    getName(): string {
        return this.displayName;
    }

    setIgnoreButtonClick(ignore: boolean): void {
        this.ignoreButtonClick = ignore;
    }

    public getGameElementType(): string | null {
        return this.gameElementType;
    }

    public setMinigameId(minigameId: string): void {
        this.minigameId = minigameId;

        // If we remove the minigame, also remove any leftover buttons/cross
        if (!minigameId) {
            if (this.gameElementButton) {
                this.gameElementButton.destroy(true);
                this.gameElementButton = undefined;
            }
            if (this.depletionCross) {
                this.depletionCross.destroy();
                this.depletionCross = undefined;
            }
            return;
        }

        // If we do have a minigame assigned now, create or re-init the button
        if (!this.gameElementButton) {
            this.initGameElementButton();
        }
    }

    /**
     * Let IslandManager set a color for glow usage
     */
    public setGlowColor(color?: string): void {
        this.assignedGlowColor = color;
    }

    /**
     * This is called (by IslandManager or the scene) to animate a glow effect.
     */
    public handleGlowEffect(glowEffectDepth: number): void {
        if (this.gameElementType !== 'fishing') return;
        // Clear old tween/graphics
        if (this.glowTween) {
            this.glowTween.stop();
            this.glowTween = undefined;
        }
        if (this.glowGraphics) {
            this.glowGraphics.clear();
            this.glowGraphics.destroy();
            this.glowGraphics = undefined;
        }

        // If no minigame is assigned, do nothing
        if (!this.minigameId) return;

        // Use the band color from IslandManager if assigned, else fallback
        let glowColor: number;
        if (this.assignedGlowColor) {
            glowColor = parseInt(this.assignedGlowColor.replace('#', '0x'), 16);
        } else {
            // fallback to old color logic for fishPunch/fishBounce
            glowColor = this.minigameIdGlowColors[this.minigameId] ?? 0xffffff;
        }

        this.glowGraphics = this.scene.add.graphics();
        this.glowGraphics.setDepth(glowEffectDepth);

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

    public getGameElementBlockers(): Set<string> {
        return this.activeBlockers;
    }

    public updateButtonBlockers(blockers: Set<string>): void {
        this.activeBlockers = blockers;
        const isBlocked = blockers.size > 0;

        if (!this.gameElementButton) return;

        if (isBlocked && !this.depletionCross) {
            const lineThickness = 10;
            const lineColor = 0xff0000;

            this.depletionCross = this.scene.add.graphics();
            this.depletionCross.lineStyle(lineThickness, lineColor, 1);

            const halfW = this.geButtonWidth / 2;
            const halfH = this.geButtonHeight / 2;

            this.depletionCross.beginPath();
            this.depletionCross.moveTo(-halfW, -halfH);
            this.depletionCross.lineTo(halfW, halfH);
            this.depletionCross.moveTo(halfW, -halfH);
            this.depletionCross.lineTo(-halfW, halfH);
            this.depletionCross.strokePath();
            this.depletionCross.closePath();

            this.gameElementButton.add(this.depletionCross);
        } else if (!isBlocked && this.depletionCross) {
            this.depletionCross.destroy();
            this.depletionCross = undefined;
        }
    }

    public showDepletionPopup(message: string): void {
        const centerX = this.scene.cameras.main.centerX;
        const centerY = this.scene.cameras.main.centerY / 3;

        const popupText = this.scene.add.text(centerX, centerY, message, {
            fontFamily: 'Prompt, Arial, sans-serif',
            fontSize: '170px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: this.scene.cameras.main.width }
        });

        popupText.setOrigin(0.5);
        popupText.setScrollFactor(0);
        popupText.setDepth(90);
        popupText.setAlpha(0);

        // Fade in
        this.scene.tweens.add({
            targets: popupText,
            alpha: 1,
            duration: 300,
            ease: 'Power1',
            onComplete: () => {
                // hold for 2s, then fade out
                this.scene.time.delayedCall(2000, () => {
                    this.scene.tweens.add({
                        targets: popupText,
                        alpha: 0,
                        duration: 500,
                        ease: 'Power1',
                        onComplete: () => popupText.destroy()
                    });
                });
            }
        });
    }

    public getResourceBehavior(): ResourceBehavior {
        return this.resourceBehavior;
    }

    private isInventoryFull(): boolean {
        // cast Scene to any to call getInventory
        const scene = this.scene as any;
        const inventory = scene.getInventory?.();
        return inventory?.isInventoryFull() ?? false;
    }

    /**
     * Called to check e.g. resource depletion, energy, inventory capacity, etc.
     */
    public evaluateGameElementBlockers(): void {
        const blockers = new Set<string>();
        const scene = this.scene as any;

        const assignedGameId = this.minigameId;
        const gameElement = scene.islandManager?.getGameElementById?.(assignedGameId);

        if (gameElement && this.resourceBehavior === 'depletable') {
            // Resource depletion
            if (scene.islandManager?.isResourceDepleted(this.id)) {
                blockers.add('depletion');
            }

            // Inventory full
            if (this.isInventoryFull()) {
                blockers.add('inventoryFull');
            }

            // Not enough energy
            const currentEnergy = scene.energy ?? 0;
            if (currentEnergy < gameElement.energyCost) {
                blockers.add('noEnergy');
            }
        }

        this.updateButtonBlockers(blockers);
    }
}
