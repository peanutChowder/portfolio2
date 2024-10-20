import Phaser from 'phaser';
import { Boat } from './Boat';
import InteractionArea from './InteractionArea';

// import map & map tiles
import mapJSON from '../assets/world2/world2.json';
import tileset256x256Cubes from '../assets/world2/256x256 Cubes.png';
import tileset256x192Tiles from '../assets/world2/256x192 Tiles.png'
import tileset256x512Trees from '../assets/world2/256x512 Trees.png'
import tileset256x128TileOverlays from '../assets/world2/256x128 Tile Overlays.png'

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
import { ArrowIndicator } from './ArrowIndicator';
import { VirtualJoystick } from './VirtualJoystick';

const fontSize = "80px";
const fontColor = "#ffffff"
const fontFamilies = {
    "header": "Arial",
    "body": ""
}

const debugMode = false;

export default class IsometricScene extends Phaser.Scene {
    private map!: Phaser.Tilemaps.Tilemap;
    private boat!: Boat;
    private collisionLayers: Phaser.Tilemaps.TilemapLayer[];
    private collisionLayerNames: string[];

    // Interaction Area and Overlay attributes 
    private overlay!: Phaser.GameObjects.DOMElement | null;
    private interactionAreas: { [key: string]: InteractionArea } = {};

    // Arrows for pointing towards interaction areas
    private arrowIndicators: { [key: string]: ArrowIndicator } = {};

    // joystick for mobile users
    private joystick!: VirtualJoystick;

    public isMobileDevice!: boolean;

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

        this.load.image('boat_n', boatNorthPNG);
        this.load.image('boat_w', boatWestPNG);
        this.load.image('boat_e', boatEastPNG);
        this.load.image('boat_s', boatSouthPNG);

        this.load.image('boat_ne', boatNorthEastPNG);
        this.load.image('boat_nw', boatNorthWestPNG);
        this.load.image('boat_se', boatSouthEastPNG);
        this.load.image('boat_sw', boatSouthWestPNG);        
        
        this.load.on('loaderror', (file: Phaser.Loader.File) => {
            console.error('Error loading file:', file.key);
            console.error('File type:', file.type);
            console.error('File url:', file.url);
        });

        this.load.html('resumeOverlay', 'resumeOverlay.html');
        this.load.html('owOverlay', 'owOverlay.html');
        this.load.html('ffOverlay', 'ffOverlay.html');
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
                if (this.collisionLayerNames.includes(layer.layer.name)) {
                    this.collisionLayers.push(layer);
                    layer.setCollisionByProperty({ collides: true });
                }
                console.log(`Added layer '${layer.layer.name}'`);
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
                    layer.setCollisionByProperty({ collides: true });
                }
                console.log(`Added layer '${layer.layer.name}'`);
            } else {
                console.error(`Error getting layer number '${layerNum}'`);
            }

            // Create and draw boat
            this.boat = new Boat(this, -187, 5338, this.interactionAreas);
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

            const worldWidth = this.map.widthInPixels;
            const worldHeight = this.map.heightInPixels;
            

            this.cameras.main.setZoom(0.2);
            this.cameras.main.centerOn(0, 500);

            // Set up camera to follow the boat
            this.cameras.main.startFollow(this.boat, true);

            this.isMobileDevice = this.sys.game.device.os.android || this.sys.game.device.os.iOS
            // Create a virtual joystick for non-desktop users to move the boat.
            if (this.isMobileDevice) {
                const joyStickOrigin = this.cameras.main.getWorldPoint(
                    this.cameras.main.width / 2,
                    this.cameras.main.height * 0.8
                )
                this.joystick = new VirtualJoystick(this, joyStickOrigin.x, joyStickOrigin.y, 300, 100);
                this.boat.setJoystickDirectionGetter(() => this.joystick.getDirection())
            }

            if (debugMode) {
                // Add debug info
                this.add.text(10, 10, `Map dimensions: ${worldWidth}x${worldHeight}`, { color: fontColor, font: fontSize });
                this.add.text(10, 80, `Tile dimensions: ${this.map.tileWidth}x${this.map.tileHeight}`, { color: fontColor, font: fontSize  });
                this.add.text(10, 150, `Mobile?: ${this.isMobileDevice}`, { color: fontColor, font: fontSize  })

                // Log map information
                console.log('Map dimensions:', worldWidth, 'x', worldHeight);
                console.log('Tile dimensions:', this.map.tileWidth, 'x', this.map.tileHeight);
                console.log('Number of layers:', this.map.layers.length);
                console.log('Tileset name:', tilesets.map((tileset) => {tileset}));

                // Set up debugging tool
                this.setupDebuggingTool();
            }
        } catch (error) {
            console.error('Error in create function:', error);
        }

        console.groupEnd();
    }

    private setupInteractiveAreas(): void {
        this.interactionAreas["resume"] = new InteractionArea(
            this,
            -900, 6600,
            2500, 2000,
            "Experience",
            "resumeOverlay",
            0x52f778,
            0xa1f7ce,
            {
                text: "Click to see my experience",
                font: fontFamilies["header"],
                fontColor: "#ffffff",
                color: 0x418045,
                hoverColor: 0x46914b
            },
            {
                text: "Experience",
                color: "#175235",
                font: fontFamilies["header"],
                fontSize: "220px",
                offset: {
                    x: -100, y: -1200
                }
            }
        )

        this.interactionAreas["olympicWeightlifting"] = new InteractionArea(
            this,
            600, 3600,
            2000, 1500,
            "Olympic\nWeightlifting",
            "owOverlay",
            0x45fff9,
            0x68e2ed,
            {
                text: "Click to see Olympic\nWeightlifting Content",
                font: fontFamilies["header"],
                fontColor: "#ffffff",
                color: 0x438a88,
                hoverColor: 0x48a3a1
            },
            {
                text: "Olympic Weightlifting",
                color: "#268784",
                font: fontFamilies["header"],
                fontSize: "130px",
                offset: {
                    x: 0, y: -800
                }
            }
        )

        this.interactionAreas["formFitness"] = new InteractionArea(
            this,
            2445, 8750,
            2000, 1500,
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
                    x: 1100, y: -600
                }
            }
        )


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

        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-X', this.handleXKeyPress, this);
        } else {
            console.error("Error: Could not add 'x' key listener")
        }
    }

    update(): void {
        this.boat.update();

       // Update arrow indicators
       const { x: boatX, y: boatY } = this.boat.getPosition();
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
                this.boat.setHitboxVisibility(this.debugMode);
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
    private showOverlay(overlayHtmlKey: string): void {
        // Toggle overlay (destroy it) if it is currently shown
        if (this.overlay) {
            this.destroyOverlayWithAnimation(overlayHtmlKey);
            return;
        } 

        console.group("Creating overlay")

        // Load HTML content
        const htmlContent = this.cache.html.get(overlayHtmlKey);

        if (!htmlContent) {
            console.error(`Failed to load overlay content '${overlayHtmlKey}'`)
            console.groupEnd()
            return;
        }
    
        // Create wrapper
        const htmlWrapper = document.createElement('div');
        htmlWrapper.style.position = 'absolute';
        if (this.game.device.os.desktop) {
            htmlWrapper.style.width = '100%';
            htmlWrapper.style.height = '100%';
        } else {
            htmlWrapper.style.width = '85%';
            htmlWrapper.style.height = '85%';
        }
        htmlWrapper.style.display = 'flex';
        htmlWrapper.style.justifyContent = 'center';
        htmlWrapper.style.alignItems = 'center';
        htmlWrapper.innerHTML = htmlContent;
    
        // Add the wrapper to the game
        this.overlay = this.add.dom(0, 0, htmlWrapper);
        this.overlay.setOrigin(0.38, 0.4)
        
        this.overlay.setScrollFactor(0);
        this.overlay.setDepth(1000);
        this.overlay.setScale(1 / this.cameras.main.zoom);
    
        // Close button for overlay
        const closeButton = htmlWrapper.querySelector('#closeButton');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.destroyOverlayWithAnimation(overlayHtmlKey));
        } else {
            console.error("Close button not found")
        }

        const overlayWrapperDiv = this.overlay.getChildByID('overlay-wrapper') as HTMLElement;
        overlayWrapperDiv.style.display = 'none';

        console.groupEnd()

        this.time.delayedCall(0, () => {
            if (overlayWrapperDiv) {
                if (overlayWrapperDiv.style.display === 'none') {

                    // Fade in animation
                    overlayWrapperDiv.style.opacity = '0';
                    overlayWrapperDiv.style.display = 'flex';
                    overlayWrapperDiv.style.transition = 'opacity 0.5s ease-in-out';
                    setTimeout(() => {
                        overlayWrapperDiv.style.opacity = '1';
                    }, 100);
                }
            }
        })  
    }

    private destroyOverlayWithAnimation(overlayHtmlKey: string) {
        if (this.overlay) {
            const overlayWrapperDiv = this.overlay.getChildByID('overlay-wrapper') as HTMLElement;

            // Fade out and destroy
            overlayWrapperDiv.style.opacity = '0';
            overlayWrapperDiv.style.transition = 'opacity 0.5s ease-in-out';
            setTimeout(() => {
                overlayWrapperDiv.style.display = 'none';
                if (this.overlay) {
                    this.overlay.destroy();
                    this.overlay = null;
                }
            }, 500);
        } else {
            console.warn("No overlay destroyed: currently null")
        }

        const interactionArea = Object.values(this.interactionAreas).find(child => child["overlayName"] === overlayHtmlKey)
        if (interactionArea) {
            interactionArea.setIgnoreButtonClick(false);
        } else {
            console.error(`Could not re-enable button after overlay ${overlayHtmlKey} closed.`)
        }
    }

    private handleXKeyPress(): void {
        Object.values(this.interactionAreas).forEach(area => area.handleInteraction());
    }
}   