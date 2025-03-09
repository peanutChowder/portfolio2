function initFishGame() {
    console.log("Fish punch is starting!");

    const CROSSHAIR_RADIUS = 40; 
    const FISH_WIDTH = 60;
    const FISH_HEIGHT = 40;
    const FISH_SPAWN_INTERVAL = 1500; // ms
    const MIN_SPEED = 80;  // px/sec
    const MAX_SPEED = 180; // px/sec
    const MAX_HITS = 5;
    const MAX_MISSES = 3;

    let hits = 0;
    let misses = 0;
    let gameOver = false;

    const sandboxContent = document.getElementById('sandbox-content');
    const hudHits = document.getElementById('hits');
    const hudMisses = document.getElementById('misses');
    const message = document.getElementById('message');

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
    fishingRod.src = "../../assets/fishing/rod_ingame.png"; // Default to resting state
    sandboxContent.appendChild(fishingRod);

    // Start spawning fish
    console.log("Starting fish spawn interval...");
    const spawnIntervalId = setInterval(spawnFish, FISH_SPAWN_INTERVAL);

    // Listen for clicks
    sandboxContent.addEventListener('pointerdown', onPointerDown);

    function onPointerDown(e) {
        // Set to casting state
        fishingRod.classList.add('casting');

        // Restore to resting state after animation
        setTimeout(() => {
            fishingRod.classList.remove('casting');
        }, 400);

        if (gameOver) return;

        let hitSomething = false;
        const rect = sandboxContent.getBoundingClientRect();
        const crosshairCenterX = rect.width / 2;
        const crosshairCenterY = rect.height / 2;

        document.querySelectorAll('.fish').forEach(fishEl => {
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
                if (hits >= MAX_HITS) showEndMessage(true);
            }
        });

        if (!hitSomething) {
            misses++;
            updateHUD();
            if (misses >= MAX_MISSES) showEndMessage(false);
        }
    }


    function updateHUD() {
        hudHits.textContent = `Hits: ${hits}`;
        hudMisses.textContent = `Misses: ${misses}`;
    }

    function showEndMessage(won) {
        gameOver = true;
        message.style.display = 'block';
        message.textContent = won ? 'YOU WIN!' : 'YOU LOSE!';
        clearInterval(spawnIntervalId);
        document.querySelectorAll('.fish').forEach(el => el.remove());
    }

    function spawnFish() {
        if (gameOver) return;
    
        console.log(" Spawning Fish...");
    
        const rect = sandboxContent.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
    
        const fishEl = document.createElement("img");
        fishEl.classList.add("fish");
        fishEl.src = "../../assets/fish-sprites/1.png"; 
    
        const direction = Math.random() < 0.5 ? 0 : 1;
        const randomY = randInt(50, containerHeight - 50);
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
    
    // Close button removes overlay
    document.querySelector('.close-button')?.addEventListener('click', () => {
        document.getElementById('sandbox-wrapper')?.remove();
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
