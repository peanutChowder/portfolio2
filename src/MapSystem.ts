import IsometricScene from "./IsometricScene";
import InteractionArea from "./InteractionArea";

export class MapSystem extends Phaser.GameObjects.Container {
    public scene: IsometricScene;

    private mapWidth: number;
    private mapHeight: number;
    private mapPadding: number = 90;
    private mapAlpha: number = 0.8;
    private mapColor: number = 0xffffff;
    private landColor: number = 0x5ce086;  
    private waterColor: number = 0x8df7f6;  
    
    private mapContainer!: Phaser.GameObjects.Container;
    private mapBackground!: Phaser.GameObjects.Graphics;
    private mapContent!: Phaser.GameObjects.Graphics;
    
    private mapScale: number = 0.08; // Reduced scale for minimap

    // Map Markers
    private boatMarker!: Phaser.GameObjects.Graphics;
    private interactionMarkers: Phaser.GameObjects.Graphics[] = [];
    private interactionAreas!: { [key: string]: InteractionArea };

    private legend!: Phaser.GameObjects.Container;
    private legendEntries: {marker: Phaser.GameObjects.Graphics, text: Phaser.GameObjects.Text}[] = [];

    constructor(scene: IsometricScene, interactionAreas: { [key: string]: InteractionArea }) {
        super(scene, 0, 0);
        this.scene = scene;
        this.interactionAreas = interactionAreas;

        const cameraZoom = this.scene.cameras.main.zoom;
        const screenWidth = this.scene.cameras.main.width / cameraZoom;
        const screenHeight = this.scene.cameras.main.height / cameraZoom;

        // Set up map container
        this.mapWidth = screenWidth * 0.8;
        this.mapHeight = screenHeight * 0.7;
        this.mapContainer = this.scene.add.container(300, 0);
        this.mapContainer.setScrollFactor(0);
        this.mapContainer.setDepth(1000);

        // Create map background with reduced size
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

        // Draw boat marker (smaller size)
        this.boatMarker = this.scene.add.graphics();
        this.drawBoatMarker();
        this.mapContainer.add(this.boatMarker);

        // Draw interaction areas markers
        this.createInteractionMarkers();
        
        // Draw the map
        this.drawMap();

        scene.add.existing(this);
    }

    private drawMap(): void {
        const map = (this.scene as IsometricScene).map;
        if (!map) return;

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
                if (tile.index !== -1) { 
                    const cartX = (x - y) * map.tileWidth / 2;
                    const cartY = (x + y) * map.tileHeight / 2;

                    const mapX = (cartX * this.mapScale);
                    const mapY = (cartY * this.mapScale) - (this.mapHeight / 2);

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

        Object.entries(this.interactionAreas).forEach(([_, area]) => {
            const markerInfo = area.markerInfo;
            if (!markerInfo) return;

            const marker = this.scene.add.graphics();
            const { x, y } = area.getCenter();

            marker.clear();
            marker.lineStyle(1, 0xffffff); 
            marker.fillStyle(markerInfo.color);
            marker.beginPath();
            marker.arc(0, 0, markerInfo.radius * 0.5, 0, Math.PI * 2); // Smaller radius
            marker.closePath();
            marker.fillPath();
            marker.strokePath();

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
        this.boatMarker.fillCircle(0, 0, 15); // Smaller radius
    }

    public updateBoatMarker(worldX: number, worldY: number): void {
        const cartX = worldX * this.mapScale;
        const cartY = (worldY * this.mapScale) - (this.mapHeight / 2);

        this.boatMarker.setPosition(cartX, cartY);
    }

    public destroy(fromScene?: boolean): void {
        this.mapContainer.destroy();
        this.interactionMarkers.forEach(marker => marker.destroy());
        super.destroy(fromScene);
    }
}