/**
 * Cache for storing Distributor instances by range value
 */
const distributorCache = new Map<number, Distributor>();

/**
 * Distributor class for generating and managing distributed order arrays
 */
class Distributor {
    private capacity: number;
    private order: number[];

    /**
     * Create a new Distributor instance
     * @param rangeVal - The range value used to calculate capacity and order
     */
    constructor(rangeVal: number) {
        this.capacity = Math.floor((rangeVal * (rangeVal + 1)) / 2);
        this.order = new Array(this.capacity).fill(-1);

        let index = 0;

        // Outer loop: key is the value we want to insert (starts from rangeVal - 1 down to 0)
        for (let key = rangeVal - 1; key >= 0; key--) {
            const time = key + 1; // Number of times to insert this key

            for (let t = 0; t < time; t++) {
                // Advance index by jump size = capacity / time
                index = Math.floor(this.capacity / time) + index;

                // Wrap index if it exceeds capacity
                index = index % this.capacity;

                // Find next empty slot (-1 means empty)
                while (this.order[index] >= 0) {
                    index = (index + 1) % this.capacity;
                }

                // Place key in array
                this.order[index] = key;
            }
        }
    }

    /**
     * Get the value at a specific index in the order array
     * @param index - The index to pick
     * @returns The value at the specified index
     */
    pick(index: number): number {
        return this.order[index];
    }

    /**
     * Get the next index in the order array, wrapping around if necessary
     * @param index - The current index
     * @returns The next index
     */
    next(index: number): number {
        return (index + 1) % this.capacity;
    }

    /**
     * Create or retrieve a cached Distributor instance for a given range value
     * @param rangeVal - The range value
     * @returns A Distributor instance
     */

    // we can store all rangeValue as key in the cache of a Map() called distributorCache
    // if we need a new distributor with range 4 for example:
    // (4, Distributor(4)) if it exists in the cache we return it.
    // if we need a new distributor with range 5 it will generate a new one
    // see commented example below
    static new(rangeVal: number): Distributor {
        if (!distributorCache.has(rangeVal)) {
            distributorCache.set(rangeVal, new Distributor(rangeVal));
        }
        return distributorCache.get(rangeVal)!;
    }
}

export { Distributor };
 

