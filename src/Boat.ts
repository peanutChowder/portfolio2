import Phaser from 'phaser';
import IsometricScene from './IsometricScene';
import InteractionArea from './InteractionArea';

export class Boat extends Phaser.GameObjects.Container {
    private boatSprite: Phaser.GameObjects.Image;
    private hitboxGraphics: Phaser.GameObjects.Graphics;
    private speed: number;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private isometricScene: IsometricScene;
    private hitboxRadius: number;
    private isBouncing: boolean = false;
    private bounceDirection: { x: number, y: number } = { x: 0, y: 0 };
    private bounceDuration: number = 400; // milliseconds
    private bounceDistance: number = 150; // pixels
    private currOrientation!: string;
    private interactionAreas: {[key:string]: InteractionArea} = {}

    constructor(scene: IsometricScene, x: number, y: number, interactionAreas: { [key: string]: InteractionArea }) {
        super(scene, x, y);

        this.isometricScene = scene;
        this.speed = 20;
        this.interactionAreas = interactionAreas;

        // Create boat sprite
        this.boatSprite = scene.add.image(0, 0, 'boat_nw');
        this.boatSprite.setOrigin(0.5, 0.8);
        this.boatSprite.setScale(1);
        this.add(this.boatSprite);

        // Set current orientation
        this.currOrientation = 'boat_nw';

        // Create hitbox
        this.hitboxRadius = 270;
        this.hitboxGraphics = scene.add.graphics();
        this.hitboxGraphics.lineStyle(10, 0xffffff);
        this.hitboxGraphics.strokeCircle(0, 0, this.hitboxRadius);
        this.add(this.hitboxGraphics);

        // Add container to scene
        scene.add.existing(this);

        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
        }

        // hide hitbox graphics
        this.hitboxGraphics.visible = false
    }

    update(): void {
        if (this.isBouncing) {
            return; // Don't allow movement while bouncing
        }

        let dx = 0;
        let dy = 0;
        let newTexture: string | null = null;

        if (this.cursors.left.isDown) {
            dx -= this.speed;
            dy += this.speed / 2;
            newTexture = 'boat_sw';
        } else if (this.cursors.right.isDown) {
            dx += this.speed;
            dy -= this.speed / 2;
            newTexture = 'boat_ne';
        } else if (this.cursors.up.isDown) {
            dx -= this.speed;
            dy -= this.speed / 2;
            newTexture = 'boat_nw';
        } else if (this.cursors.down.isDown) {
            dx += this.speed;
            dy += this.speed / 2;
            newTexture = 'boat_se';
        }

        // Update boat texture if user is facing a new direction
        if (newTexture && newTexture !== this.currOrientation) {
            this.boatSprite.setTexture(newTexture);
            this.currOrientation = newTexture;
        }

        const newX = this.x + dx;
        const newY = this.y + dy;

        Object.entries(this.interactionAreas).forEach(([_, interactionArea]) => {
            interactionArea.checkPlayerInArea(newX, newY)
        });

        if (dx !== 0 || dy !== 0) {
            if (!this.isometricScene.checkCollision(newX, newY, this.hitboxRadius)) {
                this.x = newX;
                this.y = newY;
            } else {
                this.startBounce(dx, dy);
            }
        }
    }

    private startBounce(dx: number, dy: number): void {
        this.isBouncing = true;
        this.bounceDirection = { x: -dx, y: -dy };

        // Normalize the bounce direction
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        this.bounceDirection.x = (this.bounceDirection.x / magnitude) * this.bounceDistance;
        this.bounceDirection.y = (this.bounceDirection.y / magnitude) * this.bounceDistance;

        // Start the bounce animation
        this.scene.tweens.add({
            targets: this,
            x: this.x + this.bounceDirection.x,
            y: this.y + this.bounceDirection.y,
            duration: this.bounceDuration / 2,
            ease: 'Quad.easeOut',
            yoyo: true,
            onComplete: () => {
                this.isBouncing = false;
            }
        });
    }

    getPosition(): { x: number, y: number } {
        return { x: this.x, y: this.y };
    }

    setHitboxVisibility(isVisible: boolean): void {
        this.hitboxGraphics.visible = isVisible;
    }
}