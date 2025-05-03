/**
 * Evidential base for NARS stamps
 * Maintains a unique set of evidence IDs
 */
class Base {
    private _set: Set<string>;

    /**
     * Create a new evidential base
     * @param elements - Initial evidence IDs
     */
    constructor(elements: string[] = []) {
        this._set = new Set(elements);
    }

    /**
     * Add new evidence to the base
     * @param other - Another Base instance to extend with
     */
    extend(other: Base): void {
        if (!other || !(other instanceof Base)) return;
        other._set.forEach(id => this._set.add(id));
    }

    /**
     * Get the size of the evidential base
     * @returns Number of evidence IDs
     */
    get size(): number {
        return this._set.size;
    }

    /**
     * String representation of the evidential base
     * @returns Comma-separated evidence IDs
     */
    toString(): string {
        return Array.from(this._set).join(',');
    }

    /**
     * Debug representation
     * @returns Formatted base string
     */
    //TODO: change all repr to toString
    repr(): string {
        return `<Base: {${this.toString()}}>`;
    }
}

export { Base };