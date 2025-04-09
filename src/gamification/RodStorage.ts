import { itemData } from './ItemData';

export class RodStorage {
    private static readonly STORAGE_KEY = 'equippedRods';

    private rodIds: string[] = [];
    private activeRodIndex: number = 0;
    private maxRodSlots: number = 1;  // Default to 1, upgradeable

    constructor() {
        this.loadFromStorage();

        // Check if this is a first-time player or if they have no rods at all
        if (this.rodIds.length === 0) {
            // Check if they have any rods in inventory or safehouse
            const inventory = localStorage.getItem('inventory');
            const safehouse = localStorage.getItem('safehouseStorage');

            let hasAnyRods = false;

            // Check inventory
            if (inventory) {
                try {
                    const inventoryData = JSON.parse(inventory);
                    // Check if any rod items exist
                    hasAnyRods = Object.keys(inventoryData).some(id => id.startsWith('rod'));
                } catch (e) {
                    console.error("Error parsing inventory data", e);
                }
            }

            // Check safehouse storage
            if (!hasAnyRods && safehouse) {
                try {
                    const safehouseData = JSON.parse(safehouse);
                    // Check if any rod items exist
                    hasAnyRods = Object.keys(safehouseData).some(id => id.startsWith('rod'));
                } catch (e) {
                    console.error("Error parsing safehouse data", e);
                }
            }

            // If no rods found anywhere, give them a starter rod
            if (!hasAnyRods) {
                console.log("No rods found. Providing starter rod to player");
                this.rodIds.push("rod1"); // Basic starter rod
                this.activeRodIndex = 0;
                this.saveToStorage();
            }
        }
    }

    /**
     * Save rod storage data to localStorage
     */
    private saveToStorage(): void {
        localStorage.setItem(RodStorage.STORAGE_KEY, JSON.stringify({
            rodIds: this.rodIds,
            activeRodIndex: this.activeRodIndex,
            maxRodSlots: this.maxRodSlots
        }));
    }

    /**
     * Load rod storage data from localStorage
     */
    private loadFromStorage(): void {
        const data = localStorage.getItem(RodStorage.STORAGE_KEY);
        if (!data) return;

        try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed.rodIds)) this.rodIds = parsed.rodIds;
            if (typeof parsed.activeRodIndex === 'number') this.activeRodIndex = parsed.activeRodIndex;
            if (typeof parsed.maxRodSlots === 'number') this.maxRodSlots = parsed.maxRodSlots;
        } catch (error) {
            console.error('Error parsing rod storage data:', error);
        }
    }

    /**
     * Get the ID of the currently active rod
     * @returns the rod ID or null if no rod is equipped
     */
    public getActiveRodId(): string | null {
        return this.rodIds[this.activeRodIndex] || null;
    }

    /**
     * Get all equipped rod IDs
     * @returns an array of rod IDs
     */
    public getAllRodIds(): string[] {
        return [...this.rodIds];
    }

    /**
     * Get the number of rods currently equipped
     * @returns the number of rods
     */
    public getRodCount(): number {
        return this.rodIds.length;
    }

    /**
     * Get the maximum number of rod slots available
     * @returns the maximum number of rod slots
     */
    public getMaxRodSlots(): number {
        return this.maxRodSlots;
    }

    /**
     * Check if there's space for another rod
     * @returns true if there's space, false otherwise
     */
    public hasSpace(): boolean {
        return this.rodIds.length < this.maxRodSlots;
    }

    /**
     * Add a rod to storage
     * @param rodId the ID of the rod to add
     * @returns true if successful, false if already equipped or no space
     */
    public addRod(rodId: string): boolean {
        // Check if already equipped
        if (this.rodIds.includes(rodId)) {
            return false;
        }

        // Check space
        if (!this.hasSpace()) {
            return false;
        }

        this.rodIds.push(rodId);
        // Set as active if it's the only rod
        if (this.rodIds.length === 1) {
            this.activeRodIndex = 0;
        }

        this.saveToStorage();
        return true;
    }

    /**
     * Remove a rod from storage
     * @param rodId the ID of the rod to remove
     * @returns true if successful, false if rod not found
     */
    public removeRod(rodId: string): boolean {
        const index = this.rodIds.indexOf(rodId);
        if (index === -1) return false;

        this.rodIds.splice(index, 1);

        // Adjust active index if needed
        if (this.activeRodIndex >= this.rodIds.length) {
            this.activeRodIndex = Math.max(0, this.rodIds.length - 1);
        } else if (index < this.activeRodIndex) {
            // If we removed a rod before the active rod, decrement the index
            this.activeRodIndex--;
        }

        this.saveToStorage();
        return true;
    }

    /**
     * Set the active rod by index
     * @param index the index of the rod to set as active
     * @returns true if successful, false if index out of bounds
     */
    public setActiveRod(index: number): boolean {
        if (index < 0 || index >= this.rodIds.length) {
            return false;
        }

        this.activeRodIndex = index;
        this.saveToStorage();
        return true;
    }

    /**
     * Upgrade the maximum number of rod slots
     * @param newMax the new maximum number of slots
     * @returns true if successful, false if new max is not greater than current
     */
    public upgradeCapacity(newMax: number): boolean {
        if (newMax <= this.maxRodSlots) return false;

        this.maxRodSlots = newMax;
        this.saveToStorage();
        return true;
    }

    /**
     * Get the class of the currently active rod
     * @returns the rod class (0 if no rod equipped)
     */
    public getActiveRodClass(): number {
        const rodId = this.getActiveRodId();
        if (!rodId) return 0;

        const rod = itemData[rodId];
        if (!rod) return 0;

        // Parse effect like "class1" to get the number
        const classMatch = rod.specialEffect?.match(/class(\d+)/);
        return classMatch ? parseInt(classMatch[1]) : 0;
    }
}