import Phaser from 'phaser';
import IsometricScene from './IsometricScene'; // Import the IsometricScene

export class Boat extends Phaser.GameObjects.Image {
    private speed: number;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private isometricScene: IsometricScene;
    private hitboxTileSize = 2;

    constructor(scene: IsometricScene, x: number, y: number) {
        super(scene, x, y, 'boat_nw');
        
        this.isometricScene = scene;
        this.speed = 2;
        this.setOrigin(0.6, 0.6);
        this.setScale(1);

        scene.add.existing(this);

        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
        }
    }

    update(): void {
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
                // Optional: Add some "bounce" effect when colliding
                this.x -= dx * 1;
                this.y -= dy * 1;
            }
        }
    }

    getPosition(): { x: number, y: number } {
        return { x: this.x, y: this.y };
    }
}