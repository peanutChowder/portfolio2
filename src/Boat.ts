import Phaser from 'phaser';
import IsometricScene from './IsometricScene';

export class Boat extends Phaser.GameObjects.Image {
    private speed: number;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private isometricScene: IsometricScene;
    private hitboxTileSize = 1;
    private isBouncing: boolean = false;
    private bounceDirection: { x: number, y: number } = { x: 0, y: 0 };
    private bounceDuration: number = 400; // milliseconds
    private bounceDistance: number = 150; // pixels

    constructor(scene: IsometricScene, x: number, y: number) {
        super(scene, x, y, 'boat_nw');
        this.isometricScene = scene;
        this.speed = 5;
        this.setOrigin(0.6, 0.6);
        this.setScale(1);
        scene.add.existing(this);
        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
        }
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

        if (dx !== 0 || dy !== 0) {
            const newX = this.x + dx;
            const newY = this.y + dy;
            if (!this.isometricScene.checkCollision(newX, newY, this.hitboxTileSize)) {
                this.x = newX;
                this.y = newY;
                if (newTexture) {
                    this.setTexture(newTexture);
                }
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
}