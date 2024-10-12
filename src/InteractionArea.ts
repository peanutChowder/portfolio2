import Phaser from 'phaser';

export default class InteractionArea {
    private ellipse: Phaser.Geom.Ellipse;
    private graphics: Phaser.GameObjects.Graphics;
    private isVisible: boolean;
    private areaLineColor = 0x52f778;
    private areaFillColor = 0x81f79c;
    private promptText: Phaser.GameObjects.Text;
    private scene: Phaser.Scene;
    private isPlayerInside: boolean = false;
    private contentKey: string;

    constructor(
        scene: Phaser.Scene,
        x: number, y: number,
        width: number, height: number,
        promptMessage: string,
        contentKey: string,
        fontFamilies: {"header": string, "body": string}
    ) {
        this.scene = scene;
        this.ellipse = new Phaser.Geom.Ellipse(x, y, width, height);
        this.graphics = scene.add.graphics();
        this.isVisible = true;
        this.contentKey = contentKey;
        this.draw();

        // Add prompt text at the bottom of the screen
        this.promptText = scene.add.text(
            scene.cameras.main.width / 2,
            scene.cameras.main.height - 50,
            promptMessage,
            {
                font: '30px',
                color: '#ffffff'
            }
        );
        this.promptText.setOrigin(0.5, 1);
        this.promptText.setScrollFactor(0);
        this.promptText.setDepth(1000);
        this.promptText.setFontFamily(fontFamilies["header"])
        this.promptText.setColor("#ffffff")
        this.promptText.setVisible(false);
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
            this.promptText.setVisible(this.isPlayerInside);
            this.updatePromptPosition();
        }
    }

    private updatePromptPosition = (): void => {
        const camera = this.scene.cameras.main;
        this.promptText.setPosition(camera.width / 2, camera.height - 50);
        this.promptText.setScale(1 / camera.zoom);
    }

    handleInteraction(): void {
        if (this.isPlayerInside) {
            console.info(`Player inside area '${this.contentKey}'`);
            (this.scene as any).toggleOverlay();
        }
    }

    containsPoint(x: number, y: number): boolean {
        const translatedX = x - this.ellipse.x;
        const translatedY = y - this.ellipse.y;
        const rotatedX = -translatedX;
        const rotatedY = -translatedY;
        return (rotatedX * rotatedX) / (this.ellipse.width * this.ellipse.width / 4) +
            (rotatedY * rotatedY) / (this.ellipse.height * this.ellipse.height / 4) <= 1;
    }

    setVisible(visible: boolean) {
        this.isVisible = visible;
        this.draw();
    }

    destroy() {
        this.graphics.destroy();
        this.promptText.destroy();
    }

    getCenter(): { x: number, y: number } {
        return { x: this.ellipse.x, y: this.ellipse.y };
    }

    getName(): string {
        return this.contentKey;
    }
}