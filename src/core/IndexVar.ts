import { IntVar } from './IntVar';

class IndexVar {
    private indices_: IntVar[];
    private positions_: number[][];
    private successors_: any[];
    private indices_normalized_: number[] | null;
    private hash_value_: number | null;

    constructor() {
        this.indices_ = [];
        this.positions_ = [];
        this.successors_ = [];
        this.indices_normalized_ = null;
        this.hash_value_ = null;
    }

    /**
     * Normalize indices by mapping them to a sorted unique set
     * @param variables - Array of variables to normalize
     * @returns Normalized indices
     */
    private normalizeIndices(variables: number[]): number[] {
        const uniqueVars = [...new Set(variables)];
        const sortedVars = uniqueVars.sort((a, b) => a - b);
        const mapping = new Map(sortedVars.map((val, i) => [val, i]));
        return variables.map(v => mapping.get(v) as number);
    }

    /**
     * Get normalized indices
     * @returns Normalized indices
     */
    getIndicesNormalized(): number[] {
        // if (this.indices_normalized_ === null) {
        //     const raw_indices = this.indices_.map(idx => idx.num_);
        //     this.indices_normalized_ = this.normalizeIndices(raw_indices);
        // }
        // return this.indices_normalized_;
        //FIXME
        return [-101];
    }

    /**
     * Calculate the hash value of the indices
     * @returns Hash value
     */
    hash(): number {
        if (this.hash_value_ === null) {
            const normStr = this.getIndicesNormalized().join('');
            let hash = 0;
            for (let i = 0; i < normStr.length; i++) {
                hash = ((hash << 5) - hash) + normStr.charCodeAt(i);
                hash |= 0; // Convert to 32-bit integer
            }
            this.hash_value_ = hash;
        }
        return this.hash_value_;
    }

    /**
     * String representation of the IndexVar
     * @returns String representation
     */
    toString(): string {
        const indices_str = this.indices_.map(idx => idx.toString()).join(',');
        const positions_str = this.positions_
            .map(pos => `[${pos.join(',')}]`)
            .join(',');
        const norm_indices = this.getIndicesNormalized().join(',');
        return `<IndexVar: [${indices_str}], [${positions_str}], (${norm_indices})>`;
    }

    /**
     * Add a new variable and its position
     * @param idx - Index of the variable
     * @param position - Position of the variable
     * @returns The created IntVar instance
     */
    add(idx: number, position: number[]): IntVar {
        const iv = new IntVar(idx);

        // Handle empty position case
        if (position.length === 0) {
            this.positions_ = [];
            this.indices_ = [];
        }

        // Add the variable and its position
        this.indices_.push(iv);
        this.positions_.push([...position]);

        // Reset cached values
        this.indices_normalized_ = null;
        this.hash_value_ = null;

        return iv;
    }

    /**
     * Clone the IndexVar instance
     * @returns A deep copy of the IndexVar instance
     */
    clone(): IndexVar {
        const newIndexVar = new IndexVar();
            //FIXME
        // // Deep copy indices
        // newIndexVar.indices_ = this.indices_.map(idx => new IntVar(idx.num_));

        // // Deep copy positions
        // newIndexVar.positions_ = this.positions_.map(pos => [...pos]);

        // // Reset cached values
        // newIndexVar.indices_normalized_ = null;
        // newIndexVar.hash_value_ = null;

        return newIndexVar;
    }
}

export { IndexVar };