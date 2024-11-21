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
            window.location.href = '/'; // Return to main page
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
    new Phaser.Game(config);
};

// Start the game when the page loads
window.addEventListener('load', initGame);

// Enable hot reloading for development
if (import.meta.hot) {
    import.meta.hot.accept(() => {
        location.reload();
    });
}