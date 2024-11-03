import IsometricScene from "./IsometricScene";

import mapIcon from '../assets/map.png'


export class MapSystem extends Phaser.GameObjects.Container {
    private mapWidth: number;
    private mapHeight: number;
    private mapAlpha: number = 0.8;
    private mapColor: number = 0x000000;
    private borderColor: number = 0xFFFFFF;
    
    private iconSize: number = 50;
    private mapIcon!: Phaser.GameObjects.Image; 
    private mapContainer!: Phaser.GameObjects.Container;
    private mapBackground!: Phaser.GameObjects.Graphics;
    
    public isMapVisible: boolean = false;

    static preload(scene: IsometricScene) {
        scene.load.image('mapIcon', mapIcon)
    }

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, 0, 0);

        const screenX = x;
        const screenY = y;

        const cameraZoom = this.scene.cameras.main.zoom;

        // Create the map button using an image
        const screenWidth = this.scene.cameras.main.width / cameraZoom;
        const screenHeight = this.scene.cameras.main.height / cameraZoom;
        const iconX = -screenWidth * 0.3;
        const iconY = screenHeight * 0.5;
        this.mapIcon = this.scene.add.image(iconX, iconY, 'mapIcon')
            .setScale(this.iconSize / 40)  // Adjust scale based on your image size
            .setScrollFactor(0)
            .setDepth(1000)
            .setInteractive({ useHandCursor: true });

        // Create the map container 
        const mapX = 0;
        const mapY = 0;
        this.mapWidth = screenWidth * 0.5;
        this.mapHeight = screenHeight * 0.7;
        this.mapContainer = this.scene.add.container(mapX, mapY);
        this.mapContainer.setScrollFactor(0);
        this.mapContainer.setDepth(1000);
        this.mapContainer.setVisible(false);

        // Create the map background
        this.mapBackground = this.scene.add.graphics();
        this.mapBackground.lineStyle(2, this.borderColor);
        this.mapBackground.fillStyle(this.mapColor, this.mapAlpha);
        this.mapBackground.strokeRect(-this.mapWidth/2, -this.mapHeight/2, this.mapWidth, this.mapHeight);
        this.mapBackground.fillRect(-this.mapWidth/2, -this.mapHeight/2, this.mapWidth, this.mapHeight);
        
        this.mapContainer.add(this.mapBackground);

        this.mapIcon.on('pointerdown', () => {
            this.toggleMap();
        });
        
        // Add hover effects
        this.mapIcon.on('pointerover', () => {
            this.mapIcon.setTint(0xcccccc);  
        });
        this.mapIcon.on('pointerout', () => {
            this.mapIcon.clearTint();  
        });

        scene.add.existing(this);
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