const fishData = {
    1: {
        name: "Little Golden",
        cost: 8
    },
    2: {
        name: "Ultraviolet Dude",
        cost: 20
    },
    3: {
        name: "Yellowvent",
        cost: 13
    },
    4: {
        name: "Sherbert Dude",
        cost: 18
    },
    5: {
        name: "Muddy Guy",
        cost: 23
    },
    6: {
        name: "Swampy Guy",
        cost: 12
    },
    7: {
        name: "Cool Mint",
        cost: 30
    },
    8: {
        name: "Ultraviolet Scaly",
        cost: 24
    },
    9: {
        name: "Pacific Sunshine",
        cost: 27
    },
    10: {
        name: "Creepy Crawly",
        cost: 19
    },
    11: {
        name: "Boring Fish",
        cost: 5
    },
    12: {
        name: "Sunny Beachy",
        cost: 30
    },
    13: {
        name: "Laser Fish",
        cost: 27
    },
    14: {
        name: "Smelly Fish",
        cost: 8
    },
    15: {
        name: "Brown Marauder",
        cost: 36
    },
    16: {
        name: "Earth Fish",
        cost: 28
    },
    17: {
        name: "Rusty Fish",
        cost: 32
    },
    18: {
        name: "Radioactive Fella",
        cost: 45
    },
    19: {
        name: "Scaly Sunset",
        cost: 32
    },
    20: {
        name: "Highlighter Fish",
        cost: 35
    },
    21: {
        name: "Mystifying Fish",
        cost: 90
    },
    22: {
        name: "The Eyebrow",
        cost: 35
    },
    23: {
        name: "Moustached Magic",
        cost: 40
    },
    24: {
        name: "Annoying Orange",
        cost: 25
    },
    25: {
        name: "Sleek Fella",
        cost: 40
    },
    26: {
        name: "Itchy Fish",
        cost: 52
    },
    27: {
        name: "Bullheaded Feather Fish",
        cost: 45
    },
    28: {
        name: "Big Confusion",
        cost: 55
    },
    29: {
        name: "Little Golden's Brother",
        cost: 15
    },
}

function getRandomFishByCost() {
    const fishEntries = Object.entries(fishData);

    // Calculate inverse costs
    const inverseWeights = fishEntries.map(([id, fish]) => ({
        id: Number(id),
        name: fish.name,
        cost: fish.cost,
        weight: 1 / fish.cost
    }));

    // Normalize weights
    const totalWeight = inverseWeights.reduce((sum, fish) => sum + fish.weight, 0);
    const normalizedWeights = inverseWeights.map(fish => ({
        id: fish.id,
        name: fish.name,
        cost: fish.cost,
        probability: fish.weight / totalWeight
    }));

    // Perform weighted random selection
    let randomValue = Math.random();
    let cumulativeProbability = 0;

    for (const fish of normalizedWeights) {
        cumulativeProbability += fish.probability;
        if (randomValue <= cumulativeProbability) {
            return { id: fish.id, name: fish.name, cost: fish.cost }; // Return full fish object
        }
    }

    // Fallback (shouldn't happen)
    const lastFish = normalizedWeights[normalizedWeights.length - 1];
    return { id: lastFish.id, name: lastFish.name, cost: lastFish.cost };
}


export {getRandomFishByCost}
