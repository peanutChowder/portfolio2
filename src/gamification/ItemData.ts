interface ItemData {
    id: string;
    name: string;
    type: "fish" | "rod" | "sellable" | "non-sellable";
    imgSrc: string;
    description: string;
    cost?: number;           // For sellable items
    durability?: number;     // For rods
    specialEffect?: string;  // For rods/treasures
    collectibleSet?: string; // For non-sellable treasures
}

const itemData: Record<string, ItemData> = {
    // ----------------------- FISH -----------------------
    "fish1": { 
        id: "fish1", 
        name: "Little Golden", 
        type: "fish", 
        imgSrc: "1.png", 
        description: "A happy golden fish that's there to keep your spirits up when you feel down.", 
        cost: 8 
    },
    "fish2": { 
        id: "fish2", 
        name: "Ultraviolet Dude", 
        type: "fish", 
        imgSrc: "2.png", 
        description: "A radiant fish glowing in shades unseen by most. It hums a silent song of deep waters.", 
        cost: 20 
    },
    "fish3": { 
        id: "fish3", 
        name: "Yellowvent", 
        type: "fish", 
        imgSrc: "3.png", 
        description: "Darting like a streak of sunlit lightning, this fish brings light to even the murkiest waters.", 
        cost: 13 
    },
    "fish4": { 
        id: "fish4", 
        name: "Sherbert Dude", 
        type: "fish", 
        imgSrc: "4.png", 
        description: "A swirled masterpiece of color, as if the ocean itself took a sip of summer’s sweetness.", 
        cost: 18 
    },
    "fish5": { 
        id: "fish5", 
        name: "Muddy Guy", 
        type: "fish", 
        imgSrc: "5.png", 
        description: "Rugged and unbothered, this fish carries the secrets of the riverbed on its scales.", 
        cost: 23 
    },
    "fish6": { 
        id: "fish6", 
        name: "Swampy Guy", 
        type: "fish", 
        imgSrc: "6.png", 
        description: "A silent guardian of murky waters, its greenish hues blend with nature’s untouched whispers.", 
        cost: 12 
    },
    "fish7": { 
        id: "fish7", 
        name: "Cool Mint", 
        type: "fish", 
        imgSrc: "7.png", 
        description: "A refreshing presence, like the crisp ocean breeze on an early morning sail.", 
        cost: 30 
    },
    "fish8": { 
        id: "fish8", 
        name: "Ultraviolet Scaly", 
        type: "fish", 
        imgSrc: "8.png", 
        description: "A luminescent wanderer, shimmering in twilight hues beyond mortal sight.", 
        cost: 24 
    },
    "fish9": { 
        id: "fish9", 
        name: "Pacific Sunshine", 
        type: "fish", 
        imgSrc: "9.png", 
        description: "A splash of pure joy, its golden glow mirrors the rising sun over the horizon.", 
        cost: 27 
    },
    "fish10": { 
        id: "fish10", 
        name: "Creepy Crawly", 
        type: "fish", 
        imgSrc: "10.png", 
        description: "Lurking in the deep, this fish has seen things you wouldn’t believe.", 
        cost: 19 
    },
    "fish11": { 
        id: "fish11", 
        name: "Boring Fish", 
        type: "fish", 
        imgSrc: "11.png", 
        description: "This fish has no remarkable features... except that it exists.", 
        cost: 5 
    },
    "fish12": { 
        id: "fish12", 
        name: "Sunny Beachy", 
        type: "fish", 
        imgSrc: "12.png", 
        description: "A vibrant soul who thrives where the waves kiss the shore.", 
        cost: 30 
    },
    "fish13": { 
        id: "fish13", 
        name: "Laser Fish", 
        type: "fish", 
        imgSrc: "13.png", 
        description: "A fish so fast, it leaves streaks of neon light behind it.", 
        cost: 27 
    },
    "fish14": { 
        id: "fish14", 
        name: "Smelly Fish", 
        type: "fish", 
        imgSrc: "14.png", 
        description: "An unfortunate but lovable fish. Its aroma ensures no predators dare to get close.", 
        cost: 8 
    },
    "fish15": { 
        id: "fish15", 
        name: "Brown Marauder", 
        type: "fish", 
        imgSrc: "15.png", 
        description: "A fearless rogue of the deep, its earthy hues blend into the shadows of the seabed.", 
        cost: 36 
    },
    "fish16": { 
        id: "fish16", 
        name: "Earth Fish", 
        type: "fish", 
        imgSrc: "16.png", 
        description: "A gentle wanderer, carrying the wisdom of the currents in its ancient scales.", 
        cost: 28 
    },
    "fish17": { 
        id: "fish17", 
        name: "Rusty Fish", 
        type: "fish", 
        imgSrc: "17.png", 
        description: "Coated in the stories of old shipwrecks, this fish thrives where relics of the past rest.", 
        cost: 32 
    },
    "fish18": { 
        id: "fish18", 
        name: "Radioactive Fella", 
        type: "fish", 
        imgSrc: "18.png", 
        description: "Glowing with an eerie green, this fish has seen some things it wishes it hadn't.", 
        cost: 45 
    },
    "fish19": { 
        id: "fish19", 
        name: "Scaly Sunset", 
        type: "fish", 
        imgSrc: "19.png", 
        description: "Its scales flicker with warm hues of dusk, a living sunset beneath the waves.", 
        cost: 32 
    },
    "fish20": { 
        id: "fish20", 
        name: "Highlighter Fish", 
        type: "fish", 
        imgSrc: "20.png", 
        description: "Glowing in brilliant neon, this fish looks like a school supply that came to life.", 
        cost: 35 
    },
    "fish21": { 
        id: "fish21", 
        name: "Mystifying Fish", 
        type: "fish", 
        imgSrc: "21.png", 
        description: "An enigma of the sea. Some say it whispers the secrets of the ocean if you listen closely.", 
        cost: 90 
    },
    "fish22": { 
        id: "fish22", 
        name: "The Eyebrow", 
        type: "fish", 
        imgSrc: "22.png", 
        description: "This fish looks at you with a knowing glance, as if it's judging your every move.", 
        cost: 35 
    },
    "fish23": { 
        id: "fish23", 
        name: "Moustached Magic", 
        type: "fish", 
        imgSrc: "23.png", 
        description: "A gentleman of the deep, its fine moustache makes it look wise beyond its years.", 
        cost: 40 
    },
    "fish24": { 
        id: "fish24", 
        name: "Annoying Orange", 
        type: "fish", 
        imgSrc: "24.png", 
        description: "It pierces your eyes with its vibrant hues.", 
        cost: 25 
    },
    "fish25": { 
        id: "fish25", 
        name: "Sleek Fella", 
        type: "fish", 
        imgSrc: "25.png", 
        description: "What an incredibly smooth fella. You yearn to be his friend.", 
        cost: 40 
    },
    "fish26": { 
        id: "fish26", 
        name: "Itchy Fish", 
        type: "fish", 
        imgSrc: "26.png", 
        description: "AHHH I can't stop itching!!!", 
        cost: 52 
    },
    "fish27": { 
        id: "fish27", 
        name: "Bullheaded Feather Fish", 
        type: "fish", 
        imgSrc: "27.png", 
        description: "A stubborn warrior of the sea, decorated with elegant fins that dance like feathers in the current.", 
        cost: 45 
    },
    "fish28": { 
        id: "fish28", 
        name: "Big Confusion", 
        type: "fish", 
        imgSrc: "28.png", 
        description: "What?", 
        cost: 55 
    },
    "fish29": { 
        id: "fish29", 
        name: "Little Golden's Brother", 
        type: "fish", 
        imgSrc: "29.png", 
        description: "Not quite as golden, not quite as lucky, but always swimming just a little behind.", 
        cost: 15 
    }

};

function getRandomFishByCost(minCost: number, maxCost: number) {
    // Filter itemData for fish within the cost range
    const fishItems = Object.values(itemData).filter(
        item => item.type === "fish" && item.cost !== undefined && item.cost >= minCost && item.cost <= maxCost
    );

    // If no fish are within the range, return null
    if (fishItems.length === 0) return null;

    // Calculate inverse costs for weighted selection
    const inverseWeights = fishItems.map(fish => ({
        id: fish.id,
        name: fish.name,
        imgSrc: fish.imgSrc,
        cost: fish.cost as number,
        weight: 1 / (fish.cost as number)
    }));

    // Normalize weights
    const totalWeight = inverseWeights.reduce((sum, fish) => sum + fish.weight, 0);
    const normalizedWeights = inverseWeights.map(fish => ({
        id: fish.id,
        name: fish.name,
        imgSrc: fish.imgSrc,
        probability: fish.weight / totalWeight
    }));

    // Perform weighted random selection
    let randomValue = Math.random();
    let cumulativeProbability = 0;

    for (const fish of normalizedWeights) {
        cumulativeProbability += fish.probability;
        if (randomValue <= cumulativeProbability) {
            return { id: fish.id, name: fish.name, imgSrc: fish.imgSrc };
        }
    }

    // Fallback (shouldn't happen)
    console.error("Failed to select a fish within the cost range");
    return null;
}

export { itemData, getRandomFishByCost };
