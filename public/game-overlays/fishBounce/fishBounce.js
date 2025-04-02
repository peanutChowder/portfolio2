import { getRandomFishByCost } from "../../src/ItemData.ts";

let selectedFish = null;
let fishElement = null;    // DOM element for the fish
let fishX = 0, fishY = 0;
let fishVx = 0, fishVy = 0;

const GRAVITY = 400;       // px/s^2 pulling fish downward
const FISH_MIN_VX = -200;
const FISH_MAX_VX = 200;
const FISH_MIN_VY = -300;
const FISH_MAX_VY = -200;

const REQUIRED_BOUNCES = 5;
const MAX_LIVES = 3;
let bounces = 0;
let lives = MAX_LIVES;
let isGameRunning = false;
let isSpawningNextFish = false;  // helps prevent double spawns
let gameEnded = false; // game won/lost 


// Paddle
let paddleX = 0, paddleVx = 0;
const PADDLE_ACCEL = 1200;
const PADDLE_FRICTION = 0.92;
const PADDLE_MAX_SPEED = 400;
let paddleWidth = 120, paddleHeight = 20;

// Arrow key states
let leftKeyDown = false;
let rightKeyDown = false;

function initPingPongFish() {
    console.log("Ping Pong Fish loaded.");

    const closeBtn = document.querySelector('.close-button');
    closeBtn.addEventListener('click', () => {
        window.parent.postMessage({
            type: "destroyGameOverlay",
            overlayName: "pingPongFish",
            result: (bounces >= REQUIRED_BOUNCES) ? 'won' : 'lost'
        }, "*");
    });

    // On-screen arrow buttons
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    leftBtn.addEventListener('mousedown', () => leftKeyDown = true);
    leftBtn.addEventListener('touchstart', () => leftKeyDown = true);
    leftBtn.addEventListener('mouseup', () => leftKeyDown = false);
    leftBtn.addEventListener('touchend', () => leftKeyDown = false);

    rightBtn.addEventListener('mousedown', () => rightKeyDown = true);
    rightBtn.addEventListener('touchstart', () => rightKeyDown = true);
    rightBtn.addEventListener('mouseup', () => rightKeyDown = false);
    rightBtn.addEventListener('touchend', () => rightKeyDown = false);

    // Arrow keys on desktop
    window.addEventListener('keydown', (e) => {
        if (!isGameRunning) startGame();
        if (e.key === 'ArrowLeft') leftKeyDown = true;
        if (e.key === 'ArrowRight') rightKeyDown = true;
    });
    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') leftKeyDown = false;
        if (e.key === 'ArrowRight') rightKeyDown = false;
    });

    // Start game on first click/touch
    document.getElementById('sandbox-content').addEventListener('pointerdown', () => {
        if (!isGameRunning) startGame();
    }, { once: true });

    // Listen for fish data from parent
    window.addEventListener('message', event => {
        if (event.data?.fishData) {
            selectedFish = event.data.fishData;
            console.log("Received fish data:", selectedFish);
        }
    });

    // init paddleX center
    const sandboxRect = document.getElementById('sandbox-content').getBoundingClientRect();
    paddleX = sandboxRect.width / 2 - (paddleWidth / 2);

    requestAnimationFrame(gameLoop);
}

function startGame() {
    if (isGameRunning || gameEnded) return;  // If we've ended or are mid-game, don't start again.
    isGameRunning = true;
    gameEnded = false; // Just in case, though it should already be false if we get here.

    // Hide the start message
    document.getElementById('game-message').style.display = 'none';

    // Reset bounces/lives
    bounces = 0;
    lives = MAX_LIVES;
    updateHUD();

    // Select random fish
    selectedFish = getRandomFishByCost(15, 34);
    console.log("Selected fish:", selectedFish);

    // Deduct resource & energy
    window.parent.postMessage({ type: "reduceFish" }, "*");
    window.parent.postMessage({ type: "reduceEnergy", amount: 25 }, "*");

    spawnFish();
}


function spawnFish() {
    if (!isGameRunning) return;
    isSpawningNextFish = false;  // we've actually spawned

    const sandbox = document.getElementById('sandbox-content');
    if (fishElement) {
        fishElement.remove();
    }
    fishElement = document.createElement('img');
    fishElement.className = 'fish';

    // Fallback if no fish data from parent
    fishElement.src = selectedFish?.imgSrc
        ? `../../assets/fish-sprites/${selectedFish.imgSrc}`
        : '../../assets/fish-sprites/fish0.png';

    sandbox.appendChild(fishElement);

    // place fish near top, random x
    const rect = sandbox.getBoundingClientRect();
    const stageW = rect.width;

    fishX = Math.random() * (stageW - 60);
    fishY = 100;
    fishVx = Math.random() * (FISH_MAX_VX - FISH_MIN_VX) + FISH_MIN_VX;
    fishVy = Math.random() * (FISH_MAX_VY - FISH_MIN_VY) + FISH_MIN_VY;
}

function gameLoop() {
    updatePhysics();
    renderObjects();
    requestAnimationFrame(gameLoop);
}

function updatePhysics() {
    if (!isGameRunning) return;

    const dt = 1 / 60;

    // update fish
    if (fishElement) {
        fishVy += GRAVITY * dt;
        fishX += fishVx * dt;
        fishY += fishVy * dt;
    }

    const sandboxRect = document.getElementById('sandbox-content').getBoundingClientRect();
    const stageW = sandboxRect.width;
    const stageH = sandboxRect.height;

    if (fishElement) {
        const fishW = fishElement.offsetWidth;
        const fishH = fishElement.offsetHeight;

        // bounce off left/right
        if (fishX < 0) {
            fishX = 0;
            fishVx = -fishVx;
        }
        if (fishX + fishW > stageW) {
            fishX = stageW - fishW;
            fishVx = -fishVx;
        }
        // bounce off top
        if (fishY < 0) {
            fishY = 0;
            fishVy = -fishVy;
        }

        // bottom => check paddle
        const paddleEl = document.getElementById('paddle');
        const paddleY = paddleEl.offsetTop;

        if (fishY + fishH >= paddleY) {
            // bounding box check
            const paddleLeft = paddleX;
            const paddleRight = paddleX + paddleWidth;

            if (fishX + fishW > paddleLeft && fishX < paddleRight) {
                // Collide with paddle
                fishY = paddleY - fishH;
                fishVy = -Math.abs(fishVy) * 0.9;
                fishVx += paddleVx * 0.3;

                bounces++;
                updateHUD();
                if (bounces >= REQUIRED_BOUNCES) {
                    endGame(true);
                }
            } else {
                // Missed the paddle
                loseFish();
            }
        }
    }

    // update paddle
    if (leftKeyDown) paddleVx -= PADDLE_ACCEL * dt;
    if (rightKeyDown) paddleVx += PADDLE_ACCEL * dt;
    paddleVx *= PADDLE_FRICTION;
    if (paddleVx > PADDLE_MAX_SPEED) paddleVx = PADDLE_MAX_SPEED;
    if (paddleVx < -PADDLE_MAX_SPEED) paddleVx = -PADDLE_MAX_SPEED;
    paddleX += paddleVx * dt;
    // clamp
    if (paddleX < 0) paddleX = 0;
    if (paddleX + paddleWidth > stageW) paddleX = stageW - paddleWidth;
}

function renderObjects() {
    if (fishElement) {
        fishElement.style.left = fishX + 'px';
        fishElement.style.top = fishY + 'px';
    }

    const paddleEl = document.getElementById('paddle');
    paddleEl.style.left = paddleX + 'px';
}

function loseFish() {
    if (!isGameRunning) return;
    if (isSpawningNextFish) return; // to avoid double calls

    lives--;
    updateHUD();

    // If still have lives, show message + wait 1 second
    if (lives > 0) {
        showMessage(`You lost a fish! ${lives} left...`);
        fishElement?.remove();
        fishElement = null;

        isSpawningNextFish = true; // block double spawns
        setTimeout(() => {
            if (isGameRunning && lives > 0) {
                spawnFish();
            }
        }, 1000);

    } else {
        endGame(false);
    }
}

function updateHUD() {
    document.getElementById('bounces').textContent = `Bounces: ${bounces}`;
    document.getElementById('lives').textContent = `Lives: ${lives}`;
}

function showMessage(msg) {
    const messageEl = document.getElementById('game-message');
    messageEl.textContent = msg;
    messageEl.style.display = 'block';

    setTimeout(() => {
        if (isGameRunning) {
            messageEl.style.display = 'none';
        }
    }, 1500);
}

function endGame(won) {
    isGameRunning = false;
    gameEnded = true;

    if (won) {
        const sandbox = document.getElementById("sandbox-content");
        const caughtFish = document.createElement("img");
        caughtFish.src = `../../assets/fish-sprites/${selectedFish.imgSrc}`;
        caughtFish.style.position = "absolute";
        caughtFish.style.top = "20%";
        caughtFish.style.left = "50%";
        caughtFish.style.transform = "translate(-50%, -50%)";
        caughtFish.style.width = "150px";
        caughtFish.style.height = "auto";
        caughtFish.style.zIndex = "999";

        const fishText = document.createElement("div");
        fishText.textContent = `You have caught ${selectedFish.name}!`;
        fishText.style.position = "absolute";
        fishText.style.top = "50%";
        fishText.style.left = "50%";
        fishText.style.transform = "translate(-50%, -50%)";
        fishText.style.fontSize = "1.5rem";
        fishText.style.fontFamily = "'Prompt', Arial, sans-serif";
        fishText.style.color = "white";
        fishText.style.textAlign = "center";
        fishText.style.zIndex = "999";

        sandbox.appendChild(caughtFish);
        sandbox.appendChild(fishText);

        window.parent.postMessage({
            type: "addItemToInventory",
            itemId: selectedFish.id
        }, "*");
    } else {
        const msgEl = document.getElementById('game-message');
        msgEl.style.display = 'block';
        msgEl.textContent = "The fish slipped out of your hand...";
    }

    // remove fish element
    fishElement?.remove();
    fishElement = null;
}



// If DOM loaded, run init
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPingPongFish);
} else {
    initPingPongFish();
}
