import { itemData } from './ItemData';

export interface InventoryData {
    [itemId: string]: number; // item ID -> quantity
}

export class Inventory {
    private inventory: InventoryData = {};
    private playerMoney: number = 0; // Track player's money
    private inventorySize: number = 10; 

    constructor() {
        const savedInventory = localStorage.getItem('inventory');
        this.inventory = savedInventory ? JSON.parse(savedInventory) : {};

        // retrieve user-upgraded inventory size (if they upgraded)
        const savedSize = localStorage.getItem('inventorySize');
        this.inventorySize = savedSize ? parseInt(savedSize, 10) : 10;

        // retrieve user money, default to 0 if first visit
        const savedMoney = localStorage.getItem('playerMoney');
        this.playerMoney = savedMoney ? parseInt(savedMoney, 10) : 0; // Load money, default to 0
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
                console.warn(`Warning: Item with ID '${id}' not found in itemData.`);
            }
        }

        return detailedInventory;
    }

        /** Get color based on item cost bin */
    private getColorForCost(cost: number | null): string {
        if (cost === null || cost === undefined) return '#C2C2C2';  // default to grey, also for no-cost items.

        // color table based on cost, gets more flashy the higher the cost
        if (cost <= 15) return '#C2C2C2'; // grey
        else if (cost <= 25) return '#7ea6cf';   
        else if (cost <= 35) return '#287cd1';   
        else if (cost <= 45) return "#4144d9";
        else if (cost <= 55) return '#bf1b80';
        else return '#ff0051';               
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
}
