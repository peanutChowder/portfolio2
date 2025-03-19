export interface MinigameInfo {
    id: string;
    name: string;
    maxFish: number;
    rodsAllowed: string[];
}

export interface Island {
    id: string;
    minigame: MinigameInfo | null;
    fishLeft: number;
}
export class IslandManager {
    private static readonly STORAGE_KEY = 'islandData';
    private static readonly REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

    private islands: Island[] = [];
    private minigames: MinigameInfo[] = [
        { id: 'flappyRobotFish', name: 'Flappy Robot Fish', maxFish: 10, rodsAllowed: ['all'] },
        { id: 'robotFish', name: 'Robot Fish Growth', maxFish: 15, rodsAllowed: ['all'] }
    ];

    constructor(private totalIslands: number) {
        this.loadFromStorage();
        this.assignMinigames();

        setInterval(() => {
            this.assignMinigames();
        }, IslandManager.REFRESH_INTERVAL);
    }

    /**
     * Loads island data from local storage or initializes new data if none is found.
     */
    private loadFromStorage(): void {
        const storedData = localStorage.getItem(IslandManager.STORAGE_KEY);
        if (storedData) {
            try {
                this.islands = JSON.parse(storedData);
            } catch (error) {
                console.error('Failed to parse island data from local storage.');
                this.initializeIslands();
            }
        } else {
            this.initializeIslands();
        }
    }

    /**
     * Creates a blank array of islands if none are stored.
     */
    private initializeIslands(): void {
        this.islands = Array.from({ length: this.totalIslands }, (_, index) => ({
            id: `island-${index}`,
            minigame: null,
            fishLeft: 0
        }));
        this.saveToStorage();
    }

    /**
     * Writes the current island array to local storage.
     */
    private saveToStorage(): void {
        localStorage.setItem(IslandManager.STORAGE_KEY, JSON.stringify(this.islands));
    }

    /**
     * Randomly assigns a minigame (or null) to each island, replenishes fish accordingly.
     */
    public assignMinigames(): void {
        this.islands.forEach(island => {
            const minigame = this.getRandomMinigame();
            island.minigame = minigame;
            island.fishLeft = minigame ? minigame.maxFish : 0;
        });
        this.saveToStorage();
        console.log('Minigames reassigned.');
    }

    /**
     * A simple random selection: 70% chance to pick a minigame, else null.
     */
    private getRandomMinigame(): MinigameInfo | null {
        const chance = Math.random();
        if (chance < 0.7) {
            const index = Math.floor(Math.random() * this.minigames.length);
            return this.minigames[index];
        }
        return null;
    }

    /**
     * Depletes fish by 1 if the island & minigame exist and fish > 0.
     * Returns `true` if minigame was started, `false` if it couldn't start.
     */
    public startMinigame(islandId: string): boolean {
        const island = this.islands.find(i => i.id === islandId);
        if (!island || !island.minigame) return false;
        if (island.fishLeft <= 0) return false;

        island.fishLeft--;
        this.saveToStorage();
        console.log(`Fish updated for minigame ${island.minigame.id}: ${island.fishLeft}`);
        return true;
    }

    /**
     * Returns the entire array of islands. 
     */
    public getIslandData(): Island[] {
        return this.islands;
    }

    /**
     * Helper: Check if an island is out of fish (for UI blocking).
     */
    public isFishDepleted(islandId: string): boolean {
        const island = this.islands.find(i => i.id === islandId);
        return !island || island.fishLeft <= 0;
    }
}
