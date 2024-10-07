import Phaser from 'phaser';
import { Boat } from './Boat';

// import map & map tiles
import tilesetPNG from '../assets/isometric-sandbox-32x32/isometric-sandbox-sheet.png';
import mapJSON from '../assets/isometric-sandbox-32x32/isometric-sandbox-map.json';

// import boat sprites
import boatNorthEastPNG from '../assets/boat/ship15.png';
import boatNorthWestPNG from '../assets/boat/ship3.png';
import boatSouthEastPNG from '../assets/boat/ship11.png';
import boatSouthWestPNG from '../assets/boat/ship7.png';

export default class IsometricScene extends Phaser.Scene {
    private map!: Phaser.Tilemaps.Tilemap;
    private boat!: Boat;
    private collisionLayers: Phaser.Tilemaps.TilemapLayer[];
    private collisionLayerNames: string[];

    // Debug text attributes
    private debugMode: boolean;
    private debugText!: Phaser.GameObjects.Text;
    private clickCoords: { worldX: number, worldY: number, tileX: number, tileY: number } | null = null;

    constructor() {
        super({ key: 'IsometricScene' });
        this.collisionLayers = [];
        this.collisionLayerNames = [
            "Tile Layer 4",
            "Level 0"
        ];
        this.debugMode = false;
    }

    preload(): void {
        this.load.image('tiles', tilesetPNG);
        this.load.tilemapTiledJSON('map', mapJSON);

        this.load.image('boat_ne', boatNorthEastPNG);
        this.load.image('boat_nw', boatNorthWestPNG);
        this.load.image('boat_se', boatSouthEastPNG);
        this.load.image('boat_sw', boatSouthWestPNG);        
        
        this.load.on('loaderror', (file: Phaser.Loader.File) => {
            console.error('Error loading file:', file.key);
            console.error('File type:', file.type);
            console.error('File url:', file.url);
        });
    }

    create(): void {
        console.group("create()");
        try {
            this.map = this.make.tilemap({ key: 'map' });
            const tileset = this.map.addTilesetImage('isometric-sandbox-sheet', 'tiles');
            if (!tileset) {
                throw new Error('Failed to load tileset');
            }
    
            console.group("Adding map layers");
            const layers: Phaser.Tilemaps.TilemapLayer[] = [];
            for (let i = 0; i < this.map.layers.length; i++) {
                const layer = this.map.createLayer(i, tileset, 0, 0);
                if (layer) {
                    layers[i] = layer;
                    if (this.collisionLayerNames.includes(layer.layer.name)) {
                        this.collisionLayers.push(layer);
                        console.log(this.collisionLayers);
                        layer.setCollisionByProperty({ collides: true });
                    }
                    console.log(`Added layer ${layer.layer.name}`);
                } else {
                    console.error(`Error getting layer number '${i}'`);
                }
            }
            console.groupEnd();

            const worldWidth = this.map.widthInPixels;
            const worldHeight = this.map.heightInPixels;

            this.cameras.main.setZoom(0.8);
            this.cameras.main.centerOn(0, 500);

            // Add debug info
            this.add.text(10, 10, `Map dimensions: ${worldWidth}x${worldHeight}`, { color: '#ffffff' });
            this.add.text(10, 30, `Tile dimensions: ${this.map.tileWidth}x${this.map.tileHeight}`, { color: '#ffffff' });
            this.add.text(10, 50, `Tileset name: ${tileset.name}`, { color: '#ffffff' });

            // Create the boat
            this.boat = new Boat(this, 200, 200);

            // Set up camera to follow the boat
            this.cameras.main.startFollow(this.boat, true);

            // Log map information
            console.log('Map dimensions:', worldWidth, 'x', worldHeight);
            console.log('Tile dimensions:', this.map.tileWidth, 'x', this.map.tileHeight);
            console.log('Number of layers:', this.map.layers.length);
            console.log('Tileset name:', tileset.name);

            // Set up debugging tool
            this.setupDebuggingTool();

        } catch (error) {
            console.error('Error in create function:', error);
        }

        console.groupEnd();
    }

    update(): void {
        this.boat.update();

        // Update debug text with boat coordinates
        if (this.debugMode) {
            const { x: worldX, y: worldY } = this.boat.getPosition();
            const tileCoords = this.map.worldToTileXY(worldX, worldY);
            if (tileCoords) {
                this.updateDebugText(worldX, worldY, tileCoords.x, tileCoords.y);
            }

            // Position the debug text relative to the boat in screen space
            const cameraView = this.cameras.main.worldView;
            const textX = worldX - cameraView.x + 10;
            const textY = worldY - cameraView.y - 60; // Adjust this value to position the text above the boat
            this.debugText.setPosition(textX, textY);
        }
    }

    private setupDebuggingTool(): void {
        // Add a text object to display coordinates
        this.debugText = this.add.text(10, 10, '', { color: '#ffffff' });
        this.debugText.setScrollFactor(0); // Make the text stay in the same position relative to the camera

        // Add a keyboard event to toggle debug mode
        this.input.keyboard.on('keydown-D', () => {
            this.debugMode = !this.debugMode;
            this.debugText.setText(this.debugMode ? 'Debug Mode: ON' : 'Debug Mode: OFF');
            if (this.debugMode) {
                const { x: worldX, y: worldY } = this.boat.getPosition();
                const tileCoords = this.map.worldToTileXY(worldX, worldY);
                if (tileCoords) {
                    this.updateDebugText(worldX, worldY, tileCoords.x, tileCoords.y);
                }
            }
        });

        // Add click event listener
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.debugMode) {
                const worldX = pointer.worldX;
                const worldY = pointer.worldY;
                const tileCoords = this.map.worldToTileXY(worldX, worldY);

                if (tileCoords) {
                    this.clickCoords = {
                        worldX: worldX,
                        worldY: worldY,
                        tileX: tileCoords.x,
                        tileY: tileCoords.y
                    };
                }
            }
        });
    }
    
    private updateDebugText(worldX: number, worldY: number, tileX: number, tileY: number): void {
        let debugText = `Boat World Coords: (${worldX.toFixed(2)}, ${worldY.toFixed(2)})\n`;
        debugText += `Boat Tile Coords: (${tileX.toFixed(2)}, ${tileY.toFixed(2)})`;
    
        if (this.clickCoords) {
            debugText += `\nClick World Coords: (${this.clickCoords.worldX.toFixed(2)}, ${this.clickCoords.worldY.toFixed(2)})`;
            debugText += `\nClick Tile Coords: (${this.clickCoords.tileX.toFixed(2)}, ${this.clickCoords.tileY.toFixed(2)})`;
        }
    
        this.debugText.setText(debugText);
    }

    public checkCollision(x: number, y: number): boolean {
        const tileCoords = this.map.worldToTileXY(x, y);
        
        if (tileCoords) {
            const xCoord = Math.floor(tileCoords.x);
            const yCoord = Math.floor(tileCoords.y);

            for (const layer of this.collisionLayers) {
                const tile = layer.getTileAt(xCoord, yCoord);
                if (tile && tile.properties && tile.properties.collides) {
                    console.info("Collision");
                    return true; // Collision detected
                }
            }
            
            return false; // No collision
        } else {
            return false;
        }
    }
}