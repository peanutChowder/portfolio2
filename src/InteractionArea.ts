export default class InteractionArea {
    private ellipse: Phaser.Geom.Ellipse;
    private graphics: Phaser.GameObjects.Graphics;
    private isVisible: boolean;
    private areaLineColor = 0x52f778;
    private areaFillColor = 0x81f79c;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
        this.ellipse = new Phaser.Geom.Ellipse(x, y, width, height);
        this.graphics = scene.add.graphics();
        this.isVisible = true;
        this.draw();
    }

    private draw() {
        this.graphics.clear();

        if (!this.isVisible) return;

        this.graphics.lineStyle(10, this.areaLineColor, 1);
        this.graphics.fillStyle(this.areaFillColor, 0.4);

        this.graphics.save();
        this.graphics.translateCanvas(this.ellipse.x, this.ellipse.y);
        this.graphics.rotateCanvas(Math.PI);
        this.graphics.translateCanvas(-this.ellipse.x, -this.ellipse.y);
        
        this.graphics.strokeEllipseShape(this.ellipse);
        this.graphics.fillEllipseShape(this.ellipse);
        
        this.graphics.restore();
    }

    containsPoint(x: number, y: number): boolean {
        // Translate the point relative to the ellipse center
        const translatedX = x - this.ellipse.x;
        const translatedY = y - this.ellipse.y;
    
        // Rotate the point by Math.PI (180 degrees) to match the drawn rotation
        const rotatedX = -translatedX;
        const rotatedY = -translatedY;
    
        // Check if the rotated point is inside the ellipse
        return (rotatedX * rotatedX) / (this.ellipse.width * this.ellipse.width / 4) +
               (rotatedY * rotatedY) / (this.ellipse.height * this.ellipse.height / 4) <= 1;
    }

    setVisible(visible: boolean) {
        this.isVisible = visible;
        this.draw();
    }

    destroy() {
        this.graphics.destroy();
    }
}