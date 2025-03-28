import { InventoryData } from './Inventory';
import { itemData } from './ItemData';

export class SafehouseInventory {
    private storage: InventoryData = {};
    private storageSize: number = 20;

    constructor() {
        const saved = localStorage.getItem('safehouseStorage');
        this.storage = saved ? JSON.parse(saved) : {};

        const savedSize = localStorage.getItem('safehouseStorageSize');
        this.storageSize = savedSize ? parseInt(savedSize, 10) : 20;
    }

    /** Save current storage state */
    private save(): void {
        localStorage.setItem('safehouseStorage', JSON.stringify(this.storage));
    }

    /** Add item(s) to storage */
    public addItem(itemId: string, quantity: number = 1): void {
        if (this.storage[itemId]) {
            this.storage[itemId] += quantity;
        } else {
            this.storage[itemId] = quantity;
        }
        this.save();
    }

    /** Remove item(s) from storage */
    public removeItem(itemId: string, quantity: number = 1): void {
        if (!this.storage[itemId]) return;

        this.storage[itemId] -= quantity;
        if (this.storage[itemId] <= 0) {
            delete this.storage[itemId];
        }

        this.save();
    }

    /** Get a shallow copy of current raw storage data */
    public getStorage(): InventoryData {
        return { ...this.storage };
    }

    /** Get detailed version of storage items for UI rendering */
    public getDetailedStorage() {
        const detailed = [];

        for (const [id, quantity] of Object.entries(this.storage)) {
            const itemInfo = itemData[id];

            if (itemInfo) {
                detailed.push({
                    id: itemInfo.id,
                    name: itemInfo.name,
                    type: itemInfo.type,
                    imgSrc: itemInfo.imgSrc,
                    description: itemInfo.description,
                    cost: itemInfo.cost ?? null,
                    quantity,
                    outlineColor: this.getColorForCost(itemInfo.cost ?? null),
                });
            } else {
                console.warn(`Missing item metadata for '${id}' in safehouse storage`);
            }
        }

        return detailed;
    }

    /** Helper to choose border color */
    private getColorForCost(cost: number | null): string {
        if (cost === null || cost === undefined) return '#C2C2C2';
        if (cost <= 15) return '#C2C2C2';
        else if (cost <= 25) return '#7ea6cf';
        else if (cost <= 35) return '#287cd1';
        else if (cost <= 45) return '#4144d9';
        else if (cost <= 55) return '#bf1b80';
        else return '#ff0051';
    }

    /** Wipe storage completely */
    public clearStorage(): void {
        this.storage = {};
        this.save();
    }

    /** Get maximum capacity */
    public getMaxSize(): number {
        return this.storageSize;
    }

    /** Change capacity (can be used for shop upgrades) */
    public setStorageSize(size: number): void {
        this.storageSize = size;
        localStorage.setItem('safehouseStorageSize', size.toString());
    }

    /** Whether storage is full */
    public isStorageFull(): boolean {
        const total = Object.values(this.storage).reduce((sum, qty) => sum + qty, 0);
        return total >= this.storageSize;
    }
}
