import Phaser from 'phaser';

export class VirtualJoystick extends Phaser.GameObjects.Container {
    private base: Phaser.GameObjects.Arc;
    private stick: Phaser.GameObjects.Arc;
    private baseRadius: number;
    private stickRadius: number;
    private maxDistance: number;
    private pointerDown: boolean = false;
    private direction: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

    constructor(scene: Phaser.Scene, x: number, y: number, baseRadius: number = 60, stickRadius: number = 30) {
        super(scene, x, y);

        this.baseRadius = baseRadius;
        this.stickRadius = stickRadius;
        this.maxDistance = baseRadius - stickRadius;

        // Create 2 concentric circles
        this.base = scene.add.arc(0, 0, baseRadius, 0, 360, false, 0xcccccc, 0.5);
        this.add(this.base);
        this.stick = scene.add.arc(0, 0, stickRadius, 0, 360, false, 0x888888);
        this.add(this.stick);

        this.base.setInteractive({ useHandCursor: true });
        this.setupEventListeners();

        scene.add.existing(this);
    }

    private setupEventListeners(): void {
        this.base.on('pointerdown', this.onPointerDown, this);
        this.scene.input.on('pointermove', this.onPointerMove, this);
        this.scene.input.on('pointerup', this.onPointerUp, this);
    }

    private onPointerDown(pointer: Phaser.Input.Pointer): void {
        this.pointerDown = true;
        this.updateStickPosition(pointer);
    }

    private onPointerMove(pointer: Phaser.Input.Pointer): void {
        if (this.pointerDown) {
            this.updateStickPosition(pointer);
        }
    }

    private onPointerUp(): void {
        this.pointerDown = false;
        this.resetStickPosition();
    }

    private updateStickPosition(pointer: Phaser.Input.Pointer): void {
        const dx = pointer.x - (this.x + this.scene.cameras.main.scrollX);
        const dy = pointer.y - (this.y + this.scene.cameras.main.scrollY);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.maxDistance) {
            this.stick.setPosition(dx, dy);
        } else {
            const angle = Math.atan2(dy, dx);
            this.stick.setPosition(
                Math.cos(angle) * this.maxDistance,
                Math.sin(angle) * this.maxDistance
            );
        }

        this.direction.set(this.stick.x, this.stick.y).normalize();
    }

    private resetStickPosition(): void {
        this.stick.setPosition(0, 0);
        this.direction.set(0, 0);
    }

    public getDirection(): Phaser.Math.Vector2 {
        return this.direction;
    }
}