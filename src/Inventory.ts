import { itemData } from './ItemData';

export interface InventoryData {
    [itemId: string]: number; // item ID -> quantity
}

export class Inventory {
    private inventory: InventoryData = {};

    constructor() {
        const savedInventory = localStorage.getItem('inventory');
        this.inventory = savedInventory ? JSON.parse(savedInventory) : {};
    }

    /** Save inventory to localStorage */
    private saveInventory(): void {
        localStorage.setItem('inventory', JSON.stringify(this.inventory));
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
                    quantity: quantity // Add stored quantity
                });
            } else {
                console.warn(`Warning: Item with ID '${id}' not found in itemData.`);
            }
        }

        return detailedInventory;
    }

    /** Reset inventory (for debugging or resetting game state) */
    public clearInventory(): void {
        this.inventory = {};
        this.saveInventory();
    }
}
