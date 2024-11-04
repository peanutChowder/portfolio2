import IsometricScene from "./IsometricScene";
import mapIcon from '../assets/map.png';
import InteractionArea from "./InteractionArea";

export class MapSystem extends Phaser.GameObjects.Container {
    public scene: IsometricScene;

    private mapWidth: number;
    private mapHeight: number;
    private mapPadding: number = 200;
    private mapAlpha: number = 0.8;
    private mapColor: number = 0xffffff;
    private iconSize: number = 50;
    private landColor: number = 0x5ce086;  
    private waterColor: number = 0x8df7f6;  
    
    private mapIcon!: Phaser.GameObjects.Image;
    private mapContainer!: Phaser.GameObjects.Container;
    private mapBackground!: Phaser.GameObjects.Graphics;
    private mapContent!: Phaser.GameObjects.Graphics;

    // Map Markers
    private boatMarker!: Phaser.GameObjects.Graphics;
    private interactionMarkers: Phaser.GameObjects.Graphics[] = [];
    private interactionAreas!: { [key: string]: InteractionArea };
    
    public isMapVisible: boolean = false;
    private mapScale: number = 0.13;

    static preload(scene: IsometricScene) {
        scene.load.image('mapIcon', mapIcon);
    }

    constructor(scene: IsometricScene, interactionAreas: { [key: string]: InteractionArea }) {
        super(scene, 0, 0);
        this.scene = scene;
        this.interactionAreas = interactionAreas;

        const cameraZoom = this.scene.cameras.main.zoom;
        const screenWidth = this.scene.cameras.main.width / cameraZoom;
        const screenHeight = this.scene.cameras.main.height / cameraZoom;

        // Set up map icon
        const iconX = -screenWidth * 0.3;
        const iconY = screenHeight * 0.5;
        this.mapIcon = this.scene.add.image(iconX, iconY, 'mapIcon')
            .setScale(this.iconSize / 40)
            .setScrollFactor(0)
            .setDepth(1000)
            .setInteractive({ useHandCursor: true });

        // Set up map container
        this.mapWidth = screenWidth * 0.8;
        this.mapHeight = screenHeight * 0.7;
        this.mapContainer = this.scene.add.container(300, 0);
        this.mapContainer.setScrollFactor(0);
        this.mapContainer.setDepth(1000);
        this.mapContainer.setVisible(false);

        // Create map background
        const backgroundWidth = this.mapWidth + this.mapPadding;
        const backgroundHeight = this.mapHeight + this.mapPadding;
        this.mapBackground = this.scene.add.graphics();
        this.mapBackground.fillStyle(this.mapColor, this.mapAlpha);
        this.mapBackground.strokeRect(-backgroundWidth/2, -backgroundHeight/2, backgroundWidth, backgroundHeight);
        this.mapBackground.fillRect(-backgroundWidth/2, -backgroundHeight/2, backgroundWidth, backgroundHeight);
        this.mapContainer.add(this.mapBackground);

        // Create map content graphics
        this.mapContent = this.scene.add.graphics();
        this.mapContainer.add(this.mapContent);

        // Draw boat marker
        this.boatMarker = this.scene.add.graphics();
        this.drawBoatMarker();
        this.mapContainer.add(this.boatMarker);

        // Draw interaction areas markers
        this.createInteractionMarkers()
        
        // Draw the map
        this.drawMap();

        // Set up event handlers
        this.mapIcon.on('pointerdown', () => this.toggleMap());
        this.mapIcon.on('pointerover', () => this.mapIcon.setTint(0xcccccc));
        this.mapIcon.on('pointerout', () => this.mapIcon.clearTint());

        this.toggleMap();


        scene.add.existing(this);
        
    }

    private drawMap(): void {
        const map = (this.scene as IsometricScene).map;
        if (!map) return;

        // Clear previous content
        this.mapContent.clear();

        // Draw water background
        this.mapContent.fillStyle(this.waterColor);
        this.mapContent.fillRect(
            -this.mapWidth/2, 
            -this.mapHeight/2, 
            this.mapWidth, 
            this.mapHeight
        );

        // Get land layer 
        const landLayer = map.layers.find(layer => layer.name === "Land 1");
        if (!landLayer) return;

        // Draw land tiles
        this.mapContent.fillStyle(this.landColor);
        landLayer.data.forEach((row, y) => {
            row.forEach((tile, x) => {
                // Draw if not empty tile
                if (tile.index !== -1) { 
                    // Convert isometric coordinates to cartesian
                    const cartX = (x - y) * map.tileWidth / 2;
                    const cartY = (x + y) * map.tileHeight / 2;

                    // Scale and position in minimap
                    const mapX = (cartX * this.mapScale);
                    const mapY = (cartY * this.mapScale) - (this.mapHeight / 2);

                    // Draw a small rectangle for each land tile
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

    public toggleMap(): void {
        this.isMapVisible = !this.isMapVisible;
        this.mapContainer.setVisible(this.isMapVisible);
        this.boatMarker.setVisible(this.isMapVisible);
    }

    public setMapPosition(x: number, y: number): void {
        this.mapContainer.setPosition(x, y);
    }

    public setIconPosition(x: number, y: number): void {
        this.mapIcon.setPosition(x, y);
    }

    private createInteractionMarkers(): void {
        // Clear any existing markers
        this.interactionMarkers.forEach(marker => marker.destroy());
        this.interactionMarkers = [];

        // Create a marker for each interaction area
        Object.entries(this.interactionAreas).forEach(([key, area]) => {
            const markerInfo = area.markerInfo;

            // Area has undefined marker, don't draw marker
            if (markerInfo == undefined) {return;}

            const marker = this.scene.add.graphics();
            const { x, y } = area.getCenter();

            // Draw marker
            marker.clear();
            marker.lineStyle(2, 0xffffff); 
            marker.fillStyle(markerInfo.color);
            marker.beginPath();
            marker.arc(0, 0, markerInfo.radius, 0, Math.PI * 2); // Smaller than boat marker
            marker.closePath();
            marker.fillPath();
            marker.strokePath();

            // Position marker
            const mapX = x * this.mapScale;
            const mapY = (y * this.mapScale) - (this.mapHeight / 2);
            marker.setPosition(mapX, mapY);

            this.mapContainer.add(marker);
            this.interactionMarkers.push(marker);
        });
    }


    private drawBoatMarker(): void {
        this.boatMarker.clear();
        
        this.boatMarker.fillStyle(0xff0000);
        this.boatMarker.fillCircle(0, 0, 20);
    }

    public updateBoatMarker(worldX: number, worldY: number): void {
        // Convert world coordinates to map coordinates using same scaling as map tiles
        const cartX = worldX * this.mapScale;
        const cartY = (worldY * this.mapScale) - (this.mapHeight / 2);

        this.boatMarker.setPosition(cartX, cartY);
        this.boatMarker.setVisible(this.isMapVisible);
    }

    public destroy(fromScene?: boolean): void {
        this.mapIcon.destroy();
        this.mapContainer.destroy();
        this.interactionMarkers.forEach(marker => marker.destroy());
        super.destroy(fromScene);
    }
}