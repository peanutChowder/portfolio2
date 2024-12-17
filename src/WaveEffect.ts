interface Wave {
    graphics: Phaser.GameObjects.Graphics;
    radius: number;
    alpha: number;
    active: boolean;
}

export class WaveEffect {
    private scene: Phaser.Scene;
    private boat: Phaser.Physics.Arcade.Sprite;
    private waves: Wave[];
    private maxWaves: number;
    private waveSpacing: number;
    private lastWaveTime: number;
    
    // Wave properties
    private readonly startRadius: number;
    private readonly maxRadius: number;
    private readonly waveWidth: number;
    private readonly waveColor: number;
    private readonly waveAlpha: number;
    
    constructor(scene: Phaser.Scene, boat: Phaser.Physics.Arcade.Sprite) {
        this.scene = scene;
        this.boat = boat;
        this.waves = [];
        this.maxWaves = 3;
        this.waveSpacing = 800; // Time between waves in ms
        this.lastWaveTime = 0;
        
        // Wave properties
        this.startRadius = 20;
        this.maxRadius = 60;
        this.waveWidth = 2;
        this.waveColor = 0x3498db;
        this.waveAlpha = 0.3;
        
        // Create initial graphics objects
        for (let i = 0; i < this.maxWaves; i++) {
            const wave: Wave = {
                graphics: scene.add.graphics(),
                radius: this.startRadius,
                alpha: this.waveAlpha,
                active: false
            };
            this.waves.push(wave);
        }
    }
    
    public update(time: number): void {
        // Only create new waves if boat is stationary
        const boatVelocity = this.boat.body as Phaser.Physics.Arcade.Body;
        if (boatVelocity.velocity.length() < 5) {
            // Check if it's time for a new wave
            if (time - this.lastWaveTime > this.waveSpacing) {
                this.createWave();
                this.lastWaveTime = time;
            }
        }
        
        // Update existing waves
        this.waves.forEach(wave => {
            if (wave.active) {
                // Update radius and alpha
                wave.radius += 0.5;
                wave.alpha = this.waveAlpha * (1 - (wave.radius - this.startRadius) / (this.maxRadius - this.startRadius));
                
                // Draw wave
                wave.graphics.clear();
                wave.graphics.lineStyle(this.waveWidth, this.waveColor, wave.alpha);
                wave.graphics.strokeCircle(this.boat.x, this.boat.y, wave.radius);
                
                // Deactivate wave if it reaches max radius
                if (wave.radius >= this.maxRadius) {
                    wave.active = false;
                    wave.graphics.clear();
                }
            }
        });
    }
    
    private createWave(): void {
        // Find an inactive wave to reuse
        const inactiveWave = this.waves.find(wave => !wave.active);
        if (inactiveWave) {
            inactiveWave.radius = this.startRadius;
            inactiveWave.alpha = this.waveAlpha;
            inactiveWave.active = true;
        }
    }
    
    // Clean up graphics when destroying
    public destroy(): void {
        this.waves.forEach(wave => wave.graphics.destroy());
        this.waves = [];
    }

    // Getter methods for configuration
    public getMaxWaves(): number {
        return this.maxWaves;
    }

    public getWaveSpacing(): number {
        return this.waveSpacing;
    }

    // Setter methods for runtime configuration
    public setMaxWaves(value: number): void {
        this.maxWaves = value;
    }

    public setWaveSpacing(value: number): void {
        this.waveSpacing = value;
    }
}