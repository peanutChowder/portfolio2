import Phaser from 'phaser';
import { Boat } from './Boat';
import InteractionArea from './InteractionArea';

// import map & map tiles
import mapJSON from '../assets/world2/world2.json';
import tileset256x256Cubes from '../assets/world2/256x256 Cubes.png';
import tileset256x192Tiles from '../assets/world2/256x192 Tiles.png'
import tileset256x512Trees from '../assets/world2/256x512 Trees.png'
import tileset256x128TileOverlays from '../assets/world2/256x128 Tile Overlays.png'
import fishingRod from '../assets/fishing/rod.jpg'

import { ArrowIndicator } from './ArrowIndicator';
import { VirtualJoystick } from './VirtualJoystick';
import { FireworkManager } from './Fireworks';
import { MapSystem } from './MapSystem';

const fontSize = "80px";
const fontColor = "#ffffff"
const fontFamilies = {
    "header": "Arial",
    "body": ""
}

const debugMode = true;
const debugSpawn = { x: 12441, y: 16104 }

const arrowIndicatorsEnabled = false;

export default class IsometricScene extends Phaser.Scene {
    public map!: Phaser.Tilemaps.Tilemap;
    private boat!: Boat;

    private static readonly SPAWN_COORDS = debugMode ? debugSpawn : { x: 15500, y: 12271 }

    // Collide-able layers + Boat
    private collisionLayers: Phaser.Tilemaps.TilemapLayer[];
    private collisionLayerNames: string[];
    private collisionBodies: Phaser.GameObjects.Rectangle[] = [];  // Add this

    // Interaction Area and Overlay attributes 
    private overlayElement: HTMLElement | null = null;
    private gameOverlayElement: HTMLDivElement | null = null;
    private interactionAreas: { [key: string]: InteractionArea } = {};

    // Arrows for pointing towards interaction areas
    private arrowIndicators: { [key: string]: ArrowIndicator } = {};

    // joystick for mobile users
    private joystick!: VirtualJoystick;
    public isMobileDevice!: boolean;

    // Boundary fog 
    private static readonly FOG_COLOR = "#bdbdbd";
    private static readonly FOG_DEPTH = 20; // num tiles fog extends to
    private static readonly FOG_MIN_ALPHA = 0; // alpha for fog edge
    private static readonly FOG_MAX_ALPHA = 1; // alpha for fog start
    private oceanLayer: Phaser.Tilemaps.TilemapLayer | null = null;
    
    // Lost boat handling
    private static readonly LOST_THRESHOLD = 25; // How many tiles off map before "lost" effect
    private lostText!: Phaser.GameObjects.Text;
    private lostOverlay!: Phaser.GameObjects.Rectangle;
    private isHandlingLostBoat: boolean = false;

    private fireworkManager!: FireworkManager

    private mapSystem!: MapSystem;

    private fishingButton!: HTMLDivElement | null;

    // Debug text attributes
    private debugText!: Phaser.GameObjects.Text;
    private clickCoords: { worldX: number, worldY: number, tileX: number, tileY: number } | null = null;

    constructor() {
        super({
            key: 'IsometricScene',
            physics: {
                arcade: {
                    debug: false
                }
            }
        });
        this.collisionLayers = [];
        this.collisionLayerNames = [
            "Land 1"
        ];
    }

    preload(): void {
        this.isMobileDevice = this.sys.game.device.os.android || this.sys.game.device.os.iOS

        this.fireworkManager = new FireworkManager(this);

        this.load.image('256x256 Cubes', tileset256x256Cubes);
        this.load.image('256x192 Tiles', tileset256x192Tiles);
        this.load.image('256x512 Trees', tileset256x512Trees);
        this.load.image('256x128 Tile Overlays', tileset256x128TileOverlays);
        this.load.tilemapTiledJSON('map', mapJSON);

        // Load boat sprites
        Boat.preload(this);

        this.load.on('loaderror', (file: Phaser.Loader.File) => {
            console.error('Error loading file:', file.key);
            console.error('File type:', file.type);
            console.error('File url:', file.url);
        });

        // Load all overlays
        this.load.html('owOverlay', 'owOverlay.html');
        // projects
        this.load.html('ffOverlay', 'ffOverlay.html');
        this.load.html('icOverlay', 'icOverlay.html');
        this.load.html('abOverlay', 'abOverlay.html');
        this.load.html('cpOverlay', 'cpOverlay.html');
        this.load.html('imOverlay', 'imOverlay.html');

        this.load.html('educationOverlay', 'edOverlay.html');
        this.load.html('experienceOverlay-Apple', 'expAppleOverlay.html');
        this.load.html('experienceOverlay-Teck', 'expTeckOverlay.html');
        this.load.html('experienceOverlay-UAlberta', 'expUAlbertaOverlay.html');
        this.load.html('welcomeOverlay', 'welcomeOverlay.html');

        this.load.html('fish-punch', 'game-overlays/fishPunch.html');

        // load firework animations
        this.fireworkManager.preload()

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


            console.group("Adding map layers");

            // Add map layers. We do this in code sections to ensure certain elements are rendered beneath others,
            // e.g. InteractionArea circles should be between layer 0 (ocean) and layer 1 (lowest land layer)
            // ------------------------------------------------------------------------
            // Draw the lowest layer, ocean
            const layers: Phaser.Tilemaps.TilemapLayer[] = [];
            let layerNum = 0
            let layer = this.map.createLayer(layerNum, tilesets, 0, 0);
            if (layer) {
                layers[layerNum] = layer;
                console.log(`Added layer '${layer.layer.name}'`);

                if (layer.layer.name == "Ocean") {
                    this.oceanLayer = layer;
                }
            } else {
                console.error(`Error getting layer number '${layerNum}'`);
            }

            // Draw our interaction zones marked by an ellipse.
            // Interaction zones are areas where users can activate an overlay to see embedded content.
            this.setupInteractiveAreas();

            // Draw layer 2 (layer number 1), the lowest land layer
            layerNum = 1
            layer = this.map.createLayer(layerNum, tilesets, 0, 0);
            if (layer) {
                layers[layerNum] = layer;
                if (this.collisionLayerNames.includes(layer.layer.name)) {
                    this.collisionLayers.push(layer);

                    // Set up isometric collisions
                    layer.forEachTile(tile => {
                        if (tile.index !== -1) {  // If not an empty tile
                            const tileWidth = this.map.tileWidth;
                            const tileHeight = this.map.tileHeight * 2;
                            const worldX = tile.pixelX + (tileWidth / 2);
                            const worldY = tile.pixelY + (tileHeight / 2);

                            // Create approx. rectangular hitbox for each tile
                            const collisionBody = this.add.rectangle(
                                worldX,
                                worldY,
                                tileWidth,
                                tileHeight
                            );

                            this.physics.add.existing(collisionBody, true);
                            this.collisionBodies.push(collisionBody);
                        }
                    });
                }
            }


            // Create and draw boat
            this.boat = new Boat(
                this,
                IsometricScene.SPAWN_COORDS.x, IsometricScene.SPAWN_COORDS.y,
                this.interactionAreas
            );
            this.add.existing(this.boat)
            console.log("Added boat")


            // Add remaining layers
            for (let i = 2; i < this.map.layers.length; i++) {
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
            // End of map and element drawing
            // ------------------------------------------------------------------------

            // Create firework animations
            this.fireworkManager.create()

            // Create fog at map boundaries
            this.cameras.main.setBackgroundColor(IsometricScene.FOG_COLOR)
            this.initFog();

            // Add colliders between collision layers and the boat
            this.collisionBodies.forEach(body => {
                this.physics.add.collider(this.boat, body);
            });


            const worldWidth = this.map.widthInPixels;
            const worldHeight = this.map.heightInPixels;


            this.cameras.main.setZoom(0.2);
            this.cameras.main.centerOn(0, 500);

            // Set up camera to follow the boat
            this.cameras.main.startFollow(this.boat, true);

            this.mapSystem = new MapSystem(this, this.interactionAreas);



            // Create a virtual joystick for non-desktop users to move the boat.
            if (this.isMobileDevice) {
                const joyStickOrigin = { x: this.cameras.main.centerX, y: this.cameras.main.centerY * 4 };
                this.joystick = new VirtualJoystick(this, joyStickOrigin.x, joyStickOrigin.y, 300, 100);
                this.boat.setJoystickDirectionGetter(() => this.joystick.getDirection())
            }

            if (debugMode) {
                // Add debug info
                this.add.text(10, 10, `Map dimensions: ${worldWidth}x${worldHeight}`, { color: fontColor, font: fontSize });
                this.add.text(10, 80, `Tile dimensions: ${this.map.tileWidth}x${this.map.tileHeight}`, { color: fontColor, font: fontSize });
                this.add.text(10, 150, `Mobile?: ${this.isMobileDevice}`, { color: fontColor, font: fontSize })

                // Log map information
                console.group("Map info")
                console.log('Map dimensions:', worldWidth, 'x', worldHeight);
                console.log('Tile dimensions:', this.map.tileWidth, 'x', this.map.tileHeight);
                console.log('Number of layers:', this.map.layers.length);
                console.groupEnd()

                // Set up debugging tool
                this.setupDebuggingTool();
            }
        } catch (error) {
            console.error('Error in create function:', error);
        }

        console.groupEnd();
    }

    private setupInteractiveAreas(): void {
        const workMarkerInfo = {
            color: 0x9028f7,
            radius: 40,
            locationType: "Work"
        }

        const projectMarkerInfo = {
            color: 0x134aba,
            radius: 40,
            locationType: "Projects"
        }

        this.interactionAreas["experience-Apple"] = new InteractionArea(
            this,
            10000, 8963,
            3900, 2000,
            "Apple",
            "experienceOverlay-Apple",
            0xaa9cff,
            0xc4baff,
            {
                text: "Click for my time at Apple",
                font: fontFamilies["header"],
                fontColor: "#ffffff",
                color: 0xaa9cff,
                hoverColor: 0x9887fa
            },
            {
                text: "Software Engineer Intern\n        @ Apple",
                color: "#7340f5",
                font: fontFamilies["header"],
                fontSize: "220px",
                offset: {
                    x: -0, y: -1200
                }
            },
            workMarkerInfo
        )

        this.interactionAreas["experience-Teck"] = new InteractionArea(
            this,
            15600, 15800,
            4100, 2300,
            "Teck",
            "experienceOverlay-Teck",
            0x266dc9,
            0x70a3e6,
            {
                text: "Click for my time at Teck",
                font: fontFamilies["header"],
                fontColor: "#ffffff",
                color: 0x266dc9,
                hoverColor: 0x1960bd
            },
            {
                text: "Wireless Engineer Co-op\n        @ Teck",
                color: "#1960bd",
                font: fontFamilies["header"],
                fontSize: "220px",
                offset: {
                    x: -0, y: -1000
                }
            },
            workMarkerInfo
        )

        this.interactionAreas["experience-UAlberta"] = new InteractionArea(
            this,
            -2064, 16620,
            4100, 2300,
            "UAlberta",
            "experienceOverlay-UAlberta",
            0x21570a,
            0x688c58,
            {
                text: "Click for my time at UAlberta",
                font: fontFamilies["header"],
                fontColor: "#ffffff",
                color: 0x21570a,
                hoverColor: 0x2d6e10
            },
            {
                text: "Data Analyst Co-op\n    @ UAlberta",
                color: "#21570a",
                font: fontFamilies["header"],
                fontSize: "220px",
                offset: {
                    x: -0, y: -1000
                }
            },
            workMarkerInfo
        )

        this.interactionAreas["education"] = new InteractionArea(
            this,
            8689, 13200,
            3600, 2700,
            "Education",
            "educationOverlay",
            0x21570a,
            0x688c58,
            {
                text: "Click to see my Education",
                font: fontFamilies["header"],
                fontColor: "#ffffff",
                color: 0x21570a,
                hoverColor: 0x2d6e10
            },
            {
                text: "Education: UAlberta",
                color: "#21570a",
                font: fontFamilies["header"],
                fontSize: "220px",
                offset: {
                    x: -0, y: -1420
                }
            },
            {
                color: 0x114a19,
                radius: 40,
                locationType: "Education"
            }
        )

        this.interactionAreas["olympicWeightlifting"] = new InteractionArea(
            this,
            7780, 6061,
            2700, 1700,
            "Olympic\nWeightlifting",
            "owOverlay",
            0x145b66,
            0x43a6b5,
            {
                text: "Click to see Olympic\nWeightlifting Content",
                font: fontFamilies["header"],
                fontColor: "#ffffff",
                color: 0x145b66,
                hoverColor: 0x208999
            },
            {
                text: "Olympic Weightlifting",
                color: "#145b66",
                font: fontFamilies["header"],
                fontSize: "130px",
                offset: {
                    x: 0, y: -600
                }
            },
            {
                color: 0xdbaf1f,
                radius: 40,
                locationType: "Oly-Lifting"
            }
        )

        this.interactionAreas["formFitness"] = new InteractionArea(
            this,
            11390, 16569,
            3400, 2000,
            "iOS App",
            "ffOverlay",
            0xffa405,
            0xffdb9c,
            {
                text: "Click to see FormFitness",
                font: fontFamilies["header"],
                fontColor: "#ffffff",
                color: 0xa38b48,
                hoverColor: 0xb89944
            },
            {
                text: "FormFitness",
                color: "#9e4a09",
                font: fontFamilies["header"],
                fontSize: "130px",
                offset: {
                    x: 0, y: 100
                }
            },
            projectMarkerInfo,
            undefined,
            "fishing",
            "fish-punch"
        )

        this.interactionAreas["imageCaptioner"] = new InteractionArea(
            this,
            1021, 21472,
            3400, 2000,
            "Image Captioner",
            "icOverlay",
            0x03b1fc,
            0x2ad9f7,
            {
                text: "Click to see Image Captioner",
                font: fontFamilies["header"],
                fontColor: "#ffffff",
                color: 0x03b1fc,
                hoverColor: 0x2ad9f7
            },
            {
                text: "Image Captioner",
                color: "#0a34a8",
                font: fontFamilies["header"],
                fontSize: "130px",
                offset: {
                    x: 0, y: -800
                }
            },
            projectMarkerInfo
        )

        this.interactionAreas["aiAsteroids"] = new InteractionArea(
            this,
            5378, 14325,
            3400, 2000,
            "Asteroids Bot",
            "abOverlay",
            0x2019e3,
            0x7672e8,
            {
                text: "Click to see AI Asteroids Bot",
                font: fontFamilies["header"],
                fontColor: "#ffffff",
                color: 0x7672e8,
                hoverColor: 0x9894f7
            },
            {
                text: "Asteroids Bot",
                color: "#38375c",
                font: fontFamilies["header"],
                fontSize: "130px",
                offset: {
                    x: 0, y: -900
                }
            },
            projectMarkerInfo
        )

        this.interactionAreas["concurrentCLI"] = new InteractionArea(
            this,
            -7178, 15667,
            3400, 2000,
            "Concurrent Processes",
            "cpOverlay",
            0x063580,
            0x1e66d9,
            {
                text: "Click to see Concurrent\nProcess Manager",
                font: fontFamilies["header"],
                fontColor: "#ffffff",
                color: 0x063580,
                hoverColor: 0x1e66d9
            },
            {
                text: "Concurrent Process\n      Manager",
                color: "#38375c",
                font: fontFamilies["header"],
                fontSize: "130px",
                offset: {
                    x: 0, y: -600
                }
            },
            projectMarkerInfo
        )

        this.interactionAreas["inventoryManager"] = new InteractionArea(
            this,
            3771, 9288,
            3400, 2000,
            "Inventory Manager",
            "imOverlay",
            0x0fd47b,
            0x69f5cb,
            {
                text: "Click to see Inventory Manager",
                font: fontFamilies["header"],
                fontColor: "#ffffff",
                color: 0x1b8c59,
                hoverColor: 0x0fd47b
            },
            {
                text: "Inventory Manager\n    [Android]",
                color: "#2a473a",
                font: fontFamilies["header"],
                fontSize: "130px",
                offset: {
                    x: 0, y: -1000
                }
            },
            projectMarkerInfo
        )

        this.interactionAreas["welcome"] = new InteractionArea(
            this,
            15510, 12315,
            4100, 2300,
            "Welcome",
            "welcomeOverlay",
            0x1689f5,
            0x34b4eb,
            {
                text: "How to play?",
                font: fontFamilies["header"],
                fontColor: "#ffffff",
                color: 0x1689f5,
                hoverColor: 0x34b4eb
            }
        )

        this.interactionAreas["fireworks"] = new InteractionArea(
            this,
            -7159, 19045,
            3000, 1500,
            "",
            "",
            0xa361fa,
            0xc89eff,
            {
                text: "Click me!",
                font: fontFamilies["header"],
                fontColor: "#ffffff",
                color: 0xa361fa,
                hoverColor: 0xc89eff
            },
            undefined,
            undefined,
            () => {this.fireworkManager.createFireworkDisplay(-7159, 19045)}
        )


        if (arrowIndicatorsEnabled) {
            // Create arrow indicators for each interaction area
            let arrowRadius;
            if (this.game.device.os.desktop) {
                arrowRadius = 2000;
            } else {
                arrowRadius = 900;
            }
            Object.entries(this.interactionAreas).forEach(([key, area]) => {
                const { x, y } = area.getCenter();
                this.arrowIndicators[key] = new ArrowIndicator(
                    this,
                    x,
                    y,
                    area.getName(),
                    fontFamilies,
                    {
                        arrowSize: 80,
                        textSize: 120,
                        arrowColor: 0xffffff,
                        textColor: '#ffffff',
                        radius: arrowRadius // Distance from boat to arrow
                    });
            });
        }


        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-X', this.handleXKeyPress, this);
        } else {
            console.error("Error: Could not add 'x' key listener")
        }
    }

    update(): void {
        this.boat.update();
        const { x: boatX, y: boatY } = this.boat.getPosition();

        if (this.mapSystem) {
            this.mapSystem.updateBoatMarker(boatX, boatY, this.boat.getOrientation());
        }

        if (arrowIndicatorsEnabled) {
            // Update arrow indicators
            Object.entries(this.interactionAreas).forEach(([key, area]) => {
                const { x: areaX, y: areaY } = area.getCenter();
                const distance = Phaser.Math.Distance.Between(boatX, boatY, areaX, areaY);
                const distanceInTiles = distance / this.map.tileWidth;

                if (area.containsPoint(boatX, boatY, 3)) {
                    this.arrowIndicators[key].setVisible(false);
                } else {
                    this.arrowIndicators[key].setVisible(true);
                    this.arrowIndicators[key].update(
                        boatX, boatY,
                        distanceInTiles
                    );
                }
            });
        }


        const tileCoords = this.map.worldToTileXY(boatX, boatY);

        if (tileCoords) {
            const distanceFromLeft = tileCoords.x;
            const distanceFromRight = this.map.width - tileCoords.x - 1;
            const distanceFromTop = tileCoords.y;
            const distanceFromBottom = this.map.height - tileCoords.y - 1;

            if (distanceFromLeft < -IsometricScene.LOST_THRESHOLD ||
                distanceFromRight < -IsometricScene.LOST_THRESHOLD ||
                distanceFromTop < -IsometricScene.LOST_THRESHOLD ||
                distanceFromBottom < -IsometricScene.LOST_THRESHOLD) {
                this.showLostBoatOverlay();
            }
        }


        // Update debug text with boat coordinates
        if (debugMode) {
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

    private initFog(): void {
        if (!this.oceanLayer) return;

        const mapWidth = this.map.width;
        const mapHeight = this.map.height;

        // Loop through all tiles in the ocean layer
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const tile = this.oceanLayer.getTileAt(x, y);
                if (!tile) continue;

                // Calculate distance from edge
                const distanceFromLeft = x;
                const distanceFromRight = mapWidth - x - 1;
                const distanceFromTop = y;
                const distanceFromBottom = mapHeight - y - 1;

                // Get minimum distance from any edge
                const minDistance = Math.min(
                    distanceFromLeft,
                    distanceFromRight,
                    distanceFromTop,
                    distanceFromBottom
                );

                // Calculate alpha based on distance
                let alpha;
                if (minDistance >= IsometricScene.FOG_DEPTH) {
                    alpha = IsometricScene.FOG_MAX_ALPHA;
                } else {
                    // Linear interpolation from MIN_ALPHA to MAX_ALPHA
                    alpha = IsometricScene.FOG_MIN_ALPHA +
                        (minDistance / IsometricScene.FOG_DEPTH) *
                        (IsometricScene.FOG_MAX_ALPHA - IsometricScene.FOG_MIN_ALPHA);
                }

                // Apply alpha to the tile
                tile.setAlpha(alpha);
            }
        }
    }

    public calcBoatFog(worldX: number, worldY: number): number {
        // Convert world coordinates to tile coordinates
        const tileCoords = this.map.worldToTileXY(worldX, worldY);
        if (!tileCoords) return 1;

        const mapWidth = this.map.width;
        const mapHeight = this.map.height;

        // Calculate distance from edges in tile units
        const distanceFromLeft = tileCoords.x;
        const distanceFromRight = mapWidth - tileCoords.x - 1;
        const distanceFromTop = tileCoords.y;
        const distanceFromBottom = mapHeight - tileCoords.y - 1;

        // Get minimum distance from any edge
        const minDistance = Math.min(
            distanceFromLeft,
            distanceFromRight,
            distanceFromTop,
            distanceFromBottom
        );

        // Calculate alpha based on distance
        if (minDistance >= IsometricScene.FOG_DEPTH) {
            return IsometricScene.FOG_MAX_ALPHA;
        } else {
            return IsometricScene.FOG_MIN_ALPHA +
                (minDistance / IsometricScene.FOG_DEPTH) *
                (IsometricScene.FOG_MAX_ALPHA - IsometricScene.FOG_MIN_ALPHA);
        }
    }

    private async showLostBoatOverlay(): Promise<void> {
        if (this.isHandlingLostBoat) return;
        this.isHandlingLostBoat = true;

        const displayWidth = this.cameras.main.width / this.cameras.main.zoom;
        const displayHeight = this.cameras.main.height / this.cameras.main.zoom;

        // Create full-screen grey overlay matching fog color
        this.lostOverlay = this.add.rectangle(
            -displayWidth / 2,
            -displayHeight / 2,
            displayWidth * 2,
            displayHeight * 2,
            parseInt(IsometricScene.FOG_COLOR.replace('#', '0x')),
            1
        );
        this.lostOverlay.setScrollFactor(0);
        this.lostOverlay.setDepth(1000);
        this.lostOverlay.setAlpha(0);
        this.lostOverlay.setOrigin(0)

        // Add centered text
        this.lostText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            "Looks like you got lost...",
            {
                font: fontSize,
                color: fontColor,
                align: 'center'
            }
        );
        this.lostText.setOrigin(0.5);
        this.lostText.setScrollFactor(0);
        this.lostText.setDepth(1001);
        this.lostText.setAlpha(0);

        // Fade in overlay and text
        this.tweens.add({
            targets: [this.lostOverlay, this.lostText],
            alpha: 1,
            duration: 1000,
            onComplete: () => {
                // Teleport boat after fade in
                this.boat.setPosition(IsometricScene.SPAWN_COORDS.x, IsometricScene.SPAWN_COORDS.y); // Example coordinates

                // Wait a moment, then fade out
                this.time.delayedCall(2000, () => {
                    this.tweens.add({
                        targets: [this.lostOverlay, this.lostText],
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => {
                            this.lostOverlay.destroy();
                            this.lostText.destroy();
                            this.isHandlingLostBoat = false;
                        }
                    });
                });
            }
        });
    }

    private setupDebuggingTool(): void {
        // Add a text object to display coordinates
        this.debugText = this.add.text(10, 10, '', { color: fontColor, font: fontSize });
        this.debugText.setScrollFactor(0); // Make the text stay in the same position relative to the camera

        // Add a keyboard event to toggle debug mode
        if (debugMode) {
            const { x: worldX, y: worldY } = this.boat.getPosition();
            const tileCoords = this.map.worldToTileXY(worldX, worldY);
            if (tileCoords) {
                this.updateDebugText(worldX, worldY, tileCoords.x, tileCoords.y);
            }
        }

        // Add click event listener
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (debugMode) {
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

    public checkCollision(x: number, y: number, hitboxRadius: number): boolean {
        // Convert the boat's center position to tile coordinates
        const centerTile = this.map.worldToTileXY(x, y);
        if (!centerTile) return false;

        // Calculate the number of tiles to check in each direction
        const tileRadius = Math.ceil(hitboxRadius / this.map.tileWidth);

        // Check all tiles within the circular area
        for (let offsetX = -tileRadius; offsetX <= tileRadius; offsetX++) {
            for (let offsetY = -tileRadius; offsetY <= tileRadius; offsetY++) {
                const tileX = Math.floor(centerTile.x + offsetX);
                const tileY = Math.floor(centerTile.y + offsetY);

                // Calculate the distance from the center of the boat to the center of this tile
                const tileCenter = this.map.tileToWorldXY(tileX, tileY);
                if (!tileCenter) continue;

                const distanceX = tileCenter.x + this.map.tileWidth / 2 - x;
                const distanceY = tileCenter.y + this.map.tileHeight / 2 - y;
                const distanceSquared = distanceX * distanceX + distanceY * distanceY;

                // Check if this tile is within the circular hitbox
                if (distanceSquared <= hitboxRadius * hitboxRadius) {
                    // Check if any collision layer has a collidable tile at this position
                    for (const layer of this.collisionLayers) {
                        const tile = layer.getTileAt(tileX, tileY);
                        if (tile) {
                            console.info("Collision at", x, y, "with tile", tileX, tileY);
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    // @ts-ignore
    private showOverlay(
        overlayHtmlKey: string,
        areaType: string,
        gameOverlayName: string
    ): void {
        // Toggle overlay (destroy it) if it is currently shown
        if (this.overlayElement) {
            this.destroyOverlayWithAnimation(overlayHtmlKey);
            return;
        }
    
        console.group("Creating overlay");
    
        // Load HTML content
        const htmlContent = this.cache.html.get(overlayHtmlKey);

        if (!htmlContent) {
            console.error(`Failed to load overlay content '${overlayHtmlKey}'`);
            console.groupEnd();
            return;
        }
    
        // Create wrapper
        const htmlWrapper = document.createElement('div');
        htmlWrapper.innerHTML = htmlContent;
    
        // Position the overlay to the center of the screen
        htmlWrapper.style.position = 'fixed';
        htmlWrapper.style.top = '0';
        htmlWrapper.style.left = '0';
        htmlWrapper.style.width = '100vw';
        htmlWrapper.style.height = '100vh';
        htmlWrapper.style.zIndex = '100';
        htmlWrapper.style.display = 'flex';
        htmlWrapper.style.justifyContent = 'center';
        htmlWrapper.style.alignItems = 'center';
    
        // Append to the actual document body
        document.body.appendChild(htmlWrapper);
    
        // Save a reference so we can remove it later
        this.overlayElement = htmlWrapper;
    
        // Find the close button in the overlay HTML
        const closeButton = htmlWrapper.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () =>
                this.destroyOverlayWithAnimation(overlayHtmlKey)
            );
        } else {
            console.error("Close button not found in overlay");
        }
    
        console.groupEnd();
    
        // Fade in effect (optional)
        htmlWrapper.style.opacity = '0';
        htmlWrapper.style.transition = 'opacity 0.5s ease-in-out';
        setTimeout(() => {
            htmlWrapper.style.opacity = '1';
        }, 50);
    
        if (!this.fishingButton && areaType === "fishing") {
            this.fishingButton = document.createElement('div');
            this.fishingButton.style.position = 'fixed';
            this.fishingButton.id = 'fishing-button';
        
            // Desktop vs. mobile sizing
            if (this.game.device.os.desktop) {
                this.fishingButton.style.top = '10vh';
                this.fishingButton.style.left = '5vh';
                this.fishingButton.style.width = '20vh'; 
                this.fishingButton.style.height = '20vh';
            } else {
                this.fishingButton.style.bottom = '10px';
                this.fishingButton.style.right = '10px';
                this.fishingButton.style.width = '100px'; 
                this.fishingButton.style.height = '100px';
            }
        
            // The rest of your fishing button styling
            this.fishingButton.style.borderRadius = '50%';
            this.fishingButton.style.border = '4px solid #8df7f6';
            this.fishingButton.style.backgroundColor = '#fff'; 
            this.fishingButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            this.fishingButton.style.cursor = 'pointer';
            this.fishingButton.style.zIndex = '1100';
            this.fishingButton.style.display = 'flex';
            this.fishingButton.style.justifyContent = 'center';
            this.fishingButton.style.alignItems = 'center';
        
            this.fishingButton.style.opacity = '0';
            this.fishingButton.style.transition = 'opacity 0.5s ease-in-out';
        
            const styleTag = document.createElement('style');
            styleTag.innerHTML = `
                #fishing-button:hover {
                    transform: scale(1.3);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
                    transition: transform 2s ease, box-shadow 2s ease;
                }
            `;
            document.head.appendChild(styleTag);
        
            // The rod image inside the button
            const fishingRodImg = document.createElement('img');
            fishingRodImg.src = fishingRod;
            fishingRodImg.alt = 'Fishing Rod';
            fishingRodImg.style.width = '60%';
            fishingRodImg.style.height = '60%';
            fishingRodImg.style.objectFit = 'contain';
            fishingRodImg.style.opacity = '0';
            fishingRodImg.style.transition = 'opacity 0.5s ease-in-out';
        
            this.fishingButton.appendChild(fishingRodImg);
            document.body.appendChild(this.fishingButton);
        
            // Fade in the rod
            this.time.delayedCall(0, () => {
                if (fishingRodImg) {
                    fishingRodImg.style.opacity = '1';
                }
            });
        
            this.time.delayedCall(500, () => {
                if (this.fishingButton) {
                    this.fishingButton.style.opacity = '1';
                }
            });
        
            // If the button is clicked, launch the mini-game or overlay
            this.fishingButton.addEventListener('click', () => {
                console.log(`Fishing rod button clicked! ${gameOverlayName}`);
                this.showGameOverlay(gameOverlayName);
            });
        }
    }
    
    

    private destroyOverlayWithAnimation(overlayHtmlKey: string): void {
        if (this.overlayElement) {
            // Fade out
            this.overlayElement.style.opacity = '1'; // ensure it's visible
            this.overlayElement.style.transition = 'opacity 0.5s ease-in-out';
            this.overlayElement.style.opacity = '0';
    
            // After fade, remove from body
            setTimeout(() => {
                if (this.overlayElement && this.overlayElement.parentNode) {
                    this.overlayElement.parentNode.removeChild(this.overlayElement);
                }
                this.overlayElement = null;
    
                // Also remove fishing button if needed
                if (this.fishingButton) {
                    this.fishingButton.remove();
                    this.fishingButton = null;
                }
            }, 500);
        } else {
            console.warn("No overlay destroyed: currently null");
        }
    
        // Re-enable the button if needed
        const interactionArea = Object.values(this.interactionAreas).find(
            child => child["overlayName"] === overlayHtmlKey
        );
        if (interactionArea) {
            interactionArea.setIgnoreButtonClick(false);
        } else {
            console.error(
                `Could not re-enable button after overlay ${overlayHtmlKey} closed.`
            );
        }
    }
    
    

    private handleXKeyPress(): void {
        Object.values(this.interactionAreas).forEach(area => area.handleInteraction());
    }

    private showGameOverlay(gameOverlayName: string): void {
        // If there's an existing game overlay, remove it
        if (this.gameOverlayElement) {
            this.destroyGameOverlay(gameOverlayName); // or a dedicated destroy function
            return;
        }
    
        console.group(`Creating game overlay: ${gameOverlayName}`);
    
        // 1) Grab the HTML from the Phaser cache
        const htmlContent = this.cache.html.get(gameOverlayName);
        if (!htmlContent) {
            console.error(`Failed to load game overlay content '${gameOverlayName}'`);
            console.groupEnd();
            return;
        }
    
        // 2) Create a <div> wrapper for full-browser coverage
        const wrapper = document.createElement('div');
        wrapper.innerHTML = htmlContent;
    
        // (A) Position it to fill entire screen
        wrapper.style.position = 'fixed';
        wrapper.style.top = '0';
        wrapper.style.left = '0';
        wrapper.style.width = '100vw';
        wrapper.style.height = '100vh';
        wrapper.style.zIndex = '9999';
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = 'center';
        wrapper.style.alignItems = 'center';
    
        // 3) Append to the actual DOM
        document.body.appendChild(wrapper);
    
        // 4) Keep a reference so we can remove it later
        this.gameOverlayElement = wrapper;
    
        // 5) Set up fade in
        wrapper.style.opacity = '0';
        wrapper.style.transition = 'opacity 0.5s ease-in-out';
        setTimeout(() => {
            wrapper.style.opacity = '1';
        }, 50);
    
        // 6) Handle the close button
        const closeButton = wrapper.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () =>
                this.destroyGameOverlay(gameOverlayName)
            );
        } else {
            console.error('Close button not found in game overlay');
        }
    
        console.groupEnd();
    }

    private destroyGameOverlay(gameOverlayName: string): void {
        if (this.gameOverlayElement) {
            // Fade out
            this.gameOverlayElement.style.opacity = '1'; 
            this.gameOverlayElement.style.transition = 'opacity 0.5s ease-in-out';
            this.gameOverlayElement.style.opacity = '0';
    
            // Remove from the DOM after fade
            setTimeout(() => {
                if (this.gameOverlayElement && this.gameOverlayElement.parentNode) {
                    this.gameOverlayElement.parentNode.removeChild(this.gameOverlayElement);
                }
                this.gameOverlayElement = null;
            }, 500);
        } else {
            console.warn("No game overlay to destroy.");
        }
    }
    
    
}