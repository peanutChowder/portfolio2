import { getRandomFishByCost } from "../fishData.ts";

function initFishGame() {
    console.log("Fish punch is starting!");

    const CROSSHAIR_RADIUS = 50; 
    const FISH_WIDTH = 60;
    const FISH_HEIGHT = 40;
    const FISH_SPAWN_INTERVAL = 1500; // ms
    const MIN_SPEED = 80;  // px/sec
    const MAX_SPEED = 220; // px/sec
    const MAX_HITS = 5;
    const MAX_MISSES = 3;

    let hits = 0;
    let misses = 0;
    let gameOver = false;
    let gameStarted = false; // Track if the game has started
    let spawnIntervalId = null;

    const sandboxContent = document.getElementById('sandbox-content');
    const hudHits = document.getElementById('hits');
    const hudMisses = document.getElementById('misses');
    const message = document.getElementById('message');

    let selectedFish = null;

    if (!sandboxContent) {
        console.error("sandbox-content not found! JavaScript may be executing before DOM is loaded.");
        return;
    }

    // Random int between [min, max]
    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // Create the fishing rod element
    const fishingRod = document.createElement('img');
    fishingRod.id = "fishing-rod";
    fishingRod.src = "../../assets/fishing/rod_ingame.png";
    sandboxContent.appendChild(fishingRod);

    // Select a fish
    selectedFish = getRandomFishByCost();
    console.log(`Selected fish: ${selectedFish.id}`);

    console.log(selectedFish);

    // Create game message element for instructions & status updates
    const gameMessage = document.createElement("div");
    gameMessage.id = "game-message";
    gameMessage.style.position = "absolute";
    gameMessage.style.top = "30%";
    gameMessage.style.left = "50%";
    gameMessage.style.transform = "translate(-50%, -50%)";
    gameMessage.style.fontSize = "2rem";
    gameMessage.style.fontFamily = "'Prompt', Arial, sans-serif";
    gameMessage.style.color = "white";
    gameMessage.style.textAlign = "center";
    gameMessage.style.pointerEvents = "none"; // Don't block clicks
    gameMessage.style.opacity = "1"; // Visible initially
    gameMessage.style.transition = "opacity 0.5s ease-in-out";
    gameMessage.textContent = "Click when the fish enter the target circle to capture fish. Make sure not to spam the fishing rod to not scare away the fish! Click to begin.";
    sandboxContent.appendChild(gameMessage);

    function showGameMessage(text) {
        gameMessage.textContent = text;
        gameMessage.style.opacity = "1";

        // Hide the message after 1.5 seconds
        setTimeout(() => {
            gameMessage.style.opacity = "0";
        }, 1500);
    }

    // Listen for first click to start the game
    sandboxContent.addEventListener('pointerdown', startGame, { once: true });

    function startGame() {
        gameStarted = true;
        console.log("Game started!");

        // Hide the instruction message
        gameMessage.style.opacity = "0";

        // Start spawning fish
        spawnIntervalId = setInterval(spawnFish, FISH_SPAWN_INTERVAL);

        // Replace event listener for gameplay clicks
        sandboxContent.addEventListener('pointerdown', onPointerDown);
    }

    function onPointerDown(e) {
        if (!gameStarted || gameOver) return; // Ignore clicks before game starts or after it ends

        // Set to casting state
        fishingRod.classList.add("casting");
    
        // Restore to resting state after animation
        setTimeout(() => {
            fishingRod.classList.remove("casting");
        }, 400);

        let hitSomething = false;
        const rect = sandboxContent.getBoundingClientRect();
        const crosshairCenterX = rect.width / 2;
        const crosshairCenterY = rect.height / 2;
    
        document.querySelectorAll(".fish").forEach(fishEl => {
            const fishRect = fishEl.getBoundingClientRect();
            const fishCenterX = fishRect.left - rect.left + fishRect.width / 2;
            const fishCenterY = fishRect.top - rect.top + fishRect.height / 2;
            const dx = fishCenterX - crosshairCenterX;
            const dy = fishCenterY - crosshairCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);
    
            if (dist < CROSSHAIR_RADIUS) {
                hitSomething = true;
                hits++;
                updateHUD();
                fishEl.remove();
    
                if (hits >= MAX_HITS) {
                    showEndMessage(true);
                } else {
                    showGameMessage(`${MAX_HITS - hits} more fish to go!`);
                }
            }
        });
    
        if (!hitSomething) {
            misses++;
            updateHUD();
    
            if (misses >= MAX_MISSES) {
                showEndMessage(false);
            } else {
                showGameMessage(`The fish have been spooked! ${MAX_MISSES - misses} more tries left`);
            }
        }
    }


    function updateHUD() {
        hudHits.textContent = `Hits: ${hits}`;
        hudMisses.textContent = `Misses: ${misses}`;
    }

    function showEndMessage(won) {
        gameOver = true;
        message.style.display = 'block';
        message.textContent = won ? 'FISH ACQUIRED!' : 'THE FISH WERE SPOOKED AWAY!';
        clearInterval(spawnIntervalId);
        
        const crosshair = document.getElementById('crosshair');
        if (crosshair) {
            crosshair.style.display = 'none'
        }
        document.querySelectorAll('.fish').forEach(el => el.remove());
    
        if (won) {    
            // Create and display the caught fish image
            const caughtFish = document.createElement("img");
            caughtFish.src = `../../assets/fish-sprites/${selectedFish.id}.png`;
            caughtFish.style.position = "absolute";
            caughtFish.style.top = "65%"; 
            caughtFish.style.left = "50%";
            caughtFish.style.transform = "translate(-50%, -50%)";
            caughtFish.style.width = "150px"; 
            caughtFish.style.height = "auto";
    
            // Create text below the fish image
            const fishText = document.createElement("div");
            fishText.textContent = `You have caught ${selectedFish.name}!`;
            fishText.style.position = "absolute";
            fishText.style.top = "70%"; // Position below the fish
            fishText.style.left = "50%";
            fishText.style.transform = "translate(-50%, -50%)";
            fishText.style.fontSize = "1.5rem";
            fishText.style.fontFamily = "'Prompt', Arial, sans-serif";
            fishText.style.color = "white";
            fishText.style.textAlign = "center";
    
            // Append both elements to the sandbox content
            sandboxContent.appendChild(caughtFish);
            sandboxContent.appendChild(fishText);
        }
    }
    

    function spawnFish() {
        if (gameOver || !gameStarted) return;

        console.log("Spawning Fish...");

        const rect = sandboxContent.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
    
        const fishEl = document.createElement("img");
        fishEl.classList.add("fish");
        fishEl.src = `../../assets/fish-sprites/${selectedFish.id}.png`; 
    
        const direction = Math.random() < 0.5 ? 0 : 1;
        const randomY = randInt((containerHeight / 2 - 200), (containerHeight / 2 + 200));
        let startX = direction === 0 ? -FISH_WIDTH : containerWidth;
        let endX = direction === 0 ? containerWidth : -FISH_WIDTH;
    
        fishEl.style.top = randomY + "px";
        fishEl.style.left = startX + "px";
    
        // Flip the fish when moving right
        if (direction === 1) {
            fishEl.style.transform = "scale(2)";
        } else {
            fishEl.style.transform = "scale(-2, 2)";
        }
    
        sandboxContent.appendChild(fishEl);
    
        const speed = randInt(MIN_SPEED, MAX_SPEED);
        const oscillationRate = randInt(2, 6); 
        const oscillationAmplitude = randInt(5, 20); // Vertical movement range (px)
        let startTime = null;
    
        function animateFish(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime) / 1000;
            const dist = speed * elapsed;
    
            let fraction;
            if (direction === 0) {
                fraction = dist / (endX - startX);
            } else {
                fraction = dist / (startX - endX);
            }
    
            if (fraction >= 1) {
                fishEl.remove();
            } else {
                let newX;
                if (direction === 0) {
                    newX = startX + (endX - startX) * fraction;
                } else {
                    newX = startX - (startX - endX) * fraction;
                }
    
                // Unique oscillation per fish
                const verticalOffset = Math.sin(elapsed * oscillationRate) * oscillationAmplitude;
                fishEl.style.top = (randomY + verticalOffset) + "px";
                fishEl.style.left = newX + "px";
                requestAnimationFrame(animateFish);
            }
        }
    
        requestAnimationFrame(animateFish);
    }
    
    // Close button sends message to phaser
    document.querySelector('.close-button')?.addEventListener('click', () => {
        window.parent.postMessage({ type: "destroyGameOverlay", overlayName: "fishPunch" }, "*");
    });    
}

// Run `initFishGame()` immediately if DOM is ready
if (document.readyState === "loading") {
    console.log(" Waiting for DOM...");
    document.addEventListener("DOMContentLoaded", initFishGame);
} else {
    console.log(" DOM already loaded! Running initFishGame immediately.");
    initFishGame();
}
