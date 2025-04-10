import { InventoryData } from './Inventory';
import { COST_RANGE_BANDS } from './IslandManager';
import { ItemData, itemData } from './ItemData';

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
                    outlineColor: this.getColorForCost(itemInfo),
                });
            } else {
                console.warn(`Missing item metadata for '${id}' in safehouse storage`);
            }
        }

        return detailed;
    }

    /** Get color based on item cost bin */
    private getColorForCost(item: ItemData): string {
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
