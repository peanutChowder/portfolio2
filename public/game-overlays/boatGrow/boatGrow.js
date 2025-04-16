import { getRandomFishByCost } from "/src/gamification/ItemData.ts";

// Global config + state
let energyCost = 0;  
let minCost = 0;     
let maxCost = 999;   

// Boat stats
let boatSize = 25;       // 1/4 size at start
const boatMaxSize = 100; 

// Movement toward pointer
let boatX = 400; // start coords
let boatY = 300;
let pointerX = boatX;
let pointerY = boatY;
const BOAT_SPEED = 3.0;  // px/frame

// Selected fish
let selectedFish = null;

// Basic fish structure
const fishes = [];
let fishSpawnIntervalId = null;
const SPAWN_INTERVAL = 1000; // ms
const FISH_BASE_SPEED = 2;   // px/frame baseline
const MAX_BOUNCES = 2;       // remove fish after n bounces
const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;

let gameOver = false;
let gameStatus = "nostart"; // "nostart" | "won" | "lost"

// DOM Elements
let sandboxContent;
let boatEl;
let boatSizeBar; 
let boatSizeDisplay;
let messageEl;
let gameMessageEl;

function initBoatGrowGame() {
    console.log("[boatGrow] Waiting to start...");

    sandboxContent = document.getElementById('sandbox-content');
    boatEl = document.getElementById('boat');
    boatSizeBar = document.getElementById('health-bar-fill');
    boatSizeDisplay = document.getElementById('boat-size-display');
    messageEl = document.getElementById('message');
    gameMessageEl = document.getElementById('game-message');

    if (!sandboxContent || !boatEl || !gameMessageEl) {
        console.error("[boatGrow] DOM not ready, check your HTML elements.");
        return;
    }

    // Place boat at center
    boatX = GAME_WIDTH * 0.5;
    boatY = GAME_HEIGHT * 0.5;
    updateBoatPosition();

    // Initialize visual boat size and grow bar
    updateBoatSizeVisual();
    updateGrowBar();

    // Show instructions
    gameMessageEl.style.opacity = "1";
    gameMessageEl.textContent = "Click to begin.\nEat smaller fish to grow.\nAvoid big ones or you’ll lose growth!";

    // Wait for first click to start game
    sandboxContent.addEventListener('pointerdown', startGame, { once: true });

    // Close button
    document.querySelector('.close-button')?.addEventListener('click', () => {
        window.parent.postMessage({
            type: "destroyGameOverlay",
            overlayName: "boatGrow",
            result: gameStatus
        }, "*");
    });
}

function startGame() {
    selectedFish = getRandomFishByCost(minCost, maxCost);
    console.log("Selected fish: ", selectedFish.name);
    console.log("[boatGrow] Game started!");
    gameStatus = "started";

    // Hide instructions
    gameMessageEl.style.opacity = "0";

    // Send energy reduction to parent
    window.parent.postMessage({
        type: "reduceEnergy",
        amount: energyCost
    }, "*");

    // Listen for pointer movement
    sandboxContent.addEventListener('pointermove', (e) => {
        const rect = sandboxContent.getBoundingClientRect();
        pointerX = e.clientX - rect.left;
        pointerY = e.clientY - rect.top;
    });

    // Begin spawning and game loop
    fishSpawnIntervalId = setInterval(spawnFish, SPAWN_INTERVAL);
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (gameOver) return;

    // 1) Move boat toward pointer
    moveBoat();

    // 2) Update fish positions, check collisions
    updateFishes();

    // 3) Request next frame
    requestAnimationFrame(gameLoop);
}

function moveBoat() {
    // Simple linear interpolation
    const dx = pointerX - boatX;
    const dy = pointerY - boatY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
        boatX += (dx / dist) * BOAT_SPEED;
        boatY += (dy / dist) * BOAT_SPEED;
        updateBoatPosition();
    }
}

function updateBoatPosition() {
    boatEl.style.transform = `translate(${boatX - boatSize / 2}px, ${boatY - boatSize / 2}px)`;
}

// Scale boat visually with boatSize
function updateBoatSizeVisual() {
    boatEl.style.width = `${boatSize * 1.5}px`;
    boatEl.style.height = `${boatSize * 1.5}px`;
    // Optionally update the background image if selectedFish is available
    if (selectedFish && selectedFish.imgSrc) {
        boatEl.style.backgroundImage = "/assets/boat/boatE.png";
    }
    boatEl.style.backgroundSize = "contain";
    boatEl.style.backgroundRepeat = "no-repeat";
    boatEl.style.backgroundPosition = "center";

    boatSizeDisplay.textContent = `Size: ${Math.floor(boatSize)}`;
}

// Update the grow bar based on boatSize
function updateGrowBar() {
    const pct = (boatSize / boatMaxSize) * 100;
    boatSizeBar.style.width = `${pct}%`;
}

function spawnFish() {
    if (gameOver) return;

    const fishEl = document.createElement('div');
    fishEl.classList.add('fish');

    // Random size remains unchanged
    const size = randomInt(Math.max(1, boatSize - 30), Math.min(boatSize + 30, 100));
    fishEl.style.width = `${size * 1.5}px`;
    fishEl.style.height = `${size * 1.5}px`;
    fishEl.dataset.size = size.toString();

    fishEl.style.backgroundImage = `url("/assets/fish-sprites/${selectedFish.imgSrc}")`;

    console.log("spawned fish with sprite:", fishEl.style.backgroundImage);

    // Start at the "pipe" on left
    const pipeRect = document.getElementById('spawn-pipe').getBoundingClientRect();
    const spawnY = pipeRect.top + randomInt(0, pipeRect.height);

    fishEl.style.left = `${pipeRect.right}px`;
    fishEl.style.top = `${spawnY}px`;

    // Velocity + direction
    const speed = FISH_BASE_SPEED + Math.random() * 2;
    const angleDeg = randomInt(-45, 45);
    const angleRad = angleDeg * (Math.PI / 180);
    const vx = Math.cos(angleRad) * speed;
    const vy = Math.sin(angleRad) * speed;

    fishEl.dataset.vx = vx.toString();
    fishEl.dataset.vy = vy.toString();
    fishEl.dataset.bounces = "0"; // count wall bounces

    sandboxContent.appendChild(fishEl);
    fishes.push(fishEl);
}


function updateFishes() {
    for (let i = fishes.length - 1; i >= 0; i--) {
        const fishEl = fishes[i];
        let vx = parseFloat(fishEl.dataset.vx);
        let vy = parseFloat(fishEl.dataset.vy);
        let x = parseFloat(fishEl.style.left);
        let y = parseFloat(fishEl.style.top);
        let bounces = parseInt(fishEl.dataset.bounces);

        // Optional drift: if fish is significantly larger, nudge it toward the boat
        const fishSize = parseFloat(fishEl.dataset.size);
        if (fishSize > boatSize + 15) {
            const dx = boatX - x;
            const dy = boatY - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                vx += 0.01 * (dx / dist);
                vy += 0.01 * (dy / dist);
            }
        }

        // Apply velocity
        x += vx;
        y += vy;

        // Bounce off edges
        if (y <= 0 || (y + fishSize) >= GAME_HEIGHT) {
            vy = -vy;
            bounces++;
            fishEl.dataset.bounces = bounces.toString();
        }
        if (x <= 0 || (x + fishSize) >= GAME_WIDTH) {
            vx = -vx;
            bounces++;
            fishEl.dataset.bounces = bounces.toString();
        }

        // Update position
        fishEl.style.left = `${x}px`;
        fishEl.style.top = `${y}px`;
        fishEl.dataset.vx = vx.toString();
        fishEl.dataset.vy = vy.toString();

        // Remove fish if bounced too many times
        if (bounces >= MAX_BOUNCES) {
            removeFish(fishEl, i);
            continue;
        }

        // Color glow based on edibility
        if (fishSize < boatSize) {
            fishEl.classList.add("can-eat");
            fishEl.classList.remove("too-big");
        } else {
            fishEl.classList.add("too-big");
            fishEl.classList.remove("can-eat");
        }

        // Check collision with boat
        const boatRadius = boatSize * 0.5;
        const fishRadius = fishSize * 0.5;
        const centerBoatX = boatX;
        const centerBoatY = boatY;
        const centerFishX = x + fishRadius;
        const centerFishY = y + fishRadius;

        const dx = centerFishX - centerBoatX;
        const dy = centerFishY - centerBoatY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < (boatRadius + fishRadius)) {
            // Collision!
            if (fishSize < boatSize) {
                // Eat fish: increase boatSize
                boatSize += fishSize * 0.4;
                if (boatSize > boatMaxSize) boatSize = boatMaxSize;
                removeFish(fishEl, i);
                updateBoatSizeVisual();
                updateGrowBar();
                checkWinCondition();
            } else {
                // Take damage: decrease boatSize
                boatSize -= fishSize * 0.3;
                if (boatSize < 0) boatSize = 0;
                removeFish(fishEl, i);
                updateBoatSizeVisual();
                updateGrowBar();
                if (boatSize <= 0) {
                    endGame(false);
                }
            }
        }
    }
}

function removeFish(fishEl, index) {
    // Remove from DOM and from array
    fishEl.remove();
    fishes.splice(index, 1);
}

function checkWinCondition() {
    if (boatSize >= boatMaxSize) {
        endGame(true);
    }
}

function endGame(won) {
    gameOver = true;
    gameStatus = won ? "won" : "lost";

    messageEl.style.display = "block";
    messageEl.textContent = won ? "YOU WIN!\nFish Caught!" : "YOU LOST!\nBoat Destroyed.";
    clearInterval(fishSpawnIntervalId);

    if (won) {
        // Display the caught fish image and a text message on win
        const caughtFish = document.createElement("img");
        caughtFish.src = `/assets/fish-sprites/${selectedFish.imgSrc}`;
        caughtFish.style.position = "absolute";
        caughtFish.style.top = "45%";
        caughtFish.style.left = "50%";
        caughtFish.style.transform = "translate(-50%, -50%)";
        caughtFish.style.width = "150px";
        caughtFish.style.height = "auto";

        const fishText = document.createElement("div");
        fishText.textContent = `You have caught ${selectedFish.name}!`;
        fishText.style.position = "absolute";
        fishText.style.top = "70%";
        fishText.style.left = "50%";
        fishText.style.transform = "translate(-50%, -50%)";
        fishText.style.fontSize = "1.5rem";
        fishText.style.fontFamily = "'Prompt', Arial, sans-serif";
        fishText.style.color = "white";
        fishText.style.textAlign = "center";

        sandboxContent.appendChild(caughtFish);
        sandboxContent.appendChild(fishText);

        window.parent.postMessage({
            type: "addItemToInventory",
            itemId: selectedFish.id
        }, "*");
    }

    setTimeout(() => {
        // Optionally automatically close the overlay after a delay
        // window.parent.postMessage({ type: "destroyGameOverlay", overlayName: "boatGrow", result: gameStatus }, "*");
    }, 1500);
}

window.addEventListener('message', (e) => {
    if (e.data?.type === 'gameSetup') {
        energyCost = e.data.energyCost || 0;
        minCost = e.data.minCost ?? 0;
        maxCost = e.data.maxCost ?? 999;
        console.log("[boatGrow] Setup => cost range:", minCost, "-", maxCost, "energyCost:", energyCost);
    }
});

// Utility
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Run init on DOM ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBoatGrowGame);
} else {
    initBoatGrowGame();
}
