import Phaser from 'phaser';

export class VirtualJoystick extends Phaser.GameObjects.Container {
    private base: Phaser.GameObjects.Arc;
    private stick: Phaser.GameObjects.Arc;
    private baseRadius: number;
    private stickRadius: number;
    private maxDistance: number;
    private pointerDown: boolean = false;
    private direction: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

    private xPointerOffset: number;
    private yPointerOffset: number;

    constructor(scene: Phaser.Scene, x: number, y: number, baseRadius: number = 60, stickRadius: number = 30) {
        super(scene, x, y);
        console.log(`Camera dimensions: ${scene.cameras.main.width} x ${scene.cameras.main.height}`)
        this.baseRadius = baseRadius;
        this.stickRadius = stickRadius;
        this.maxDistance = baseRadius - stickRadius;

        // Create 2 concentric circles
        this.base = scene.add.arc(0, 0, baseRadius, 0, 360, false, 0xcccccc, 0.5);
        this.add(this.base);
        this.stick = scene.add.arc(0, 0, stickRadius, 0, 360, false, 0x888888);
        this.add(this.stick);

        this.setScrollFactor(0);
        this.setDepth(1000);

        // Offset between clicks and where the invisible joystick is. Joystick coords are messed up due to
        // camera movement. 
        // Zoom influences the x and y coords, which is why we multiply it. 
        // No clue why the 2.5 factor divisor is required for camera dimensions. 
        this.xPointerOffset = -(this.x * this.scene.cameras.main.zoom + this.scene.cameras.main.width / 2.5)
        this.yPointerOffset = -(this.y * this.scene.cameras.main.zoom + this.scene.cameras.main.height / 2.5)

        this.setupEventListeners();
        scene.add.existing(this);
    }

    private setupEventListeners(): void {
        this.scene.input.on('pointerdown', this.onPointerDown, this);
        this.scene.input.on('pointermove', this.onPointerMove, this);
        this.scene.input.on('pointerup', this.onPointerUp, this);
    }

    private onPointerDown(pointer: Phaser.Input.Pointer): void {
        if (this.isPointerOverBase(pointer)) {
            console.log("Found")
            this.pointerDown = true;
            this.updateStickPosition(pointer);
        }
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

    private isPointerOverBase(pointer: Phaser.Input.Pointer): boolean {
        const localX = pointer.x + this.xPointerOffset;
        const localY = pointer.y + this.yPointerOffset;
        const distance = Math.sqrt(localX * localX + localY * localY);
        console.log(`Distance: ${distance}`)
        return distance <= (this.baseRadius * this.scene.cameras.main.zoom);
    }

    private updateStickPosition(pointer: Phaser.Input.Pointer): void {
        console.log(`${pointer.x} ${pointer.y}\n${this.x} ${this.y}`)

        const dx = pointer.x + this.xPointerOffset;
        const dy = pointer.y + this.yPointerOffset;
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