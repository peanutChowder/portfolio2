import { COST_RANGE_BANDS } from './IslandManager';
import { itemData } from './ItemData';
import { RodStorage } from './RodStorage';

export interface InventoryData {
    [itemId: string]: number; // item ID -> quantity
}

export class Inventory {
    private inventory: InventoryData = {};
    private playerMoney: number = 0; // Track player's money
    private inventorySize: number = 10;
    private rodStorage: RodStorage;

    constructor() {
        const savedInventory = localStorage.getItem('inventory');
        this.inventory = savedInventory ? JSON.parse(savedInventory) : {};

        // retrieve user-upgraded inventory size (if they upgraded)
        const savedSize = localStorage.getItem('inventorySize');
        this.inventorySize = savedSize ? parseInt(savedSize, 10) : 10;

        // retrieve user money, default to 0 if first visit
        const savedMoney = localStorage.getItem('playerMoney');
        this.playerMoney = savedMoney ? parseInt(savedMoney, 10) : 0; // Load money, default to 0

        // Load rod storage
        this.rodStorage = new RodStorage();
    }

    /** Save inventory to localStorage */
    private saveInventory(): void {
        localStorage.setItem('inventory', JSON.stringify(this.inventory));
    }

    /** Save money to localStorage */
    private saveMoney(): void {
        localStorage.setItem('playerMoney', this.playerMoney.toString());
    }

    /** Get player's current money */
    public getMoney(): number {
        return this.playerMoney;
    }

    /** Set player's money */
    public setMoney(amount: number): void {
        this.playerMoney = amount;
        this.saveMoney();
    }

    /** Add an item to inventory */
    public addItem(itemId: string, quantity: number = 1): void {
        if (this.inventory[itemId]) {
            this.inventory[itemId] += quantity;
        } else {
            this.inventory[itemId] = quantity;
        }
        this.saveInventory();
    }

    /** Remove an item from inventory */
    public removeItem(itemId: string, quantity: number = 1): void {
        if (!this.inventory[itemId]) return;

        this.inventory[itemId] -= quantity;
        if (this.inventory[itemId] <= 0) {
            delete this.inventory[itemId];
        }

        this.saveInventory();
    }

    /** Get current inventory */
    public getInventory(): InventoryData {
        return { ...this.inventory }; // Return a copy to prevent external mutation
    }

    public getDetailedInventory() {
        const detailedInventory = [];

        for (const [id, quantity] of Object.entries(this.inventory)) {
            const itemInfo = itemData[id];

            if (itemInfo) {
                detailedInventory.push({
                    id: itemInfo.id,
                    name: itemInfo.name,
                    type: itemInfo.type,
                    imgSrc: itemInfo.imgSrc,
                    description: itemInfo.description,
                    cost: itemInfo.cost ?? null, // Cost applies to sellable items
                    quantity: quantity, // Add stored quantity
                    outlineColor: this.getColorForCost(itemInfo.cost ?? null)
                });
            } else {
                console.warn(`Warning: Deleted item with ID '${id}', was not found in itemData.`);
                delete this.inventory[id];
            }
        }

        return detailedInventory;
    }

    /** Get color based on item cost bin */
    private getColorForCost(cost: number | null): string {
        // If no cost, default to grey
        if (cost == null) {
            return "#C2C2C2";
        }

        // Find which band the cost falls into
        for (const band of COST_RANGE_BANDS) {
            if (cost >= band.minCost && cost <= band.maxCost) {
                return band.color;
            }
        }

        // If no band matched, return a fallback color
        console.warn(`Cost ${cost} didn't match any band. Fallback to #ff0051`);
        return "#ff0051";
    }


    /** Reset inventory (for debugging or resetting game state) */
    public clearInventory(): void {
        this.inventory = {};
        this.saveInventory();
    }

    public getCurrentSize(): number {
        return this.inventorySize;
    }

    public setInventorySize(size: number): void {
        this.inventorySize = size;
        localStorage.setItem('inventorySize', size.toString());
    }

    public isInventoryFull(): boolean {
        const currentCount = Object.values(this.inventory).reduce((sum, qty) => sum + qty, 0);
        return currentCount >= this.inventorySize;
    }

    // Add these new methods to the Inventory class

    // Getter for rodStorage
    public getRodStorage(): RodStorage {
        return this.rodStorage;
    }

    // Method to equip a rod from inventory
    public equipRod(rodId: string): boolean {
        // Verify it's a rod
        const item = itemData[rodId];
        if (!item || item.type !== 'rod') return false;

        // Check if we have it in inventory
        if (!this.hasItem(rodId)) return false;

        // Try to add to rod storage
        if (this.rodStorage.addRod(rodId)) {
            // If successful, remove from inventory
            this.removeItem(rodId);
            return true;
        }

        return false;
    }

    public isRodItem(itemId: string): boolean {
        const item = itemData[itemId];
        return item?.type === 'rod';
    }

    /**
     * Check if the inventory contains a specific item
     * @param itemId the ID of the item to check
     * @returns true if the item exists in inventory with quantity > 0
     */
    public hasItem(itemId: string): boolean {
        return this.inventory[itemId] > 0;
    }

    /**
 * Get the total number of items in the inventory
 * @returns the sum of all item quantities
 */
    public getItemCount(): number {
        return Object.values(this.inventory).reduce((sum, qty) => sum + qty, 0);
    }

    /**
     * Unequip a rod, placing it back in inventory if there is space.
     * @param rodId the ID of the rod to unequip
     * @returns true if successful, false if inventory is full
     */
    public unequipRod(rodId: string): boolean {
        // Check if we have space in inventory
        if (this.getItemCount() >= this.inventorySize) {
            return false;
        }

        // Try to remove from rod storage
        if (this.rodStorage.removeRod(rodId)) {
            // If successful, add to inventory
            this.addItem(rodId);
            return true;
        }

        return false;
    }


    public canFishInArea(areaClass: number): boolean {
        const rodClass = this.rodStorage.getActiveRodClass();
        return rodClass >= areaClass; // Can fish if rod class is >= area class
    }

    /**
    * Gets details about the currently active rod for UI display
    * @returns the active rod details or null if no rod is equipped
    */
    public getActiveRodDetails(): any | null {
        const activeRodId = this.rodStorage.getActiveRodId();
        if (!activeRodId) return null;

        const rod = itemData[activeRodId];
        if (!rod) return null;

        return {
            id: activeRodId,
            name: rod.name,
            imgSrc: rod.imgSrc,
            description: rod.description,
            class: this.getRodClass(activeRodId),
            isActive: true
        };
    }


    /**
     * Gets an array of rod details for all equipped rods.
     * Each rod object has the following properties:
     *  - id: string, the rod's ID
     *  - name: string, the rod's name
     *  - imgSrc: string, the rod's image source
     *  - description: string, the rod's description
     *  - class: number, the rod's class (used to determine which areas it can fish in)
     *  - isActive: boolean, whether this rod is the currently active rod
     * @returns an array of rod details
     */
    public getEquippedRodDetails(): any[] {
        const result = [];
        const rodIds = this.rodStorage.getAllRodIds();
        const activeRodId = this.rodStorage.getActiveRodId();

        for (const rodId of rodIds) {
            const rod = itemData[rodId];
            if (!rod) continue;

            result.push({
                id: rodId,
                name: rod.name,
                imgSrc: rod.imgSrc,
                description: rod.description,
                class: this.getRodClass(rodId),
                isActive: rodId === activeRodId
            });
        }

        return result;
    }

    /**
     * Gets the rod class of a given rodId from itemData.
     * Returns 0 if the rod doesn't exist or has no specialEffect.
     * @param rodId the id of the rod
     * @returns the rod class (an integer)
     */
    private getRodClass(rodId: string): number {
        const rod = itemData[rodId];
        if (!rod || !rod.specialEffect) return 0;

        const classMatch = rod.specialEffect.match(/class(\d+)/);
        return classMatch ? parseInt(classMatch[1]) : 0;
    }
}
