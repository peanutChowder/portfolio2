const startGame = () => {
  window.location.href = '/game';
};

window.addEventListener('load', () => {
  const startButton = document.getElementById('start-game-button');
  if (startButton) {
      startButton.addEventListener('click', startGame);
  } else {
      console.error('Start game button not found');
  }
});