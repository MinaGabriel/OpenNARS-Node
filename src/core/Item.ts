import { Budget } from './Budget';

/**
 * Base Item class for NARS system
 * Provides budget management and comparison functionality
 */
abstract class Item {
    protected _key: string;
    protected _budget: Budget;

    constructor(key?: string, budget?: Budget) {
        this._key = key ?? '';
        this._budget = budget ? new Budget(budget) : new Budget();
    }
 
    get key(): string { return this._key; }
    get budget(): Budget { return this._budget; }
    get priority(): number { return this._budget.priority; }
    get durability(): number { return this._budget.durability; }
    get quality(): number { return this._budget.quality; }
    set key(value: string) { this._key = value; }
    set priority(value: number) { this._budget.priority = value; }
    set durability(value: number) { this._budget.durability = value; }
    set quality(value: number) { this._budget.quality = value; }

    merge(that: Item): void { this._budget.merge(that.budget); }
}

export { Item };