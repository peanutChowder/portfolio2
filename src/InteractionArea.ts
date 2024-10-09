export default class InteractionArea {
    private scene: Phaser.Scene;
    private ellipse: Phaser.Geom.Ellipse;
    private graphics: Phaser.GameObjects.Graphics;
    private isVisible: boolean;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
        this.scene = scene;
        this.ellipse = new Phaser.Geom.Ellipse(x, y, width, height);
        this.graphics = scene.add.graphics();
        this.isVisible = true;
        this.draw();
    }

    private draw() {
        this.graphics.clear();

        if (!this.isVisible) return;

        this.graphics.lineStyle(2, 0xffff00, 1);
        this.graphics.fillStyle(0xffff00, 0.2);

        this.graphics.save();
        this.graphics.translateCanvas(this.ellipse.x, this.ellipse.y);
        this.graphics.rotateCanvas(Math.PI);
        this.graphics.translateCanvas(-this.ellipse.x, -this.ellipse.y);
        
        this.graphics.strokeEllipseShape(this.ellipse);
        this.graphics.fillEllipseShape(this.ellipse);
        
        this.graphics.restore();
    }

    containsPoint(x: number, y: number): boolean {
        const translatedX = x - this.ellipse.x;
        const translatedY = y - this.ellipse.y;
        
        const rotatedX = translatedX * Math.cos(-Math.PI / 4) - translatedY * Math.sin(-Math.PI / 4);
        const rotatedY = translatedX * Math.sin(-Math.PI / 4) + translatedY * Math.cos(-Math.PI / 4);
        
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