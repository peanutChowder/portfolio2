import Phaser from 'phaser';
import IsometricScene from './IsometricScene';
import InteractionArea from './InteractionArea';

// import boat sprites
import boatNorthPNG from '../assets/boat/boatN.png'
import boatWestPNG from '../assets/boat/boatW.png'
import boatEastPNG from '../assets/boat/boatE.png'
import boatSouthPNG from '../assets/boat/boatS.png'

// import diagonal boat sprites
import boatNorthEastPNG from '../assets/boat/boatNE.png';
import boatNorthWestPNG from '../assets/boat/boatNW.png';
import boatSouthEastPNG from '../assets/boat/boatSE.png';
import boatSouthWestPNG from '../assets/boat/boatSW.png';

export class Boat extends Phaser.GameObjects.Container {
    public body: Phaser.Physics.Arcade.Body;
    private boatSprite: Phaser.GameObjects.Image;
    private readonly hitboxDimensions: { [key: string]: {width: number, height: number, offsetX: number, offsetY: number} } = 
    {
        'boat_n':  { width: 100, height: 150, offsetX: -55, offsetY: -120 },
        'boat_s':  { width: 100, height: 150, offsetX: -55, offsetY: -120 },
        'boat_e':  { width: 230, height: 130, offsetX: -100, offsetY: -120 },
        'boat_w':  { width: 230, height: 130, offsetX: -100, offsetY: -120 },
        'boat_ne': { width: 200, height: 150, offsetX: -100, offsetY: -120 },
        'boat_nw': { width: 200, height: 150, offsetX: -100, offsetY: -120 },
        'boat_se': { width: 200, height: 150, offsetX: -100, offsetY: -120 },
        'boat_sw': { width: 200, height: 150, offsetX: -100, offsetY: -120 }
    };

    private speed: number;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private currOrientation!: string;
    private interactionAreas: {[key:string]: InteractionArea} = {}

    // Bobbing properties
    private bobbingTimer: number = 0;
    private readonly BOB_SPEED: number = 0.005; 
    private readonly BOB_AMPLITUDE: number = 15; 
       

    private getJoyStickDirection: (() => string) | undefined;

    constructor(scene: IsometricScene, x: number, y: number, interactionAreas: { [key: string]: InteractionArea }) {
        super(scene, x, y);
        
        this.speed = 1200;
        this.interactionAreas = interactionAreas;
    
        // Create boat sprite
        this.boatSprite = scene.add.image(0, 0, 'boat_nw');
        this.boatSprite.setOrigin(0.5, 0.8);
        this.boatSprite.setScale(1);
        this.add(this.boatSprite);
    
        // Set current orientation
        this.currOrientation = 'boat_nw';
    
        // Add boat container to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
    
        // Now we can safely work with the physics body
        this.body = (this as unknown as { body: Phaser.Physics.Arcade.Body }).body;
        this.body.setSize(this.hitboxDimensions["boat_nw"].width, this.hitboxDimensions["boat_nw"].height);
        this.body.setOffset(this.hitboxDimensions["boat_nw"].offsetX, this.hitboxDimensions["boat_nw"].offsetY);

        this.bobbingTimer = Math.random() * Math.PI * 2; // Random start phase for boat bobbing
    
        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
        }
    }

    setJoystickDirectionGetter(joystickDirectionGetter: () => string) {
        this.getJoyStickDirection = joystickDirectionGetter;
    }

    static preload(scene: IsometricScene): void {
        // Load boat sprite imgs
        scene.load.image('boat_n', boatNorthPNG);
        scene.load.image('boat_w', boatWestPNG);
        scene.load.image('boat_e', boatEastPNG);
        scene.load.image('boat_s', boatSouthPNG);
        scene.load.image('boat_ne', boatNorthEastPNG);
        scene.load.image('boat_nw', boatNorthWestPNG);
        scene.load.image('boat_se', boatSouthEastPNG);
        scene.load.image('boat_sw', boatSouthWestPNG);
    }

    update(): void {
        const diagonalSpeed = this.speed;
        const cardinalSpeed = this.speed * 0.7071; // approx sqrt(2)/2
        const eastWestCompensation = 1.6; // Compensates for the slow feeling east/west travel
     
        let joystickDirection = "C";
        if (this.getJoyStickDirection != undefined) {
            joystickDirection = this.getJoyStickDirection()
        }
        
        let dx = 0;
        let dy = 0;
        let newTexture: string = '';
     
        // Check for diagonal movements first
        if (this.cursors.left.isDown && this.cursors.up.isDown || (joystickDirection == "NW")) {
            dx = -diagonalSpeed;
            dy = -diagonalSpeed / 2;
            newTexture = 'boat_nw';
        } else if (this.cursors.left.isDown && this.cursors.down.isDown || (joystickDirection == "SW")) {
            dx = -diagonalSpeed;
            dy = diagonalSpeed / 2;
            newTexture = 'boat_sw';
        } else if (this.cursors.right.isDown && this.cursors.up.isDown || (joystickDirection == "NE")) {
            dx = diagonalSpeed;
            dy = -diagonalSpeed / 2;
            newTexture = 'boat_ne';
        } else if (this.cursors.right.isDown && this.cursors.down.isDown || (joystickDirection == "SE")) {
            dx = diagonalSpeed;
            dy = diagonalSpeed / 2;
            newTexture = 'boat_se';
        }
        // then check for cardinal directions
        else if (this.cursors.left.isDown || (joystickDirection == "W")) {
            dx = -cardinalSpeed * eastWestCompensation;
            newTexture = 'boat_w';
        } else if (this.cursors.right.isDown || (joystickDirection == "E")) {
            dx = cardinalSpeed * eastWestCompensation;
            newTexture = 'boat_e';
        } else if (this.cursors.up.isDown || (joystickDirection == "N")) {
            dy = -cardinalSpeed;
            newTexture = 'boat_n';
        } else if (this.cursors.down.isDown || (joystickDirection == "S")) {
            dy = cardinalSpeed;
            newTexture = 'boat_s';
        }
     
        // Update boat texture if direction changed
        if (newTexture && newTexture !== this.currOrientation) {
            this.boatSprite.setTexture(newTexture);
            this.currOrientation = newTexture;
            
            // Update hitbox dimensions
            const dimensions = this.hitboxDimensions[newTexture];
            this.body.setSize(dimensions.width, dimensions.height);
            this.body.setOffset(dimensions.offsetX, dimensions.offsetY);
        }
     
        // Apply velocity
        this.body.setVelocity(dx, dy);
     
        // Check interaction areas using current position
        Object.entries(this.interactionAreas).forEach(([_, interactionArea]) => {
            interactionArea.checkPlayerInArea(this.x, this.y)
        });

        // Apply boat bobbing
        this.updateBobbing();

        // Apply fog to boat when close to map boundaries
        const scene = this.scene as IsometricScene;
        const alpha = scene.calcBoatFog(this.x, this.y);
        this.boatSprite.setAlpha(alpha);
     }

    getPosition(): { x: number, y: number } {
        return { x: this.x, y: this.y };
    }

    private updateBobbing(): void {
        // Update timer
        this.bobbingTimer += this.scene.game.loop.delta * this.BOB_SPEED;
        
        // Calculate offset w/ sine wave
        const verticalOffset = Math.sin(this.bobbingTimer) * this.BOB_AMPLITUDE;
        this.boatSprite.setY(verticalOffset);
    }
}