import Phaser from 'phaser';
import IsometricScene from './IsometricScene';

// manually remove margin so that game takes full horizontal width
const style = document.createElement('style');
style.textContent = `
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
  }
  #game-container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
`;
document.head.appendChild(style);

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%',
        parent: 'game-container',
    },
    scene: [IsometricScene],
    dom: {
        createContainer: true
    },
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