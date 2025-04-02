// IslandManager.ts

import InteractionArea from './InteractionArea';
/**
 * A "game element" that can be randomly assigned (fish, treasure, etc.)
 */
export interface GameElement {
    id: string;             // e.g. "fishPunch"
    name: string;           // e.g. "Fish Punch"
    maxResource: number;    // e.g. 10
    rarity: number;         // 0.0 -> 1.0 (0.0 = extremely rare, 1.0 = very common)
    elementType: string;    // e.g. "fishing", "treasure", etc.
}

/**
 * An assignment record for each area:
 * - `gameElementId`: ID of assigned spawn (or null)
 * - `resourceLeft`: how many resources remain
 * - `areaElementType`: e.g. "fishing", "treasure"
 */
interface AreaAssignment {
    id: string;
    gameElementId: string | null;
    resourceLeft: number;
    areaElementType: string | null; // e.g. "fishing", "treasure", or null
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
            elementType: 'safehouse'
        },
        // higher rarity value is more common!!
        {
            id: 'fishPunch',
            name: 'Fish Punch',
            maxResource: 4,
            rarity: 0.8,     
            elementType: 'fishing'
        },

    ];

    // Probability that a fishing area will have a minigame
    private static readonly FISHING_ASSIGN_PROBABILITY = 0.7;

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
        scene.load.html('fishPunch', 'game-overlays/fishPunch.html');
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
     * Main function for assigning game elements to islands -- minigames, treasures, etc.
     */
    public assignIslandGameElements(forceNow: boolean): boolean {
        const curr5MinBlock = this.getCurrent5MinBlock();

        if (forceNow || curr5MinBlock > this.lastAssignmentBlock) {
            this.assignments = Object.values(this.interactionAreas).map(ia => ({
                id: ia.id,
                gameElementId: null,
                resourceLeft: 0,
                areaElementType: ia.getGameElementType()  // e.g. "fishing", "treasure"
            }));

            // Actually sync the game elements to each InteractionArea via InteractionArea.minigameId
            this.assignFishingToIslands();
            this.assignSafehousesToIslands();

            this.lastAssignmentBlock = curr5MinBlock;
            this.saveToStorage();

            this.syncToInteractionAreas();

            return true;
        }
        return false
    }


    /**
     * The function dedicated to "fishing" areas
     */
    private assignFishingToIslands(): void {
        this.assignments.forEach(a => {
            if (a.areaElementType !== 'fishing') return;

            if (Math.random() < IslandManager.FISHING_ASSIGN_PROBABILITY) {
                // Choose a fishing minigame
                const possible = this.gameElements.filter(g => g.elementType === 'fishing');
                const chosen = this.getWeightedRandomElement(possible);

                if (chosen) {
                    a.gameElementId = chosen.id;
                    a.resourceLeft = chosen.maxResource;
                }
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
        console.group("Reassigning game elements")
        this.assignments.forEach(a => {
            const area = this.interactionAreas[a.id];
            if (!area) return;
            area.setMinigameId(a.gameElementId || '');

            const blockers = new Set<string>();
            if (a.resourceLeft === 0) {
                blockers.add('depletion');
            }
                        
            area.updateButtonBlockers(blockers);
            area.evaluateGameElementBlockers(); // check for other blocks, e.g. inventory full

            console.log("Synced area", area.id, "to game element", a.gameElementId);
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
     * For debugging: returns the entire assignments array
     */
    public getAssignments(): AreaAssignment[] {
        return this.assignments;
    }

    /**
     * Return ID representing the current 5-min block.
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
