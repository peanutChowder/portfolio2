export interface ItemData {
    id: string;
    name: string;
    type: "fish" | "rod" | "sellable" | "non-sellable" | "upgrade";
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
        description: "Is that a fish, or somebody's radiator?", 
        cost: 13 
    },
    "fish4": { 
        id: "fish4", 
        name: "Sherbert Swimmer", 
        type: "fish", 
        imgSrc: "4.png", 
        description: "Its beams of warmth make you feel like you're a child on a playground again.", 
        cost: 65 
    },
    "fish5": { 
        id: "fish5", 
        name: "Big Rig", 
        type: "fish", 
        imgSrc: "5.png", 
        description: "Rugged like a truck commercial, it barrels through the muck with brutality.", 
        cost: 23 
    },
    "fish6": { 
        id: "fish6", 
        name: "Swampy Guy", 
        type: "fish", 
        imgSrc: "6.png", 
        description: "Touching it leaves you with a permanent body odor.", 
        cost: 12 
    },
    "fish7": { 
        id: "fish7", 
        name: "Atlantic Iceberg", 
        type: "fish", 
        imgSrc: "7.png", 
        description: "It reminds you of unbelievable icebergs, but with a fishy smell.", 
        cost: 50 
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
        description: "A sparkle of light that turns the frowniest of frowns updside down.", 
        cost: 52 
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
        name: "Joe", 
        type: "fish", 
        imgSrc: "11.png", 
        description: "This might just be the most average fish to grace the seas.", 
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
        description: "It hurts to touch, but otherwise seems like a laid back fella.", 
        cost: 85 
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
        name: "Highlighter Goblin", 
        type: "fish", 
        imgSrc: "20.png", 
        description: "Somebody broke this fish's heart, so it trained for months in a sewer causing it to glow with power.", 
        cost: 51 
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
        name: "Winter Whisperer", 
        type: "fish", 
        imgSrc: "22.png", 
        description: "Like chewing minty gum in the winter, this fish gives you chills just by being around.", 
        cost: 63 
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
        cost: 81 
    },
    "fish29": { 
        id: "fish29", 
        name: "Little Golden's Brother", 
        type: "fish", 
        imgSrc: "29.png", 
        description: "Not quite as golden, not quite as lucky, but always swimming just a little behind.", 
        cost: 15 
    },
    // ----------------------- FISHING RODS -----------------------
    "rod1": {
        id: "rod1",
        name: "Stick rod",
        type: "rod",
        imgSrc: "stick_rod.png",
        description: "A stick that you wack fish with.",
        cost: 0,
        durability: 100,
        specialEffect: "class1"
    },
    "rod2": {
        id: "rod2",
        name: "Antique rod",
        type: "rod",
        imgSrc: "antique_rod.png",
        description: "Wash your hands after using it, way too many hands have touched it.",
        cost: 60,
        durability: 100,
        specialEffect: "class2"
    },
    "rod3": {
        id: "rod3",
        name: "Techno rod",
        type: "rod",
        imgSrc: "advanced_rod.png",
        description: "We got this rod instead of flying cars.",
        cost: 180,
        durability: 100,
        specialEffect: "class3"
    },
    "rod4": {
        id: "rod4",
        name: "Imaginary rod",
        type: "rod",
        imgSrc: "cartoon_rod.png",
        description: "You manifested a drawing into an actual fishing rod.",
        cost: 270,
        durability: 100,
        specialEffect: "class4"
    },
    "rod5": {
        id: "rod5",
        name: "Magical rod",
        type: "rod",
        imgSrc: "wand_rod.png",
        description: "It's not even a fishing rod. But legends speak of its omnipotent power.",
        cost: 450,
        durability: 100,
        specialEffect: "class5"
    },
    "rod6": {
        id: "rod6",
        name: "Canadian rod",
        type: "rod",
        imgSrc: "hockey_rod.png",
        description: "Eh?",
        cost: 1000,
        durability: 100,
        specialEffect: "class6"
    },

    // ----------------------- INVENTORY + SAFEHOUSE STORAGE UPGRADES -----------------------
    "upgrade_inventory": {
        id: "upgrade_inventory",
        name: "Boat Inventory Upgrade",
        type: "upgrade", 
        imgSrc: "capacity-boat.png", 
        description: "Increases your boat's inventory capacity by 3 slots.",
        cost: 80
    },
    "upgrade_safehouse": {
        id: "upgrade_safehouse",
        name: "Safehouse Storage Upgrade",
        type: "upgrade",
        imgSrc: "capacity-safehouse.png", 
        description: "Expands safehouse storage by 5 slots.",
        cost: 60
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
