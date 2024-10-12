import Phaser from 'phaser';

export class ArrowIndicator extends Phaser.GameObjects.Container {
    private arrow: Phaser.GameObjects.Triangle;
    private text: Phaser.GameObjects.Text;
    private targetX: number;
    private targetY: number;
    private arrowSize: number;
    private textSize: number;

    constructor(scene: Phaser.Scene, x: number, y: number, targetX: number, targetY: number, areaName: string, options: {
        arrowSize?: number,
        textSize?: number,
        arrowColor?: number,
        textColor?: string
    } = {}) {
        super(scene, x, y);

        this.targetX = targetX;
        this.targetY = targetY;

        this.arrowSize = options.arrowSize || 60;
        this.textSize = options.textSize || 24;
        const arrowColor = options.arrowColor || 0xffffff;
        const textColor = options.textColor || '#ffffff';

        // Create triangle to act as arrow
        this.arrow = scene.add.triangle(0, 0, 0, -this.arrowSize / 2, this.arrowSize / 2, this.arrowSize / 2, -this.arrowSize / 2, this.arrowSize / 2, arrowColor);
        this.add(this.arrow);

        // Draw text
        this.text = scene.add.text(0, this.arrowSize / 2 + 10, `${areaName}\n0 tiles`, {
            fontSize: `${this.textSize}px`,
            color: textColor,
            align: 'center',
            stroke: '#000000',
            strokeThickness: 30
        }).setOrigin(0.5);
        this.add(this.text);

        scene.add.existing(this);
    }

    update(x: number, y: number, distance: number): void {
        this.setPosition(x, y);

        // Update arrow rotation
        const angle = Phaser.Math.Angle.Between(x, y, this.targetX, this.targetY);
        this.arrow.rotation = angle + Math.PI / 2;

        // Update text
        this.text.setText(`${this.text.text.split('\n')[0]}\n${Math.round(distance)} tiles`);
    }

    destroy(): void {
        super.destroy();
        this.arrow.destroy();
        this.text.destroy();
    }
}