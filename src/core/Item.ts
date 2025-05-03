import { Budget } from './Budget';
import { Config } from './Config';

/**
 * Base Item class for NARS system
 * Provides budget management and comparison functionality
 */
class Item {
    budget: Budget;
    private _hash_value: number;

    /**
     * Create a new Item instance
     * @param hash_value - The hash value of the item
     * @param budget - The budget of the item (optional)
     * @param copy_budget - Whether to copy the budget (default: true)
     */
    constructor(hash_value: number, budget: Budget | null = null, copy_budget: boolean = true) {
        this.budget = budget
            ? (copy_budget
                ? Object.assign(Object.create(Object.getPrototypeOf(budget)), budget)
                : budget)
            : new Budget(Config.priority, Config.durability, Config.quality);

        this._hash_value = hash_value;
    }

    /**
     * Set the budget for the item
     * @param budget - The new budget
     */
    set_budget(budget: Budget): void {
        this.budget = budget;
    }

    /**
     * Get the hash value of the item
     * @returns The hash value
     */
    hash(): number {
        return this._hash_value;
    }

    /**
     * Check equality with another item
     * @param other - The other item to compare
     * @returns True if equal, otherwise false
     */
    equals(other: Item): boolean {
        return other instanceof Item && other.hash() === this.hash();
    }

    /**
     * String representation of the item
     * @returns A string representation of the item
     */
    toString(): string {
        return `${this.budget.toString()} (Item)`;
    }
}

export { Item };