import Phaser from 'phaser';
import IsometricScene from './IsometricScene';

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
        arcade: {}
    }
};

const hideLoadingScreen = () => {
    console.log("Hiding loading screen");
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.remove();
    }
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.style.display = 'block';
    }
};

const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const showMobileWarning = () => {
    return new Promise<boolean>((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'mobile-warning-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'mobile-warning-dialog';
        dialog.innerHTML = `
            <p>Best experienced on desktop. Do you still want to enter?</p>
            <div class="buttons">
                <button class="yes-button">Yes</button>
                <button class="no-button">No</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const yesButton = dialog.querySelector('.yes-button');
        const noButton = dialog.querySelector('.no-button');

        const cleanup = () => {
            overlay.remove();
        };

        yesButton?.addEventListener('click', () => {
            cleanup();
            resolve(true);
        });

        noButton?.addEventListener('click', () => {
            cleanup();
            hideLoadingScreen();
            resolve(false);
            window.location.href = '/';
        });
    });
};

const initGame = async () => {
    if (isMobile()) {
        const shouldContinue = await showMobileWarning();
        if (!shouldContinue) {
            return;
        }
    }

    // Show game container first
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.style.display = 'block';
    }

    // Create the game
    new Phaser.Game(config);

    // hide loading screen on first render
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            hideLoadingScreen();
        });
    });
};

// Start the game when the page loads
window.addEventListener('load', initGame);

// Enable hot reloading for development
if (import.meta.hot) {
    import.meta.hot.accept(() => {
        location.reload();
    });
}