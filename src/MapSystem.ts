import IsometricScene from "./IsometricScene";
import mapIcon from '../assets/map.png';

export class MapSystem extends Phaser.GameObjects.Container {
    private mapWidth: number;
    private mapHeight: number;
    private mapAlpha: number = 0.8;
    private mapColor: number = 0x000000;
    private borderColor: number = 0xFFFFFF;
    private iconSize: number = 50;
    private landColor: number = 0x3d8547;  // Green for land
    private waterColor: number = 0x2389da;  // Blue for water
    
    private mapIcon!: Phaser.GameObjects.Image;
    private mapContainer!: Phaser.GameObjects.Container;
    private mapBackground!: Phaser.GameObjects.Graphics;
    private mapContent!: Phaser.GameObjects.Graphics;
    public scene: IsometricScene;
    
    public isMapVisible: boolean = false;

    static preload(scene: IsometricScene) {
        scene.load.image('mapIcon', mapIcon);
    }

    constructor(scene: IsometricScene, x: number, y: number) {
        super(scene, 0, 0);
        this.scene = scene;

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
        this.mapWidth = screenWidth * 0.7;
        this.mapHeight = screenHeight * 0.7;
        this.mapContainer = this.scene.add.container(0, 0);
        this.mapContainer.setScrollFactor(0);
        this.mapContainer.setDepth(1000);
        this.mapContainer.setVisible(false);

        // Create map background
        this.mapBackground = this.scene.add.graphics();
        this.mapBackground.lineStyle(2, this.borderColor);
        this.mapBackground.fillStyle(this.mapColor, this.mapAlpha);
        this.mapBackground.strokeRect(-this.mapWidth/2, -this.mapHeight/2, this.mapWidth, this.mapHeight);
        this.mapBackground.fillRect(-this.mapWidth/2, -this.mapHeight/2, this.mapWidth, this.mapHeight);
        this.mapContainer.add(this.mapBackground);

        // Create map content graphics
        this.mapContent = this.scene.add.graphics();
        this.mapContainer.add(this.mapContent);
        
        // Draw the map
        this.drawMap();

        // Set up event handlers
        this.mapIcon.on('pointerdown', () => this.toggleMap());
        this.mapIcon.on('pointerover', () => this.mapIcon.setTint(0xcccccc));
        this.mapIcon.on('pointerout', () => this.mapIcon.clearTint());

        scene.add.existing(this);
    }

    private drawMap(): void {
        const map = (this.scene as IsometricScene).map;
        if (!map) return;

        // Clear previous content
        this.mapContent.clear();

        // Calculate scale factors to fit the entire map in our minimap
        const scaleX = this.mapWidth / map.widthInPixels;
        const scaleY = this.mapHeight / map.heightInPixels;
        const scale = Math.min(scaleX, scaleY) * 1.4;

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
                    const mapX = (cartX * scale);
                    const mapY = (cartY * scale) - (this.mapHeight / 4);

                    // Draw a small rectangle for each land tile
                    this.mapContent.fillRect(
                        mapX, 
                        mapY, 
                        map.tileWidth * scale, 
                        map.tileHeight * scale
                    );
                }
            });
        });
    }

    public toggleMap(): void {
        this.isMapVisible = !this.isMapVisible;
        this.mapContainer.setVisible(this.isMapVisible);
    }

    public setMapPosition(x: number, y: number): void {
        this.mapContainer.setPosition(x, y);
    }

    public setIconPosition(x: number, y: number): void {
        this.mapIcon.setPosition(x, y);
    }

    public destroy(fromScene?: boolean): void {
        this.mapIcon.destroy();
        this.mapContainer.destroy();
        super.destroy(fromScene);
    }
}