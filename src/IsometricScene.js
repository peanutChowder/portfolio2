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
            this.boat.setOrigin(0.5, 0.5);
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

        // Update boat movement and boat sprite direction
        // according to user keypress
        if (this.cursors.left.isDown) {
            this.boat.x -= speed;
            this.boat.y += speed / 2;
            this.boat.setTexture('boat_sw');
        }
        if (this.cursors.right.isDown) {
            this.boat.x += speed;
            this.boat.y -= speed / 2;
            this.boat.setTexture('boat_ne');
        }
        if (this.cursors.up.isDown) {
            this.boat.x -= speed;
            this.boat.y -= speed / 2;
            this.boat.setTexture('boat_nw');
        }
        if (this.cursors.down.isDown) {
            this.boat.x += speed;
            this.boat.y += speed / 2;
            this.boat.setTexture('boat_se');
        }
    }
}