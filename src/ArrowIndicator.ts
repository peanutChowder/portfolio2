import Phaser from 'phaser';

export class ArrowIndicator extends Phaser.GameObjects.Container {
    private arrow: Phaser.GameObjects.Triangle;
    private text: Phaser.GameObjects.Text;
    private areaName: string;
    private targetX: number;
    private targetY: number;
    private arrowSize: number;
    private textSize: number;
    private radius: number;

    constructor(
        scene: Phaser.Scene, 
        targetX: number, 
        targetY: number, 
        areaName: string, 
        fontFamilies: {"header": string, "body": string},
        options: {
            arrowSize?: number,
            textSize?: number,
            arrowColor?: number,
            textColor?: string,
            radius?: number
        }
    ) {
        super(scene, 0, 0);

        this.targetX = targetX;
        this.targetY = targetY;
        this.arrowSize = options.arrowSize || 60;
        this.textSize = options.textSize || 24;
        this.radius = options.radius || 200; // Distance from boat to arrow
        this.areaName = areaName;
        const arrowColor = options.arrowColor || 0xffffff;
        const textColor = options.textColor || '#ffffff';

        // Create arrow
        this.arrow = scene.add.triangle(
            0, -100, 
            0, -this.arrowSize, 
            this.arrowSize / 2, this.arrowSize / 2, 
            -this.arrowSize / 2, this.arrowSize / 2, 
            arrowColor
        );
        this.add(this.arrow);

        // Create text
        this.text = scene.add.text(0, this.arrowSize / 2 + 10, `${areaName}\n0 tiles`, {
            fontSize: `${this.textSize}px`,
            color: textColor,
            align: 'center',
        }).setOrigin(0);
        this.text.setFontFamily(fontFamilies["header"]);
        this.add(this.text);
        this.setDepth(999)

        scene.add.existing(this);
    }

    update(boatX: number, boatY: number, distance: number): void {
        // Calculate angle to target
        const angle = Phaser.Math.Angle.Between(boatX, boatY, this.targetX, this.targetY);

        // Calculate position in a circle around the boat
        let x = boatX + this.radius * Math.cos(angle);
        let y = boatY + this.radius * Math.sin(angle);

        this.setPosition(x, y);
        this.arrow.setRotation(angle + Math.PI / 2);
        this.text.setText(`${this.areaName}\n[${Math.round(distance)} KM]`);

    }

    destroy(): void {
        super.destroy();
        this.arrow.destroy();
        this.text.destroy();
    }
}