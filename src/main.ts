import Phaser from 'phaser';
import IsometricScene from './IsometricScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [IsometricScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    parent: "game-container",
    dom: {
        createContainer: true
    }
};

window.addEventListener('load', () => {
    new Phaser.Game(config);
});

// Enable hot reloading for development
if (import.meta.hot) {
    import.meta.hot.accept(() => {
        location.reload();
    });
}