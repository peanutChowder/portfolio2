import Phaser from 'phaser';
import { Boat } from './Boat';

// import map & map tiles
import mapJSON from '../assets/world2/world2.json';
import tileset256x256Cubes from '../assets/world2/256x256 Cubes.png';
import tileset256x192Tiles from '../assets/world2/256x192 Tiles.png'
import tileset256x512Trees from '../assets/world2/256x512 Trees.png'
import tileset256x128TileOverlays from '../assets/world2/256x128 Tile Overlays.png'

// import boat sprites
import boatNorthEastPNG from '../assets/boat/boatNE.png';
import boatNorthWestPNG from '../assets/boat/boatNW.png';
import boatSouthEastPNG from '../assets/boat/boatSE.png';
import boatSouthWestPNG from '../assets/boat/boatSW.png';

const fontSize = "80px";
const fontColor = "#ffffff"

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
            "Land 1"
        ];
        this.debugMode = false;
    }

    preload(): void {
        this.load.image('256x256 Cubes', tileset256x256Cubes);
        this.load.image('256x192 Tiles' ,tileset256x192Tiles);
        this.load.image('256x512 Trees', tileset256x512Trees);
        this.load.image('256x128 Tile Overlays', tileset256x128TileOverlays);
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
        const tilesetNames = [
            "256x256 Cubes",
            "256x192 Tiles",
            "256x512 Trees",
            "256x128 Tile Overlays"
        ]
        try {
            this.map = this.make.tilemap({ key: 'map' });
            let tilesets: Phaser.Tilemaps.Tileset[] = []

            tilesetNames.forEach((tilesetName) => {
                const res = this.map.addTilesetImage(tilesetName, tilesetName)

                if (res) {
                    tilesets.push(res)
                } else {
                    console.error(`Error: Failed to load tileset '${tilesetName}'`)
                }
            })
    
            // Add first group of layers. 
            // We add this first because it should appear under the boat on the Z-axis.
            console.group("Adding map layers");
            const layers: Phaser.Tilemaps.TilemapLayer[] = [];
            for (let i = 0; i < 3; i++) {
                const layer = this.map.createLayer(i, tilesets, 0, 0);
                if (layer) {
                    layers[i] = layer;
                    if (this.collisionLayerNames.includes(layer.layer.name)) {
                        this.collisionLayers.push(layer);
                        layer.setCollisionByProperty({ collides: true });
                    }
                    console.log(`Added layer '${layer.layer.name}'`);
                } else {
                    console.error(`Error getting layer number '${i}'`);
                }
            }

            // Create the boat
            this.boat = new Boat(this, 500, 6400);
            console.log("Added boat")

            // Add second group of layers.
            // We add this after the boat so that these elements are displayed over the boat in the Z-axis
            for (let i = 3; i < this.map.layers.length; i++) {
                const layer = this.map.createLayer(i, tilesets, 0, 0);
                if (layer) {
                    layers[i] = layer;
                    if (this.collisionLayerNames.includes(layer.layer.name)) {
                        this.collisionLayers.push(layer);
                        layer.setCollisionByProperty({ collides: true });
                    }
                    console.log(`Added layer '${layer.layer.name}'`);
                } else {
                    console.error(`Error getting layer number '${i}'`);
                }
            }
            console.groupEnd();

            const worldWidth = this.map.widthInPixels;
            const worldHeight = this.map.heightInPixels;

            this.cameras.main.setZoom(0.2);
            this.cameras.main.centerOn(0, 500);

            // Add debug info
            this.add.text(10, 10, `Map dimensions: ${worldWidth}x${worldHeight}`, { color: fontColor, font: fontSize });
            this.add.text(10, 80, `Tile dimensions: ${this.map.tileWidth}x${this.map.tileHeight}`, { color: fontColor, font: fontSize  });


            // Set up camera to follow the boat
            this.cameras.main.startFollow(this.boat, true);

            // Log map information
            console.log('Map dimensions:', worldWidth, 'x', worldHeight);
            console.log('Tile dimensions:', this.map.tileWidth, 'x', this.map.tileHeight);
            console.log('Number of layers:', this.map.layers.length);
            console.log('Tileset name:', tilesets.map((tileset) => {tileset}));

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
            const textX = worldX - cameraView.x - 1500;
            const textY = worldY - cameraView.y - 60; // Adjust this value to position the text above the boat
            this.debugText.setPosition(textX, textY);
        }
    }

    private setupDebuggingTool(): void {
        // Add a text object to display coordinates
        this.debugText = this.add.text(10, 10, '', { color: fontColor, font: fontSize });
        this.debugText.setScrollFactor(0); // Make the text stay in the same position relative to the camera

        // Add a keyboard event to toggle debug mode
        if (this.input.keyboard) {
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
        } else {
            console.warn("'this.input.keyboard' is undefined")
        }
        

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

    public checkCollision(x: number, y: number, hitboxTileSize: number): boolean {
        const tileCoords = this.map.worldToTileXY(x, y);
        if (tileCoords) {
            const centerX = Math.floor(tileCoords.x);
            const centerY = Math.floor(tileCoords.y);
            
            // Calculate the range of tiles to check
            const startX = centerX - hitboxTileSize;
            const endX = centerX + hitboxTileSize;
            const startY = centerY - hitboxTileSize;
            const endY = centerY + hitboxTileSize;
    
            // Check all tiles within the hitbox range
            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    for (const layer of this.collisionLayers) {
                        const tile = layer.getTileAt(x, y);
                        if (tile) {
                            console.info("Collision at", x, y);
                            return true;
                        }
                    }
                }
            }
            return false;
        } else {
            return false;
        }
    }
}