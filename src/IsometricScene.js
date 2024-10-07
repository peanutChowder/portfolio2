import Phaser from 'phaser';

// import map & map tiles
import tilesetPNG from '../assets/isometric-sandbox-32x32/isometric-sandbox-sheet.png';
import mapJSON from '../assets/isometric-sandbox-32x32/isometric-sandbox-map.json';

// import boat sprites
import boatNorthEastPNG from '../assets/boat/ship15.png';
import boatNorthWestPNG from '../assets/boat/ship3.png';
import boatSouthEastPNG from '../assets/boat/ship11.png';
import boatSouthWestPNG from '../assets/boat/ship7.png';

export default class IsometricScene extends Phaser.Scene {
    constructor() {
        super({ key: 'IsometricScene' });
        this.boat = null;
        this.cursors = null;

        this.collisionLayers = [];
        this.collisionLayerNames = [
            "Tile Layer 4",
            "Level 0"
        ];
    }

    preload() {
        this.load.image('tiles', tilesetPNG);
        this.load.tilemapTiledJSON('map', mapJSON);

        this.load.image('boat_ne', boatNorthEastPNG);
        this.load.image('boat_nw', boatNorthWestPNG);
        this.load.image('boat_se', boatSouthEastPNG);
        this.load.image('boat_sw', boatSouthWestPNG);        
        
        this.load.on('loaderror', (file) => {
            console.error('Error loading file:', file.key);
            console.error('File type:', file.type);
            console.error('File url:', file.url);
        });
    }

    create() {
        try {
            const map = this.make.tilemap({ key: 'map' });
            const tileset = map.addTilesetImage('isometric-sandbox-sheet', 'tiles');
            const layers = [];
            for (let i = 0; i < map.layers.length; i++) {
                layers[i] = map.createLayer(i, tileset, 0, 0);

                if (this.collisionLayerNames.includes(layers[i].layer.name)) {
                    this.collisionLayers.push(layers[i]);
                    // Set collision for tiles with collides property
                    layers[i].setCollisionByProperty({ collides: true });
                }
                console.log(layers[i].layer.name);
            }
            const worldWidth = map.widthInPixels;
            const worldHeight = map.heightInPixels;

            this.cameras.main.setZoom(0.6);
            this.cameras.main.centerOn(0, 500);

            // Add debug info
            this.add.text(10, 10, 'Map dimensions: ' + worldWidth + 'x' + worldHeight, { fill: '#ffffff' });
            this.add.text(10, 30, 'Tile dimensions: ' + map.tileWidth + 'x' + map.tileHeight, { fill: '#ffffff' });
            this.add.text(10, 50, 'Tileset name: ' + tileset.name, { fill: '#ffffff' });

            // Set boat default sprite before moving
            this.boat = this.add.image(400, 300, 'boat_nw');
            this.boat.setOrigin(0, 0);
            this.boat.setScale(1); // Adjust scale as needed

            // Set up camera to follow the boat
            this.cameras.main.startFollow(this.boat, true);
            // Set up keyboard controls
            this.cursors = this.input.keyboard.createCursorKeys();

            // Log map information
            console.log('Map dimensions:', worldWidth, 'x', worldHeight);
            console.log('Tile dimensions:', map.tileWidth, 'x', map.tileHeight);
            console.log('Number of layers:', map.layers.length);
            console.log('Tileset name:', tileset.name);
        } catch (error) {
            console.error('Error in create function:', error);
        }
    }

    update() {
        const speed = 2;
        let dx = 0;
        let dy = 0;
        let newTexture = null;

        if (this.cursors.left.isDown) {
            dx -= speed;
            dy += speed / 2;
            newTexture = 'boat_sw';
        } else if (this.cursors.right.isDown) {
            dx += speed;
            dy -= speed / 2;
            newTexture = 'boat_ne';
        } else if (this.cursors.up.isDown) {
            dx -= speed;
            dy -= speed / 2;
            newTexture = 'boat_nw';
        } else if (this.cursors.down.isDown) {
            dx += speed;
            dy += speed / 2;
            newTexture = 'boat_se';
        }

        // Check for collisions before moving
        if (dx !== 0 || dy !== 0) {
            const newX = this.boat.x + dx;
            const newY = this.boat.y + dy;
            
            let collided = false;
            


            // // Check collision for each layer
            // for (const layer of this.collisionLayers) {
            //     // Convert world coordinates to tile coordinates
            //     const tileX = layer.worldToTileX(newX);
            //     const tileY = layer.worldToTileY(newY);
                
            //     // Check if the new position collides with a tile
            //     const tile = layer.getTileAt(tileX, tileY);
                
            //     if (tile && tile.properties && tile.properties.collides) {
            //         collided = true;
            //         break;  // Exit the loop if we find a collision
            //     }
            // }

            if (!collided) {
                // Move the boat if there's no collision
                this.boat.x = newX;
                this.boat.y = newY;
                if (newTexture) {
                    this.boat.setTexture(newTexture);
                }
            } else {
                // Optional: Add some "bounce" effect when colliding
                this.boat.x -= dx * 0.5;
                this.boat.y -= dy * 0.5;
            }
        }
    }
}