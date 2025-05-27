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
 
}

export { Base };