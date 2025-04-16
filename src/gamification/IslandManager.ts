// IslandManager.ts

import InteractionArea from '../InteractionArea';
import { ItemData } from './ItemData';

/**
 * A "game element" that can be randomly assigned (fish, treasure, etc.)
 */
export interface GameElement {
    id: string;             // e.g. "fishPunch"
    name: string;           // e.g. "Fish Punch"
    maxResource: number;    // e.g. 10
    rarity: number;         // 0.0 -> 1.0 (0.0 = extremely rare, 1.0 = very common)
    elementType: string;    // e.g. "fishing", "treasure", etc.
    energyCost: number;
}

/**
 * Cost ranges for each fishing area (includes color for future glow usage).
 */
export const COST_RANGE_BANDS = [
    {
        minCost: 0,
        maxCost: 15,
        color: "#ffffff",
        rodAccess: { requiredClass: 1 }  // Basic areas accessible with class 1+ rods
    },
    {
        minCost: 16,
        maxCost: 25,
        color: "#6e9aba",
        rodAccess: { requiredClass: 2 }
    },
    {
        minCost: 26,
        maxCost: 35,
        color: "#0f74d9",
        rodAccess: { requiredClass: 3 }
    },
    {
        minCost: 36,
        maxCost: 45,
        color: "#1519eb",
        rodAccess: { requiredClass: 4 }
    },
    {
        minCost: 46,
        maxCost: 55,
        color: "#720af2",
        rodAccess: { requiredClass: 5 }
    },
    {
        minCost: 56,
        maxCost: 100,
        color: "#ff00fb",
        rodAccess: { requiredClass: 6 }
    }
];

/**
 * Each InteractionArea has an AreaAssignment telling us which game element is assigned,
 * how many resources remain, plus optional cost band fields for fishing (minCost, maxCost, bandColor).
 */
interface AreaAssignment {
    id: string;
    gameElementId: string | null;
    resourceLeft: number;
    areaElementType: string | null; // e.g. "fishing", "treasure", or null

    // For fishing area cost intervals:
    minCost?: number;
    maxCost?: number;
    bandColor?: string; // optional color for glow usage

    // For fishing area rod access limiting
    rodAccess?: {
        requiredClass?: number;      // For linear class-based access
        allowedRodIds?: string[];    // For specific rod access list
        specialAbility?: string;     // For special ability-based access
    };
}

export class IslandManager {
    private static readonly STORAGE_KEY = 'worldData';

    // 5-minute block from last assignment
    private lastAssignmentBlock: number = 0;

    private assignments: AreaAssignment[] = [];

    // All minigames, treasure locations, etc.
    private gameElements: GameElement[] = [
        {
            id: 'safehouse',
            name: 'Safehouse',
            maxResource: 0,     // irrelevant values to safehouse
            rarity: 1.0,
            elementType: 'safehouse',
            energyCost: 0
        },
        {
            id: 'shopFisher',
            name: 'Fisher Shop',
            maxResource: 0,     // irrelevant values to shop
            rarity: 1.0,
            elementType: 'shop',
            energyCost: 0
        },
        // higher rarity value is more common!!
        {
            id: 'fishPunch',
            name: 'Fish Punch',
            maxResource: 3,
            rarity: 0.8,
            elementType: 'fishing',
            energyCost: 15
        },
        {
            id: 'fishBounce',
            name: 'Fish Bounce',
            maxResource: 3,
            rarity: 0.8,
            elementType: 'fishing',
            energyCost: 15
        },
        {
            id: 'boatGrow',
            name: 'Boat Grow',
            maxResource: 3,
            rarity: 0.8,
            elementType: 'fishing',
            energyCost: 15
        }
    ];

    // Probability that a fishing area will have a minigame
    private static readonly FISHING_ASSIGN_PROBABILITY = 0.7;

    /** Get color based on item cost bin */
    static getColorForCost(item: ItemData): string {
        if (item.type === 'rod') {
            const match = item.specialEffect?.match(/class(\d+)/);
            const rodClass = match ? parseInt(match[1]) : 0;

            // Find the highest band this rod can access
            let bestBand = null;

            for (const band of COST_RANGE_BANDS) {
                if (
                    band.rodAccess?.requiredClass !== undefined &&
                    rodClass >= band.rodAccess.requiredClass
                ) {
                    if (!bestBand || band.maxCost > bestBand.maxCost) {
                        bestBand = band;
                    }
                }
            }

            if (bestBand) {
                return bestBand.color;
            }

            console.log("FALLBACK");
            return "#E6D9C2"; // fallback for rods that can't access anything
        }


        // Non-rods: use cost
        const cost = item.cost;
        if (cost == null) return "#C2C2C2";

        for (const band of COST_RANGE_BANDS) {
            if (cost >= band.minCost && cost <= band.maxCost) {
                return band.color;
            }
        }

        console.warn(`Cost ${cost} didn't match any band. Fallback color used.`);
        return "#ff0051";
    }

    constructor(private interactionAreas: { [key: string]: InteractionArea }) {
        console.group("Initializing IslandManager");
        // 1) Load old data from localStorage
        this.loadFromStorage();

        // 2) Build or update assignments for each InteractionArea
        this.buildAssignmentsFromAreas();

        // 3) Assign game elements to areas
        this.assignIslandGameElements(false);

        // 4) Sync game elements to InteractionAreas. Note -- only needs to be called separately 
        // here. Normally will be called within assignIslandGameElements()
        this.syncToInteractionAreas();

        console.groupEnd();
    }

    static preload(scene: Phaser.Scene): void {
        scene.load.html('safehouse', 'safehouseOverlay.html');
        scene.load.html('shopFisher', 'shopOverlay/fisherShop.html');
        scene.load.html('fishPunch', 'game-overlays/fishPunch.html');
        scene.load.html('fishBounce', 'game-overlays/fishBounce.html');
        scene.load.html('boatGrow', 'game-overlays/boatGrow/boatGrow.html');
    }

    /**
     * Retrieve a GameElement by its ID. Returns null if not found.
     */
    public getGameElementById(id: string): GameElement | null {
        return this.gameElements.find(el => el.id === id) || null;
    }

    /**
     * Ensures each InteractionArea has a corresponding assignment record.
     */
    private buildAssignmentsFromAreas(): void {
        const interactionAreaInfo = Object.values(this.interactionAreas);

        interactionAreaInfo.forEach(ia => {
            let existing = this.assignments.find(a => a.id === ia.id);
            if (!existing) {
                // All areas that are not none (fishing, safehouses, etc) will have their assignment handled by the island manager
                const gameElementType = ia.getResourceBehavior() !== 'none'
                    ? ia.getGameElementType()
                    : null;

                existing = {
                    id: ia.id,
                    gameElementId: null,
                    resourceLeft: 0,
                    areaElementType: gameElementType
                };
                this.assignments.push(existing);
            }
        });

        // Remove stale assignments for areas that no longer exist
        this.assignments = this.assignments.filter(a => !!this.interactionAreas[a.id]);
        this.saveToStorage();
    }

    /**
     * The main function for assigning game elements to islands.
     * If the current 5-min block has advanced (or if `forceNow`),
     * we re-roll the minigames for all fishing areas.
     */
    public assignIslandGameElements(forceNow: boolean): boolean {
        const curr5MinBlock = this.getCurrent5MinBlock();

        if (forceNow || curr5MinBlock > this.lastAssignmentBlock) {
            // Re-build the assignments array from scratch
            this.assignments = Object.values(this.interactionAreas).map(ia => ({
                id: ia.id,
                gameElementId: null,
                resourceLeft: 0,
                areaElementType: ia.getGameElementType()
            }));

            this.assignFishingToIslands();
            this.assignSafehousesToIslands();
            this.assignShopsToIslands();

            this.lastAssignmentBlock = curr5MinBlock;
            this.saveToStorage();
            this.syncToInteractionAreas();

            return true;
        }
        return false;
    }

    /**
     * Weighted pick for cost band, using 1 / band.maxCost as the "weight".
     */
    private getInvertedWeightCostBand(
        bands: typeof COST_RANGE_BANDS
    ): typeof COST_RANGE_BANDS[0] {
        // 1) Build array of { band, weight: 1 / band.maxCost }
        const weighted = bands.map(b => {
            const w = 1 / b.maxCost;
            return { band: b, weight: w };
        });

        // 2) Sum the weights
        const totalWeight = weighted.reduce((sum, x) => sum + x.weight, 0);

        // 3) Weighted random
        let rnd = Math.random() * totalWeight;
        for (const obj of weighted) {
            if (rnd < obj.weight) {
                return obj.band;
            }
            rnd -= obj.weight;
        }

        // fallback
        return bands[0];
    }

    /**
     * Assign fishing minigames + cost ranges to fishing areas.
     */
    private assignFishingToIslands(): void {
        this.assignments.forEach(a => {
            if (a.areaElementType !== 'fishing') return;

            if (Math.random() < IslandManager.FISHING_ASSIGN_PROBABILITY) {
                const fishingGames = this.gameElements.filter(g => g.elementType === 'fishing');
                const chosenGame = this.getWeightedRandomElement(fishingGames);
                if (!chosenGame) return;

                a.gameElementId = chosenGame.id;
                a.resourceLeft = chosenGame.maxResource ?? 0;

                // pick a cost band from COST_RANGE_BANDS
                const band = this.getInvertedWeightCostBand(COST_RANGE_BANDS);
                a.minCost = band.minCost;
                a.maxCost = band.maxCost;
                a.bandColor = band.color;

                // Set the rod access requirements from the band
                if (band.rodAccess) {
                    a.rodAccess = { ...band.rodAccess };
                }
            } else {
                // no fishing game assigned
                a.gameElementId = null;
                a.resourceLeft = 0;
                a.minCost = undefined;
                a.maxCost = undefined;
                a.bandColor = undefined;
                a.rodAccess = undefined;
            }
        });
    }

    /**
     * The function dedicated to "safehouse" areas
     */
    private assignSafehousesToIslands(): void {
        this.assignments.forEach(a => {
            if (a.areaElementType === 'safehouse') {
                a.gameElementId = 'safehouse';
                a.resourceLeft = 0;
            }
        });
    }

    /**
     * Assigns the "shop" areas
     */
    private assignShopsToIslands(): void {
        this.assignments.forEach(a => {
            if (a.areaElementType === 'shop') {

                // Manually assign types of shops based on interaction area ID
                if (a.id == 'shopFisher') {
                    a.gameElementId = 'shopFisher';
                }
                a.resourceLeft = 0;  // irrelevant to shops
            }
        });
    }

    /**
     * Weighted random picking from a list of game elements. 1.0 is the most common.
     */
    private getWeightedRandomElement(list: GameElement[]): GameElement | null {
        if (!list.length) return null;

        // Summation: direct from "rarity" since 1 => extremely common, 0 => extremely rare
        const totalWeight = list.reduce((sum, g) => sum + g.rarity, 0);
        if (totalWeight <= 0) return null;

        let randomPick = Math.random() * totalWeight;
        for (const game of list) {
            // "rarity" is how common it is
            if (randomPick < game.rarity) {
                return game;
            }
            randomPick -= game.rarity;
        }
        return null;
    }

    /**
     * Sync the final assignment results to each InteractionArea so it knows which minigame to show.
     */
    private syncToInteractionAreas(): void {
        console.group("Reassigning game elements");
        this.assignments.forEach(a => {
            const area = this.interactionAreas[a.id];
            if (!area) return;

            area.setMinigameId(a.gameElementId || '');
            area.setGlowColor(a.bandColor);

            // Update to use the new rodAccess setting
            if (a.rodAccess) {
                area.setRodAccess(a.rodAccess);
            }

            // If resource is 0, we block user from playing that minigame
            const blockers = new Set<string>();
            if (a.resourceLeft === 0) {
                blockers.add('depletion');
            }
            area.updateButtonBlockers(blockers);

            // Also check e.g. energy or inventory capacity
            area.evaluateGameElementBlockers();

            console.log("Synced area", area.id, "to game element", a.gameElementId, "with class", a.rodAccess?.requiredClass);
        });
        console.groupEnd();
    }

    /**
     * Save to localStorage
     */
    private saveToStorage(): void {
        localStorage.setItem(IslandManager.STORAGE_KEY, JSON.stringify({
            assignments: this.assignments,
            lastAssignmentBlock: this.lastAssignmentBlock
        }));
    }

    /**
     * Load from localStorage if found
     */
    private loadFromStorage(): void {
        const raw = localStorage.getItem(IslandManager.STORAGE_KEY);
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw);
            if (parsed.assignments) {
                this.assignments = parsed.assignments;
            }
            if (parsed.lastAssignmentBlock) {
                this.lastAssignmentBlock = parsed.lastAssignmentBlock;
            }
        } catch (error) {
            console.error('Failed to parse worldData', error);
        }
    }

    /**
     * If user starts the assigned game, reduce resource by 1
     */
    public reduceFish(areaId: string): boolean {
        const assignment = this.assignments.find(a => a.id === areaId);
        if (!assignment || !assignment.gameElementId) return false;
        if (assignment.resourceLeft <= 0) return false;

        assignment.resourceLeft--;
        this.saveToStorage();
        return true;
    }

    /**
     * Check if an area has no resources left
     */
    public isResourceDepleted(areaId: string): boolean {
        const assignment = this.assignments.find(a => a.id === areaId);
        return !assignment || assignment.resourceLeft <= 0;
    }

    /**
     * Return the entire assignments array (for debugging).
     */
    public getAssignments(): AreaAssignment[] {
        return this.assignments;
    }

    /**
     * Convert current time to an ID representing the 5-min block
     */
    private getCurrent5MinBlock(): number {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const hour = now.getHours();
        let minute = now.getMinutes();
        minute = minute - (minute % 5);

        return (year * 100000000) + (month * 1000000)
            + (day * 10000) + (hour * 100)
            + minute;
    }
}
