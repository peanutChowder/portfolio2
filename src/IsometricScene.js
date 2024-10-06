import Phaser from 'phaser';

// Import your assets
import tilesetPNG from '../assets/isometric-sandbox-sheet.png';
import mapJSON from '../assets/isometric-sandbox-map.json';

export default class IsometricScene extends Phaser.Scene {
    constructor() {
        super({ key: 'IsometricScene' });
    }

    preload() {
        this.load.image('tiles', tilesetPNG);
        this.load.tilemapTiledJSON('map', mapJSON);

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
            // this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
            this.cameras.main.setZoom(0.6);
            this.cameras.main.centerOn(0, 500);

            // Add debug info
            this.add.text(10, 10, 'Map dimensions: ' + worldWidth + 'x' + worldHeight, { fill: '#ffffff' });
            this.add.text(10, 30, 'Tile dimensions: ' + map.tileWidth + 'x' + map.tileHeight, { fill: '#ffffff' });
            this.add.text(10, 50, 'Tileset name: ' + tileset.name, { fill: '#ffffff' });

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

    }
}