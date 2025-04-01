import Phaser from 'phaser';
import { Boat } from './Boat';

// import map & map tiles
import mapJSON from '../assets/world2/world2.json';
import tileset256x256Cubes from '../assets/world2/256x256 Cubes.png';
import tileset256x192Tiles from '../assets/world2/256x192 Tiles.png'
import tileset256x512Trees from '../assets/world2/256x512 Trees.png'
import tileset256x128TileOverlays from '../assets/world2/256x128 Tile Overlays.png'

import { INTERACTION_AREAS } from './InteractionAreaData';
import InteractionArea from './InteractionArea';
import { IslandManager } from './IslandManager'; 
import { ArrowIndicator } from './ArrowIndicator';
import { VirtualJoystick } from './VirtualJoystick';
import { FireworkManager } from './Fireworks';
import { MapSystem } from './MapSystem';
import { Inventory } from './Inventory';
import { SafehouseInventory } from './SafehouseInventory';

const fontSize = "80px";
const fontColor = "#ffffff"
const fontFamilies = {
    "header": "Arial",
    "body": ""
}

const debugMode = false;
const debugSpawn = { x: 12901, y: 15449 }

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

    // Energy bar
    private energy: number = 100; // Initial 100% energy
    private energyBar!: Phaser.GameObjects.Graphics;
    private energyBarBackground!: Phaser.GameObjects.Graphics;
    private lastBoatPosition!: { x: number; y: number };
    private energyBarX = 1000;
    private energyBarY = 1000;
    private energyBarWidth = 900;
    private energyBarHeight = 50;
    private energyBarText!: Phaser.GameObjects.Text;


    private fireworkManager!: FireworkManager

    private mapSystem!: MapSystem;

    // inventory elements
    private inventoryOverlayElement!: HTMLIFrameElement | null; // The HTML <iframe>
    private inventoryButtonColor = 0xd1b884;
    private inventoryButtonHoverColor = 0xe3cb98;
    private inventory: Inventory | null = null;

    // Safehouse storage/inventory
    private safehouseInventory!: SafehouseInventory;
    
    // Game elements manager
    private islandManager!: IslandManager;

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
        // Load minimap sprites
        MapSystem.preload(this);
        
        InteractionArea.preload(this);

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

        // Game element overlays
        this.load.html('safehouse', 'safehouseOverlay.html');
        this.load.html('fishPunch', 'game-overlays/fishPunch.html');

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
                    this.oceanLayer.setDepth(0);
                }
            } else {
                console.error(`Error getting layer number '${layerNum}'`);
            }



            // The following steps must be executed in this order because they are dependent on each other.
            // (1.) Initialize inventory, which is used by a createInteractionAreas child call method to check
            // if we need to block buttons from clicks.
            this.inventory = new Inventory(); 

            // (2.) Initialize Interaction Area objects and draw our interaction zones marked by an ellipse.
            // Interaction zones are areas where users can activate an overlay to see embedded content.
            this.createInteractionAreas();

            // (3.) Retrieve game element assignments to islands (or create if first visit)
            this.islandManager = new IslandManager(this.interactionAreas);

            // (4.) Enable glowing for interactions with an assigned Game element
            Object.values(this.interactionAreas).forEach((interactionArea: InteractionArea) => {
                interactionArea.handleGlowEffect(0);
            })

            // (5.) Disable game elements buttons in Interaction Areas that have depleted resources
            Object.values(this.interactionAreas).forEach((interactionArea: InteractionArea) => {
                if (interactionArea.getGameElementBlockers()) {
                    interactionArea.updateButtonBlockers(new Set(['depletion']));
                }
            })


            // not load order sensitive
            this.safehouseInventory = new SafehouseInventory();


            // Draw layer 2 (layer number 1), the lowest land layer
            layerNum = 1
            layer = this.map.createLayer(layerNum, tilesets, 0, 0);
            layer?.setDepth(1)
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

            // Load boat coords from last visit
            let savedPosition = localStorage.getItem('boatPosition');
            let boatCoords = savedPosition ? JSON.parse(savedPosition) : IsometricScene.SPAWN_COORDS;
            this.boat = new Boat(
                this,
                boatCoords.x, boatCoords.y,
                this.interactionAreas
            );
            this.boat.setDepth(5);
            this.add.existing(this.boat)
            console.log("Added boat")


            // Add remaining layers
            for (let i = 2; i < this.map.layers.length; i++) {
                const layer = this.map.createLayer(i, tilesets, 0, 0);
                layer?.setDepth(i);
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

            this.createEnergyBar();

            this.createInventoryButton();


            this.islandManager.assignIslandGameElements(false)

            // Set the glow effect for depletable game elements + evaluate if the user will be allowed to interact
            Object.values(this.interactionAreas).forEach((interactionArea: InteractionArea) => {
                interactionArea.evaluateGameElementBlockers();  
                interactionArea.handleGlowEffect(0);
            });
            

            // Create a virtual joystick for non-desktop users to move the boat.
            if (this.isMobileDevice) {
                const joyStickOrigin = { x: this.cameras.main.centerX, y: this.cameras.main.centerY * 4 };
                this.joystick = new VirtualJoystick(this, joyStickOrigin.x, joyStickOrigin.y, 300, 100);
                this.boat.setJoystickDirectionGetter(() => this.joystick.getDirection())
            }


            // Listen for messages within iframes for minigames and inventory
            window.addEventListener('message', (event) => {
                if (!event.data?.type) return;

                switch (event.data.type) {

                    case 'addItemToInventory': {
                        const { itemId } = event.data;
                        console.log(`Received fish from minigame: ${itemId}`);
                        if (this.inventory) {
                            this.inventory.addItem(itemId);
                        }
                        break;
                    }

                    case 'dumpItem': {
                        const { itemId } = event.data;
                        console.log(`Received request to dump item: ${itemId}`);
                        if (this.inventory) {
                            this.inventory.removeItem(itemId);
                        }
                        break;
                    }

                    case 'reduceFish': {
                        console.log("Received reduceFish event");
                    
                        // Find the active interaction area 
                        const { x, y } = this.boat.getPosition();
                        const area = Object.values(this.interactionAreas).find(area =>
                            area.containsPoint(x, y, 2) // radius = 2 tile padding
                        );
                        if (!area) {
                            console.warn("No nearby interaction area found for reduceFish");
                            break;
                        }
                    
                        const success = this.islandManager.reduceFish(area.id);
                    
                        if (success) {
                            console.log(`Fish reduced at area ${area.id}. Remaining: ${this.islandManager.getAssignments().find(a => a.id === area.id)?.resourceLeft}`);
                            
                            // Remove glow effect if resource is depleted
                            if (this.islandManager.isResourceDepleted(area.id)) {
                                console.log(`Area ${area.id} is now depleted.`);
                                area.handleGlowEffect(0);  // Remove glow effect from minigame
                                area.updateButtonBlockers(new Set(['depletion']));; // Disable button from further clicks
                            }
                        } else {
                            console.warn(`Could not reduce fish at area ${area.id}. Maybe already depleted?`);
                        }
                        
                        break;
                    }
                    

                    case 'reduceEnergy': {
                        const { amount } = event.data;
                        console.log(`Reducing energy by ${amount}`);
                        this.energy -= amount;

                        this.energy = Math.max(this.energy, 0);

                        // Save to localStorage
                        localStorage.setItem('energy', this.energy.toString());
                        break;
                    }

                    case 'rest': {
                        const iframe = document.getElementById('game-overlay-iframe');
                        console.log("iframe: ", iframe);
                        if (iframe) iframe.style.display = 'none'; // hide safehouse overlay temporarily
                    
                        const width = this.cameras.main.width / this.cameras.main.zoom;
                        const height = this.cameras.main.height / this.cameras.main.zoom;
                    
                        const blackout = this.add.rectangle(
                            this.cameras.main.centerX - width / 2,
                            this.cameras.main.centerY - height / 2,
                            width,
                            height,
                            0x000000,
                            1
                        );
                        blackout.setScrollFactor(0);
                        blackout.setDepth(999);
                        blackout.setOrigin(0);
                        blackout.alpha = 0;
                    
                        // Resting Text
                        const restingText = this.add.text(
                            this.cameras.main.centerX,
                            this.cameras.main.centerY,
                            'Resting...',
                            {
                                font: '120px Prompt',
                                color: '#ffffff',
                                align: 'center'
                            }
                        );
                        restingText.setOrigin(0.5);
                        restingText.setScrollFactor(0);
                        restingText.setDepth(100000); // must be above blackout
                        restingText.setAlpha(0);
                    
                        this.tweens.add({
                            targets: [blackout, restingText],
                            alpha: 1,
                            duration: 500,
                            onComplete: () => {
                                this.time.delayedCall(1000, () => {
                                    console.log("Resting... resetting energy to 100%");
                                    this.energy = 100;
                                    localStorage.setItem('energy', this.energy.toString());
                                    this.updateEnergyBar();
                                });
                    
                                this.time.delayedCall(2000, () => {
                                    this.tweens.add({
                                        targets: [blackout, restingText],
                                        alpha: 0,
                                        duration: 500,
                                        onComplete: () => {
                                            blackout.destroy();
                                            restingText.destroy();
                                            if (iframe) iframe.style.display = 'block';
                                        }
                                    });
                                });
                            }
                        });
                    
                        break;
                    } 

                    // transferring items in safehouse between safehouse storage <-> inventory
                    case 'transferItem': {
                        const { itemId, direction } = event.data;
                        if (direction === 'toSafehouse') {
                            this.safehouseInventory.addItem(itemId);
                            this.inventory?.removeItem(itemId);
                        } else {
                            this.inventory?.addItem(itemId);
                            this.safehouseInventory.removeItem(itemId);
                        }
                        break;
                    }
                    

                    case 'destroyInventoryOverlay': {
                        this.destroyInventoryOverlay();
                        break;
                    }

                    case 'destroyGameOverlay': {
                        let overlayName = event.data?.overlayName;
                        console.log(`Received destroyGameOverlay event for overlay: ${overlayName}`);
                        this.destroyGameOverlay(overlayName);
                        break;
                    }
                }
            });

            // Check if we need to perform random shuffling of minigames
            this.time.addEvent({
                delay: 1000, // 1s refresh
                callback: () => {
                    const reassigned = this.islandManager.assignIslandGameElements(false);
            
                    // Always recheck blockers whether reassigned or not
                    Object.values(this.interactionAreas).forEach((interactionArea: InteractionArea) => {
                        interactionArea.evaluateGameElementBlockers();
                    });
            
                    if (reassigned) {
                        Object.values(this.interactionAreas).forEach((interactionArea: InteractionArea) => {
                            interactionArea.handleGlowEffect(0);
                        });
                    }
                },
                loop: true
            });            



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

    private createEnergyBar(): void {
        const savedEnergy = localStorage.getItem('energy');
        this.energy = savedEnergy ? parseInt(savedEnergy, 10) : 100;
        this.energyBarWidth = this.mapSystem.getMinimapWidth();
        this.energyBarX = this.cameras.main.centerX + (this.cameras.main.width / (2 * this.cameras.main.zoom)) - (this.energyBarWidth * 1.025) // multiplied by some (seemingly) arbitrary constant i had to brute force lol
        this.energyBarY = this.mapSystem.getMapBottomRight().y * 0.95 // another arbitrary brute forced constant

        // Background (Gray)
        this.energyBarBackground = this.add.graphics();
        this.energyBarBackground.fillStyle(0x444444, 1);
        this.energyBarBackground.fillRect(0, 0, this.energyBarWidth, this.energyBarHeight);
        this.energyBarBackground.setScrollFactor(0); // Fix it to the screen

        // Foreground (Green)
        this.energyBar = this.add.graphics();
        this.energyBar.fillStyle(0x00ff00, 1);
        this.energyBar.fillRect(0, 0, this.energyBarWidth, this.energyBarHeight);
        this.energyBar.setScrollFactor(0); // Fix it to the screen

        // Energy bar Label
        this.energyBarText = this.add.text(this.energyBarX, this.energyBarY + this.energyBarHeight, 'Energy', {
            color: 'white',
            fontFamily: 'Prompt',
            fontSize: '80px',
        });
        this.energyBarText.setScrollFactor(0);

        // Move to correct position
        this.energyBarBackground.setPosition(this.energyBarX, this.energyBarY);
        this.energyBar.setPosition(this.energyBarX, this.energyBarY);

        // Depth
        this.energyBarBackground.setDepth(50);
        this.energyBar.setDepth(51);
        this.energyBarText.setDepth(51);

        this.lastBoatPosition = { x: this.boat.x, y: this.boat.y };
    }

    private createInventoryButton(): void {
        const buttonWidth = 900;
        const buttonHeight = 150;
        const xPos = this.energyBarX;
        const yPos = this.energyBarY * 0.75;;

        const buttonBg = this.add.graphics();
        const drawButtonBg = (color: number) => {
            buttonBg.clear();
            buttonBg.fillStyle(color, 1);
            buttonBg.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 20);
            buttonBg.lineStyle(6, 0xffffff, 1);
            buttonBg.strokeRoundedRect(0, 0, buttonWidth, buttonHeight, 20);
        };
        drawButtonBg(this.inventoryButtonColor);

        const label = this.add.text(buttonWidth / 2, buttonHeight / 2, "Inventory", {
            fontFamily: "Prompt",
            fontSize: "100px",
            color: "#ffffff",
        }).setOrigin(0.5);

        const buttonContainer = this.add.container(xPos, yPos, [buttonBg, label]);
        buttonContainer.setScrollFactor(0).setDepth(99);

        buttonContainer.setSize(buttonWidth, buttonHeight);
        buttonContainer.setInteractive(
            new Phaser.Geom.Rectangle(buttonWidth / 2, buttonHeight / 2, buttonWidth, buttonHeight),
            Phaser.Geom.Rectangle.Contains
        );

        // Hover effect
        buttonContainer.on('pointerover', () => {
            drawButtonBg(this.inventoryButtonHoverColor);
        });
        buttonContainer.on('pointerout', () => {
            drawButtonBg(this.inventoryButtonColor);
        });

        // Click handler
        buttonContainer.on('pointerdown', () => {
            this.showInventoryOverlay();
        });
    }



    private createInteractionAreas(): void {
        INTERACTION_AREAS.forEach(areaData => {
            const area = new InteractionArea(this, areaData);
    
            // Local access to IAs
            this.interactionAreas[areaData.id] = area;
        });
    
        if (arrowIndicatorsEnabled) {
            let arrowRadius = this.game.device.os.desktop ? 2000 : 900;
    
            Object.entries(this.interactionAreas).forEach(([key, area]) => {
                const { x, y } = area.getCenter();
                this.arrowIndicators[key] = new ArrowIndicator(
                    this,
                    x, y,
                    area.getName(),
                    fontFamilies,
                    {
                        arrowSize: 80,
                        textSize: 120,
                        arrowColor: 0xffffff,
                        textColor: '#ffffff',
                        radius: arrowRadius
                    }
                );
            });
        }
    
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-X', this.handleXKeyPress, this);
        } else {
            console.error("Error: Could not add 'x' key listener");
        }
    }

    update(): void {
        this.boat.update();
        const { x: boatX, y: boatY } = this.boat.getPosition();
        const distanceMoved = Phaser.Math.Distance.Between(boatX, boatY, this.lastBoatPosition.x, this.lastBoatPosition.y);

        // Save position to localStorage
        if (distanceMoved > 0) {
            this.lastBoatPosition = { x: boatX, y: boatY };

            // Save position to localStorage
            localStorage.setItem('boatPosition', JSON.stringify({ x: boatX, y: boatY }));
        }

        this.updateEnergyBar();

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

    public getFireworkManager(): FireworkManager {
        return this.fireworkManager;
    }

    public getInventory(): Inventory | null {
        return this.inventory;
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

    private updateEnergyBar(): void {
        // Clear only the green bar
        this.energyBar.clear();

        // Fill with new width based on energy level
        const newWidth = (this.energy / 100) * this.energyBarWidth;
        this.energyBar.fillStyle(0x00ff00, 1);
        this.energyBar.fillRect(0, 0, newWidth, this.energyBarHeight);

        // Update energy text
        this.energyBarText.setText(`Energy: ${this.energy}%`);
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
        _areaType: string,
        _gameOverlayName: string
    ): void {
        // Toggle overlay (destroy it) if it is currently shown
        if (this.overlayElement) {
            this.destroyOverlayWithAnimation(overlayHtmlKey);
            return;
        }

        // We check if we need to refresh the island game element
        // assignments before showing the overlay. If within a new
        // time block, we do.
        this.islandManager.assignIslandGameElements(false);

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
    // @ts-ignore
    private showGameOverlay(gameOverlayName: string): void {
        // If there's an existing overlay, remove it
        if (this.gameOverlayElement) {
            this.destroyGameOverlay(gameOverlayName);
            return;
        }

        console.group(`Creating game overlay: ${gameOverlayName}`);

        // 1) Create an iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'game-overlay-iframe';
        console.log(`../game-overlays/${gameOverlayName}/${gameOverlayName}.html`)
        iframe.src = `../game-overlays/${gameOverlayName}/${gameOverlayName}.html`;
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100vw';
        iframe.style.height = '100vh';
        iframe.style.zIndex = '9999';
        iframe.style.border = 'none';        // remove default iframe border
        iframe.allow = "accelerometer; ..."; // if your game needs special perms

        // 2) Append to DOM
        document.body.appendChild(iframe);
        this.gameOverlayElement = iframe;    // so we can remove it later

        // 3) Optional fade-in
        iframe.style.opacity = '0';
        iframe.style.transition = 'opacity 0.5s ease-in-out';
        setTimeout(() => {
            iframe.style.opacity = '1';
        }, 50);

        if (gameOverlayName === "safehouse") {
            iframe.addEventListener('load', () => {
                console.log("Sending inventory + safehouse storage to iframe");
            
                iframe.contentWindow?.postMessage({
                    type: "safehouseData",
                    safehouse: this.safehouseInventory.getDetailedStorage(),
                    inventory: this.inventory?.getDetailedInventory(),
                    safehouseMax: this.safehouseInventory.getMaxSize(),
                    inventoryMax: this.inventory?.getCurrentSize()
                }, "*");                
            });
            
        }

        console.groupEnd();
    }


    private destroyGameOverlay(_gameOverlayName: string): void {
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

    private showInventoryOverlay(): void {
        if (this.inventoryOverlayElement) {
            this.destroyInventoryOverlay();
            return;
        }

        console.group("Creating inventory overlay");

        // Create an iframe for the inventory
        const iframe = document.createElement('iframe');
        iframe.src = '../game-overlays/inventory.html';
        iframe.style.position = 'fixed';
        iframe.style.top = '50%';
        iframe.style.left = '50%';
        iframe.style.transform = 'translate(-50%, -50%)';
        iframe.style.height = '80%';
        iframe.style.border = 'none';
        iframe.style.zIndex = '9999';

        // Adjust width for mobile/desktop
        iframe.style.width = this.isMobileDevice ? '100%' : '80%';

        document.body.appendChild(iframe);
        this.inventoryOverlayElement = iframe;

        // Fade in effect
        iframe.style.opacity = '0';
        iframe.style.transition = 'opacity 0.5s ease-in-out';
        setTimeout(() => {
            iframe.style.opacity = '1';
        }, 50);

        // Send inventory data when the iframe loads
        iframe.addEventListener('load', () => {
            console.log('Sending items from Scene to Inventory');
            iframe.contentWindow?.postMessage({
                type: "inventoryData",
                items: this.inventory?.getDetailedInventory() // Sends full inventory details
            }, "*");
        });

        console.groupEnd();
    }





    private destroyInventoryOverlay(): void {
        if (!this.inventoryOverlayElement) {
            console.warn('No inventory overlay to destroy.');
            return;
        }
        console.log('Closing inventory overlay...');

        // Fade out
        this.inventoryOverlayElement.style.opacity = '1';
        this.inventoryOverlayElement.style.transition = 'opacity 0.5s ease-in-out';
        this.inventoryOverlayElement.style.opacity = '0';

        // Remove from the DOM after fade
        setTimeout(() => {
            this.inventoryOverlayElement?.parentNode?.removeChild(this.inventoryOverlayElement);
            this.inventoryOverlayElement = null;
        }, 500);
    }


}