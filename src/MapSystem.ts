import IsometricScene from "./IsometricScene";
import InteractionArea from "./InteractionArea";

export class MapSystem extends Phaser.GameObjects.Container {
    public scene: IsometricScene;

    private mapSize!: number; // Square minimap sizing  
    private mapPadding: number = 40;
    private mapAlpha: number = 0.8;
    private mapColor: number = 0xffffff;
    private landColor: number = 0x5ce086;  
    private waterColor: number = 0x8df7f6;  
    
    private mapContainer!: Phaser.GameObjects.Container;
    private mapBackground!: Phaser.GameObjects.Graphics;
    private mapContent!: Phaser.GameObjects.Graphics;

    // How much to shift our drawing of the map in order to fit
    // into the water background
    private graphicOffsetX!: number; 
    private graphicOffsetY!: number;
    
    private mapScale!: number;

    // Map Markers
    private boatMarker!: Phaser.GameObjects.Graphics;
    private interactionMarkers: Phaser.GameObjects.Graphics[] = [];
    private interactionAreas!: { [key: string]: InteractionArea };

    constructor(scene: IsometricScene, interactionAreas: { [key: string]: InteractionArea }) {
        super(scene, 0, 0);
        this.scene = scene;
        this.interactionAreas = interactionAreas;

        const cameraWidth = this.scene.cameras.main.width;
        const cameraHeight = this.scene.cameras.main.height;
        const cameraZoom = this.scene.cameras.main.zoom;

        // Pick the smaller dimension so the minimap remains square
        let mapPercentOfScreen;
        if (this.scene.isMobileDevice) {
            mapPercentOfScreen = 0.4;
        } else {
            mapPercentOfScreen = 0.2;
        }
        const minDimension = Math.min(cameraWidth, cameraHeight);
        this.mapSize = (minDimension / cameraZoom) * mapPercentOfScreen;

        // Calculate the actual world dimensions to determine proper scale
        const map = this.scene.map;
        if (map) {
            const mapWidth = (map.width + map.height) * (map.tileWidth / 2);
            const effectiveSize = this.mapSize - this.mapPadding;
            this.mapScale = effectiveSize * 1.3 / mapWidth; // 1.3 is arbitrary constant to increase map scale
        }

        // Add minimap to top right corner of screen
        this.mapContainer = this.scene.add.container(
            this.scene.cameras.main.centerX + (cameraWidth / (2 * cameraZoom)) - (this.mapSize / 1.9), // divide by slightly less than 2 so that there is some margin between map and screen edge
            this.scene.cameras.main.centerY - (cameraHeight / (2 * cameraZoom)) + (this.mapSize / 1.9)
        );
        this.mapContainer.setScrollFactor(0);
        this.mapContainer.setDepth(1000);

        const backgroundSize = this.mapSize;
        this.mapBackground = this.scene.add.graphics();
        this.mapBackground.fillStyle(this.mapColor, this.mapAlpha);
        this.mapBackground.strokeRect(
            -backgroundSize / 2, 
            -backgroundSize / 2, 
            backgroundSize, 
            backgroundSize
        );
        this.mapBackground.fillRect(
            -backgroundSize / 2, 
            -backgroundSize / 2, 
            backgroundSize, 
            backgroundSize
        );
        this.mapContainer.add(this.mapBackground);

        // Create actual map graphics
        this.mapContent = this.scene.add.graphics();
        this.mapContainer.add(this.mapContent);

        // Draw the map
        this.drawMap(); // note: must be called prior to markers in order to set "graphicOffsetX" and "graphicOffsetY"

        // Draw boat marker 
        this.boatMarker = this.scene.add.graphics();
        this.drawBoatMarker();
        this.mapContainer.add(this.boatMarker);

        this.createInteractionMarkers();
        

        scene.add.existing(this);
    }

    static preload(scene: IsometricScene): void {
        scene.load.image('minimapHouse', '../assets/minimap/house.png');

    }

    private drawMap(): void {
        const map = (this.scene as IsometricScene).map;
        if (!map) return;

        this.mapContent.clear();

        // Draw water background (square)
        const effectiveSize = this.mapSize - this.mapPadding;
        this.mapContent.fillStyle(this.waterColor);
        this.mapContent.fillRect(
            -effectiveSize / 2,
            -effectiveSize / 2,
            effectiveSize,
            effectiveSize
        );

        // Get land layer 
        const landLayer = map.layers.find(layer => layer.name === "Land 1");
        if (!landLayer) return;

        // Draw land tiles
        this.mapContent.fillStyle(this.landColor);
        
        // Calculate center offset
        this.graphicOffsetX = 0;
        this.graphicOffsetY = -((map.height * map.tileHeight/2) * this.mapScale);

        landLayer.data.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile.index !== -1) { 
                    const cartX = (x - y) * map.tileWidth / 2;
                    const cartY = (x + y) * map.tileHeight / 2;

                    const mapX = (cartX * this.mapScale) + this.graphicOffsetX;
                    const mapY = (cartY * this.mapScale) + this.graphicOffsetY;

                    this.mapContent.fillRect(
                        mapX, 
                        mapY, 
                        map.tileWidth * this.mapScale, 
                        map.tileHeight * this.mapScale
                    );
                }
            });
        });
    }

    private createInteractionMarkers(): void {
        this.interactionMarkers.forEach(marker => marker.destroy());
        this.interactionMarkers = [];

        Object.values(this.interactionAreas).forEach(area => {
            const markerInfo = area.markerInfo;
            if (!markerInfo) return;
    
            const { x, y } = area.getCenter();
            const mapX = x * this.mapScale + this.graphicOffsetX;
            const mapY = y * this.mapScale + this.graphicOffsetY;
    
            let marker: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
    

            // We handle custom markers first, then default to the circle
            // marker using their set colour
            if (markerInfo.locationType === "Safehouse") {
                marker = this.scene.add.image(mapX, mapY, 'minimapHouse');
                marker.setScale(0.15);  
            } else {
                // Default circle marker
                marker = this.scene.add.graphics();
                marker.clear();
                marker.lineStyle(1, 0xffffff);
                marker.fillStyle(markerInfo.color);
                marker.beginPath();
                marker.arc(0, 0, markerInfo.radius * 0.5, 0, Math.PI * 2);
                marker.closePath();
                marker.fillPath();
                marker.strokePath();
                
                marker.setPosition(mapX, mapY);
            }
    
            this.mapContainer.add(marker);
            this.interactionMarkers.push(marker as Phaser.GameObjects.Graphics);
        });
    }

    public getMinimapWidth(): number {
        return this.mapSize;
    }

    private drawBoatMarker(): void {
        this.boatMarker.clear();
        this.boatMarker.fillStyle(0xff0000);
        
        // Draw triangle for boat direction
        const size = 30;
        this.boatMarker.beginPath();
        this.boatMarker.moveTo(0, -size);  
        this.boatMarker.lineTo(-size/2, size/2);  
        this.boatMarker.lineTo(size/2, size/2);   
        this.boatMarker.closePath();
        this.boatMarker.fillPath();
    }

    /**
     * Get the bottom right position of the map container in world coordinates.
     * Hacky implementation used to position the energy bar relative to the map.
     * @returns The bottom right position of the map container
     */
    public getMapBottomRight(): { x: number; y: number } {
        const halfSize = this.mapSize / 2;
    
        const bottomRightX = this.mapContainer.x + halfSize;
        const bottomRightY = this.mapContainer.y + halfSize;
    
        return { x: bottomRightX, y: bottomRightY };
    }
    
    
    public updateBoatMarker(worldX: number, worldY: number, orientation: string): void {
        const mapX = worldX * this.mapScale + this.graphicOffsetX;
        const mapY = worldY * this.mapScale + this.graphicOffsetY;        
        this.boatMarker.setPosition(mapX, mapY);
        
        let angle = 0;
        switch(orientation) {
            case 'boat_n':  angle = 0; break;
            case 'boat_ne': angle = Math.PI * 0.25; break;
            case 'boat_e':  angle = Math.PI * 0.5; break;
            case 'boat_se': angle = Math.PI * 0.75; break;
            case 'boat_s':  angle = Math.PI; break;
            case 'boat_sw': angle = Math.PI * 1.25; break;
            case 'boat_w':  angle = Math.PI * 1.5; break;
            case 'boat_nw': angle = Math.PI * 1.75; break;
        }
        this.boatMarker.setRotation(angle);
    }

    public destroy(fromScene?: boolean): void {
        this.mapContainer.destroy();
        this.interactionMarkers.forEach(marker => marker.destroy());
        super.destroy(fromScene);
    }
}