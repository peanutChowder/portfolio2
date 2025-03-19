// IslandManager.ts

import InteractionArea from './InteractionArea';
import { InteractionAreaData } from './InteractionAreaData';

/**
 * A "game element" that can be randomly assigned (fish, treasure, puzzle, etc.)
 */
export interface GameElement {
    id: string;
    name: string;
    maxResource: number;
    rarity: number;       // 0.0 (very common) -> 1.0 (very rare)
    elementType: string;  // e.g. "fishing", "treasure", "puzzle"
}


/**
 * Our internal structure for storing assignment data about an area:
 * - We re-use the area ID from InteractionAreaData
 * - `isExempt` if it's not minigame-assignable 
 * - `gameElementId` is the assigned spawn
 * - `resourceLeft` is how many resources remain
 */
interface AreaAssignment {
    id: string;
    isExempt: boolean;
    gameElementId: string | null;
    resourceLeft: number;
    areaElementType: string | null;  // e.g. "fishing", or null
}

export class IslandManager {
    private static readonly STORAGE_KEY = 'worldData';
    private static readonly FISHING_ASSIGN_PROBABILITY = 0.7;  // 70% chance something spawns

    // 5-minute block from last assignment
    private lastAssignmentBlock: number = 0;

    // Our local array storing each area’s assignment
    private assignments: AreaAssignment[] = [];

    // The possible game elements to spawn
    private gameElements: GameElement[] = [
        { id: 'fishPunch', name: 'Fish Punch', maxResource: 10, rarity: 0.1, elementType: "fishing" }, 
    ];

    /**
     * We pass in the existing interactionAreas from IsometricScene,
     * then build or load the assignment data from local storage.
     */
    constructor(private interactionAreas: { [key: string]: InteractionArea }) {
        this.loadFromStorage();
        console.log("a", this.assignments)
        this.buildAssignmentsFromAreas();
        console.log("a", this.assignments)

        this.assignIfNeeded(false);
    }

    /**
     * First time assignment.
     */
    public forceAssignNow(): void {
        this.assignIfNeeded(true);
    }

    /**
     * Creates or updates our assignments array based on current interactionAreas.
     */
    private buildAssignmentsFromAreas(): void {
        const interactionAreaValues = Object.values(this.interactionAreas);

        interactionAreaValues.forEach(iaData => {
            let existing = this.assignments.find(a => a.id === iaData.id);
            if (!existing) {
                let isAreaExempt = false;
                const gType = iaData.getGameElementType();

                existing = {
                    id: iaData.id,
                    isExempt: isAreaExempt,
                    gameElementId: null,
                    resourceLeft: 0,
                    areaElementType: gType
                };
                this.assignments.push(existing);
            }
        });

        this.assignments = this.assignments.filter(a => !!this.interactionAreas[a.id]);

        console.log("c", this.assignments)

        this.saveToStorage();
    }


    /**
     * Load from local storage, if any saved data
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
     * Save to local storage
     */
    private saveToStorage(): void {
        localStorage.setItem(IslandManager.STORAGE_KEY, JSON.stringify({
            assignments: this.assignments,
            lastAssignmentBlock: this.lastAssignmentBlock
        }));
    }

    /**
     * Assign game elements to islands. Assignment happens if we forceNow, or if we enter a new 5-min block.
     */
    private assignIfNeeded(forceNow: boolean): void {
        const currentBlock = this.getCurrent5MinBlock();
        if (!forceNow && currentBlock === this.lastAssignmentBlock) {
            return;
        }
        this.randomAssignGameElements();
        this.lastAssignmentBlock = currentBlock;
        this.saveToStorage();
        console.log('Assigned game elements for block', currentBlock);
    }

    /**
     * Weighted random assignment logic
     */
    private randomAssignGameElements(): void {
        this.assignments.forEach(a => {
            if (a.isExempt) {
                a.gameElementId = null;
                a.resourceLeft = 0;
                return;
            }

            // If areaElementType is empty or not recognized, skip or do something else
            if (!a.areaElementType) {
                a.gameElementId = null;
                a.resourceLeft = 0;
                return;
            }

            if (Math.random() < IslandManager.FISHING_ASSIGN_PROBABILITY) {
                // Only pick elements whose elementType matches the area
                const possibleElements = this.gameElements.filter(
                    g => g.elementType === a.areaElementType
                );

                // Weighted random among the possible elements
                const chosen = this.getWeightedRandomElement(possibleElements);
                if (chosen) {
                    a.gameElementId = chosen.id;
                    a.resourceLeft = chosen.maxResource;
                } else {
                    a.gameElementId = null;
                    a.resourceLeft = 0;
                }
            } else {
                a.gameElementId = null;
                a.resourceLeft = 0;
            }
        });
    }

    // Weighted random selection
    private getWeightedRandomElement(list: GameElement[]): GameElement | null {
        if (!list.length) return null;
        const totalWeight = list.reduce((sum, g) => sum + (1 - g.rarity), 0);
        let randomPick = Math.random() * totalWeight;

        for (const game of list) {
            const weight = 1 - game.rarity;
            if (randomPick < weight) {
                return game;
            }
            randomPick -= weight;
        }
        return null;
    }


    /**
     * Selects a game element weighted by rarity (higher rarity = less chance).
     */
    private getWeightedRandomGameElement(): GameElement | null {
        const totalWeight = this.gameElements.reduce((sum, g) => sum + (1 - g.rarity), 0);
        let randomPick = Math.random() * totalWeight;

        for (const game of this.gameElements) {
            const weight = 1 - game.rarity;
            if (randomPick < weight) return game;
            randomPick -= weight;
        }

        return null;
    }

    /**
     * Get an ID representing current 5 min real world time block.
     */
    private getCurrent5MinBlock(): number {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const hour = now.getHours();
        let minute = now.getMinutes();
        minute = minute - (minute % 5);
        return (year * 100000000) + (month * 1000000) + (day * 10000) + (hour * 100) + minute;
    }

    /**
     * If the user starts the assigned game element (fishing, puzzle, etc.), reduce resource by 1
     */
    public startGameElement(areaId: string): boolean {
        const assignment = this.assignments.find(a => a.id === areaId);
        if (!assignment || !assignment.gameElementId) return false;
        if (assignment.resourceLeft <= 0) return false;

        assignment.resourceLeft--;
        this.saveToStorage();
        console.log(`Resource updated for element ${assignment.gameElementId}: ${assignment.resourceLeft}`);
        return true;
    }

    /**
     * Check if an area has no resources left
     */
    public isResourceDepleted(areaId: string): boolean {
        const assignment = this.assignments.find(a => a.id === areaId);
        return !assignment || assignment.resourceLeft <= 0;
    }

    public getAssignments(): AreaAssignment[] {
        return this.assignments;
    }
}
