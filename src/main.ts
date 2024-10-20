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
 display: none;
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

let game: Phaser.Game;

const startGame = () => {
  const landingPage = document.getElementById('landing-page');
  const gameContainer = document.getElementById('game-container');

  if (landingPage && gameContainer) {
    landingPage.style.display = 'none';
    gameContainer.style.display = 'block';
  }

  game = new Phaser.Game(config);
};

window.addEventListener('load', () => {
  const startButton = document.getElementById('start-game');
  if (startButton) {
    startButton.addEventListener('click', startGame);
  } else {
    console.error('Start game button not found');
  }
});

// Enable hot reloading for development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    if (game) {
      game.destroy(true);
    }
    startGame();
  });
}