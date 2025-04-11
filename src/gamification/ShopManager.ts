import { Inventory } from './Inventory';
import { itemData } from './ItemData';

export interface BuyableItem {
    itemId: string;
    quantityLimit: number | 'infinite';
}

export interface SellableItemCriteria {
    type?: string; // e.g., 'fish', 'rod'
    specificIds?: string[];
    tag?: string; // For future flexibility (e.g., 'treasure', 'trash')
}

export interface ShopDefinition {
    id: string;
    name: string;
    buyableItems: BuyableItem[];
    sellableCriteria: SellableItemCriteria[];
}

export interface BuyableItemDetails {
    id: string;
    name: string;
    description: string;
    cost: number;
    imgSrc: string;
    type: string;
    remaining: number | null; // null means infinite
}

export interface SellableItemDetails {
    id: string;
    name: string;
    imgSrc: string;
    cost: number;
    quantity: number;
}

export interface DetailedInventoryItem {
    id: string;
    quantity: number;
}


export class ShopManager {
    private static readonly STORAGE_KEY = 'shopStock';
    private shopDefinitions: ShopDefinition[] = [];
    private stock: Record<string, number> = {}; // itemId -> quantity left

    constructor() {
        this.loadStock();
        this.initializeShops();
    }

    private initializeShops() {
        this.shopDefinitions = [
            {
                id: 'shopFisher',
                name: 'Fisher Shop',
                buyableItems: [
                    { itemId: 'rod1', quantityLimit: 'infinite' },
                    { itemId: 'rod2', quantityLimit: 'infinite' },
                    { itemId: 'rod3', quantityLimit: 'infinite' },
                    { itemId: 'rod4', quantityLimit: 'infinite' },
                    { itemId: 'rod5', quantityLimit: 'infinite' },
                    { itemId: 'rod6', quantityLimit: 'infinite' },
                    { itemId: 'upgrade_inventory', quantityLimit: 1 },
                    { itemId: 'upgrade_safehouse', quantityLimit: 1 },
                ],
                sellableCriteria: [
                    { type: 'fish' }
                ]
            }
        ];

        // Initialize stock for each buyable item if not already set
        for (const shop of this.shopDefinitions) {
            for (const item of shop.buyableItems) {
                if (item.quantityLimit === 'infinite') continue;
                if (!(item.itemId in this.stock)) {
                    this.stock[item.itemId] = item.quantityLimit;
                }
            }
        }

        this.saveStock();
    }

    public getShopById(id: string): ShopDefinition | null {
        return this.shopDefinitions.find(s => s.id === id) || null;
    }

    public getBuyableItems(shopId: string): BuyableItemDetails[] {
        const shop = this.getShopById(shopId);
        if (!shop) {
            console.warn(`Shop '${shopId}' not found`);
            return [];
        }

        const validItems = shop.buyableItems
            .map(entry => {
                const item = itemData[entry.itemId];
                if (!item) {
                    console.warn(`Item '${entry.itemId}' not found in itemData`);
                    return null;
                }

                return {
                    item,
                    quantityLimit: entry.quantityLimit
                };
            })
            .filter((entry): entry is { item: typeof itemData[string], quantityLimit: number | 'infinite' } => entry !== null);

        return validItems.map(({ item, quantityLimit }) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            cost: item.cost ?? 0,
            imgSrc: item.imgSrc,
            type: item.type,
            remaining: quantityLimit === 'infinite' ? null : this.stock[item.id] ?? 0
        }));
    }



    public getSellableInventory(inventory: DetailedInventoryItem[], shopId: string): SellableItemDetails[] {
        const shop = this.getShopById(shopId);
        if (!shop) return [];

        return inventory
            .filter(item => {
                const def = itemData[item.id];
                if (!def) return false;

                return shop.sellableCriteria.some(criteria => {
                    const typeMatch = criteria.type ? def.type === criteria.type : true;
                    const idMatch = criteria.specificIds ? criteria.specificIds.includes(def.id) : true;
                    return typeMatch && idMatch;
                });
            })
            .map(item => {
                const def = itemData[item.id];
                return {
                    id: def.id,
                    name: def.name,
                    imgSrc: def.imgSrc,
                    cost: def.cost ?? 0,
                    quantity: item.quantity
                };
            });
    }


    public getRemainingStock(itemId: string): number | 'infinite' {
        const item = this.getAllBuyableItems().find(i => i.itemId === itemId);
        if (!item) return 0;
        return item.quantityLimit === 'infinite' ? 'infinite' : this.stock[itemId] ?? 0;
    }

    public reduceStock(itemId: string): boolean {
        const item = this.getAllBuyableItems().find(i => i.itemId === itemId);
        if (!item) return false;

        if (item.quantityLimit === 'infinite') return true;

        const currentStock = this.stock[itemId];
        if (currentStock > 0) {
            this.stock[itemId]--;
            this.saveStock();
            return true;
        }
        return false;
    }

    public handleBuy(itemId: string, shopId: string, inventory: Inventory): void {
        const item = itemData[itemId];
        if (!item) {
            console.warn(`[ShopManager] handleBuy: Item '${itemId}' not found`);
            return;
        }

        const shop = this.getShopById(shopId);
        if (!shop || !shop.buyableItems.some(b => b.itemId === itemId)) {
            console.warn(`[ShopManager] handleBuy: Item '${itemId}' not sold by '${shopId}'`);
            return;
        }

        // Handle storage upgrades separately
        if (itemId === 'upgrade_inventory') {
            if (!this.reduceStock(itemId)) return;
            inventory.setInventorySize(inventory.getCurrentSize() + 5);
            inventory.setMoney(inventory.getMoney() - (item.cost ?? 0));
            return;
        }

        if (itemId === 'upgrade_safehouse') {
            if (!this.reduceStock(itemId)) return;
            // Assuming safehouse upgrade will be handled separately via postMessage
            inventory.setMoney(inventory.getMoney() - (item.cost ?? 0));
            return;
        }

        // Handle rod purchase: move directly to rodStorage if possible
        if (inventory.isRodItem(itemId)) {
            if (!this.reduceStock(itemId)) return;
            if (inventory.getRodStorage().addRod(itemId)) {
                inventory.setMoney(inventory.getMoney() - (item.cost ?? 0));
            } else {
                console.warn(`[ShopManager] Rod storage full, cannot add '${itemId}'`);
            }
            return;
        }

        // Regular inventory item (fish, treasure, etc.)
        if (!this.reduceStock(itemId)) return;
        inventory.addItem(itemId);
        inventory.setMoney(inventory.getMoney() - (item.cost ?? 0));
    }


    public handleSell(itemId: string, quantity: number, inventory: Inventory): void {
        const item = itemData[itemId];
        if (!item) {
            console.warn(`[ShopManager] handleSell: Item '${itemId}' not found`);
            return;
        }

        const sellPrice = item.cost ?? 0;
        inventory.removeItem(itemId, quantity);
        inventory.setMoney(inventory.getMoney() + sellPrice * quantity);
    }


    private getAllBuyableItems(): BuyableItem[] {
        return this.shopDefinitions.flatMap(s => s.buyableItems);
    }

    public itemMatchesSellableCriteria(itemId: string): boolean {
        const item = itemData[itemId];
        if (!item) return false;

        return this.shopDefinitions.some(shop =>
            shop.sellableCriteria.some(criteria => {
                const typeMatch = criteria.type ? item.type === criteria.type : true;
                const idMatch = criteria.specificIds ? criteria.specificIds.includes(item.id) : true;
                return typeMatch && idMatch;
            })
        );
    }

    private saveStock() {
        localStorage.setItem(ShopManager.STORAGE_KEY, JSON.stringify(this.stock));
    }

    private loadStock() {
        const raw = localStorage.getItem(ShopManager.STORAGE_KEY);
        if (raw) {
            try {
                this.stock = JSON.parse(raw);
            } catch (e) {
                console.warn('Failed to parse shop stock:', e);
                this.stock = {};
            }
        } else {
            this.stock = {};
        }
    }
}
