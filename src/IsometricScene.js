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

            this.character = this.add.circle(400, 300, 5, 0xff0000);
            this.cameras.main.startFollow(this.character);
            this.cursors = this.input.keyboard.createCursorKeys();
        } catch (error) {
            console.error('Error in create function:', error);
        }
    }

    update() {
        // const speed = 2;
        // if (this.cursors.left.isDown) {
        //     this.character.x -= speed;
        // } else if (this.cursors.right.isDown) {
        //     this.character.x += speed;
        // }
        // if (this.cursors.up.isDown) {
        //     this.character.y -= speed;
        // } else if (this.cursors.down.isDown) {
        //     this.character.y += speed;
        // }
    }
}