import Phaser from 'phaser';


import fireworkRocketBlue from '../assets/fireworks/Rocket_Blue.png-sheet.png'
import fireworkRocketOrange from '../assets/fireworks/Rocket_Orange-sheet.png'
import fireworkExplosionBlue from '../assets/fireworks/Explosion_Default_Blue-sheet.png'
import fireworkExplosionGreen from '../assets/fireworks/Explosion_Default_Green-sheet.png'

interface FireworkType {
    rocketTexture: string;
    explosionTexture: string;
    launchAnim: string;
    explodeAnim: string;
}

export class FireworkManager {
    private scene: Phaser.Scene;
    private fireworkTypes: FireworkType[];
    private fireworksActive: number = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        
        // Define available firework types
        this.fireworkTypes = [
            {
                rocketTexture: 'fireworkRocketBlue',
                explosionTexture: 'fireworkExplosionBlue',
                launchAnim: 'fireworkLaunchBlue',
                explodeAnim: 'fireworkExplodeBlue'
            },
            {
                rocketTexture: 'fireworkRocketOrange',
                explosionTexture: 'fireworkExplosionGreen',
                launchAnim: 'fireworkLaunchOrange',
                explodeAnim: 'fireworkExplodeGreen'
            }
        ];
    }

    preload(): void {
        this.scene.load.spritesheet('fireworkRocketBlue',
            fireworkRocketBlue,
            {frameWidth: 7, frameHeight: 52}
        )
        this.scene.load.spritesheet('fireworkExplosionGreen',
            fireworkExplosionGreen,
            {frameWidth: 99, frameHeight: 99}
        )
        this.scene.load.spritesheet('fireworkRocketOrange',
            fireworkRocketOrange,
            {frameWidth: 7, frameHeight: 51}
        )
        this.scene.load.spritesheet('fireworkExplosionBlue',
            fireworkExplosionBlue,
            {frameWidth: 93, frameHeight: 100}
        )
    }

    create(): void {
        this.scene.anims.create({
            key: 'fireworkLaunchBlue',
            frames: this.scene.anims.generateFrameNumbers('fireworkRocketBlue'),
            frameRate: 12,
            repeat: 0
        });
        
        // Create explosion animation
        this.scene.anims.create({
            key: 'fireworkExplodeBlue',
            frames: this.scene.anims.generateFrameNumbers('fireworkExplosionBlue'),
            frameRate: 12,
            repeat: 0
        });
        this.scene.anims.create({
            key: 'fireworkLaunchOrange',
            frames: this.scene.anims.generateFrameNumbers('fireworkRocketOrange'),
            frameRate: 12,
            repeat: 0
        });
        
        // Create explosion animation
        this.scene.anims.create({
            key: 'fireworkExplodeGreen',
            frames: this.scene.anims.generateFrameNumbers('fireworkExplosionGreen'),
            frameRate: 12,
            repeat: 0
        });
    }

    createFireworkDisplay(centerX: number, centerY: number, radius: number = 1000): void {
        // Stop user from spamming fireworks
        if (this.fireworksActive > 0) {return;}

        for(let i = 0; i < 10; i++) {
            const angle = Phaser.Math.Between(0, 360);
            const distance = Phaser.Math.Between(0, radius);
            const startX = centerX + (distance * Math.cos(angle * Math.PI / 180));
            const startY = centerY + (distance * Math.sin(angle * Math.PI / 180));

            const fireworkType = Phaser.Utils.Array.GetRandom(this.fireworkTypes);

            this.scene.time.delayedCall(i * 200, () => {
                this.fireworksActive += 1;
                this.launchFirework(startX, startY, fireworkType);
            });
        }
    }

    private launchFirework(startX: number, startY: number, fireworkType: FireworkType): void {
        if (!this.scene.anims.exists(fireworkType.launchAnim)) {
            console.error(`Launch animation ${fireworkType.launchAnim} not found`);
            return;
        }

        const rocket = this.scene.add.sprite(startX, startY, fireworkType.rocketTexture)
            .setScale(20);

        const peakY: number = startY - Phaser.Math.Between(800, 1200);

        try {
            rocket.play(fireworkType.launchAnim);
        } catch (error) {
            console.error('Error playing launch animation:', error);
            rocket.destroy();
            return;
        }

        this.scene.tweens.add({
            targets: rocket,
            y: peakY,
            duration: 1000,
            ease: 'Linear',
            onComplete: () => {
                rocket.setVisible(false);

                if (!this.scene.anims.exists(fireworkType.explodeAnim)) {
                    console.error(`Explosion animation ${fireworkType.explodeAnim} not found`);
                    rocket.destroy();
                    return;
                }

                const explosion = this.scene.add.sprite(rocket.x, rocket.y, fireworkType.explosionTexture)
                    .setScale(20);
                
                try {
                    explosion.play(fireworkType.explodeAnim);
                } catch (error) {
                    console.error('Error playing explosion animation:', error);
                    explosion.destroy();
                    rocket.destroy();
                    return;
                }

                explosion.on('animationcomplete', () => {
                    // Track when fireworks are done so user can click again.
                    this.fireworksActive -= 1;

                    explosion.destroy();
                    rocket.destroy();
                });
            }
        });
    }
}