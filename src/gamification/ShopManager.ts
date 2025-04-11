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
