import Phaser from 'phaser';
import IsometricScene from './IsometricScene';

const devMode = false; // skip intro page

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
    display: ${devMode ? 'block' : 'none'};
  }
  .mobile-warning-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 32px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    text-align: center;
    min-width: 300px;
    width: 90%;
    max-width: 400px;
  }
  .mobile-warning-dialog p {
    font-size: 1.25rem;
    margin: 0 0 24px 0;
    line-height: 1.5;
  }
  .mobile-warning-dialog .buttons {
    margin-top: 24px;
    display: flex;
    gap: 16px;
    justify-content: center;
  }
  .mobile-warning-dialog button {
    padding: 16px 32px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 600;
    min-width: 120px;
    transition: transform 0.1s ease;
  }
  .mobile-warning-dialog button:active {
    transform: scale(0.98);
  }
  .mobile-warning-dialog .yes-button {
    background: #4CAF50;
    color: white;
  }
  .mobile-warning-dialog .no-button {
    background: #f44336;
    color: white;
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
  physics: {
    default: 'arcade',
    arcade: {
    }
  }
};

let game: Phaser.Game;

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const showMobileWarning = () => {
  return new Promise<boolean>((resolve) => {
    const dialog = document.createElement('div');
    dialog.className = 'mobile-warning-dialog';
    dialog.innerHTML = `
      <p>Best experienced on desktop. Do you still want to enter?</p>
      <div class="buttons">
        <button class="yes-button">Yes</button>
        <button class="no-button">No</button>
      </div>
    `;

    document.body.appendChild(dialog);

    const yesButton = dialog.querySelector('.yes-button');
    const noButton = dialog.querySelector('.no-button');

    yesButton?.addEventListener('click', () => {
      dialog.remove();
      resolve(true);
    });

    noButton?.addEventListener('click', () => {
      dialog.remove();
      resolve(false);
    });
  });
};

const startGame = async () => {
  if (isMobile()) {
    const shouldContinue = await showMobileWarning();
    if (!shouldContinue) {
      return;
    }
  }

  const landingPage = document.getElementById('landing-page');
  const gameContainer = document.getElementById('game-container');
  
  if (landingPage && gameContainer) {
    landingPage.style.display = 'none';
    gameContainer.style.display = 'block';
  }
  
  game = new Phaser.Game(config);
};

window.addEventListener('load', () => {
  if (devMode) {
    new Phaser.Game(config);
    return;
  }

  const startButton = document.getElementById('start-game-button');
  if (startButton) {
    startButton.addEventListener('click', startGame);
  } else {
    console.error('Start game button not found');
  }
});

// Enable hot reloading for development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    location.reload();
  });
}