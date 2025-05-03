import { Config } from './Config';
import { Truth } from './Truth';

/**
 * Budget class for NARS system
 * Handles resource allocation through priority, durability, and quality values
 */
class Budget {
    static default_priority: number = 0.9;
    static default_durability: number = 0.9;
    static default_quality: number = 0.5;

    priority: number;
    durability: number;
    quality: number;
    summary: number;
    is_above_thresh: boolean;

    /**
     * Create a new Budget instance
     * @param priority - Priority value
     * @param durability - Durability value
     * @param quality - Quality value
     */
    constructor(priority: number = -1.0, durability: number = -1.0, quality: number = -1.0) {
        this.priority = priority >= 0.0 ? priority : Budget.default_priority;
        this.durability = durability >= 0.0 ? durability : Budget.default_durability;
        this.quality = quality >= 0.0 ? quality : Budget.default_quality;

        this.summary = this.durability * (this.priority + this.quality) / 2.0;
        this.is_above_thresh = this.summary > (Config.budget_thresh ?? 0); // Ensure Config.budget_thresh is defined
    }

    /**
     * String representation of the budget
     * @returns Formatted string
     */
    toString(): string {
        return `$${this.priority.toFixed(3)};${this.durability.toFixed(3)};${this.quality.toFixed(3)}$`;
    }

    /**
     * Convert budget to a vector
     * @returns Array of priority, durability, and quality
     */
    to_vector(): [number, number, number] {
        return [this.priority, this.durability, this.quality];
    }

    /**
     * Calculate quality from a Truth instance
     * @param t - Truth instance
     * @returns Calculated quality
     */
    static quality_from_truth(t: Truth): number {
        //NOTE: this is t.e in OpenNARS-4
        const exp = t.expectation(); // Call the `expectation` method of Truth
        return Math.max(exp, (1.0 - exp) * 0.75);
    }

    /**
     * Reduce priority by a given forgetting rate
     * @param h - Forgetting rate
     */
    reduce_by_achieving_level(h: number): void {
        this.priority *= (1.0 - h);
    }

    /**
     * Distribute budget across multiple items
     * @param n - Number of items
     * @returns New Budget instance with adjusted priority
     */
    distribute(n: number): Budget {
        const new_priority = this.priority / Math.sqrt(n > 0 ? n : 1);
        return new Budget(new_priority, this.durability, this.quality);
    }
}

export { Budget };