import { Sentence } from './Sentence';
import { Stamp } from './Stamp';
import { Truth } from './Truth';
import { Punctuation } from './Punctuation';
import { Tense } from './Tense';
import { Config } from './Config';
import { Global } from './Global';
import { Term } from './Term';

/**
 * Goal class for representing goals in the NARS system
 * Extends the Sentence class
 */
class Goal extends Sentence {
    best_solution: Sentence | null = null;
    truth: Truth;

    /**
     * Create a new Goal instance
     * @param term - The term of the goal
     * @param stamp - The stamp of the goal (optional)
     * @param desire - The desire (truth value) of the goal (optional)
     */
    constructor(term: Term, stamp: Stamp | null = null, desire: Truth | null = null) {
        stamp = stamp || new Stamp(Global.time, null, null, null);
        super(term, Punctuation.Goal, stamp);
        this.truth = desire || new Truth(Config.f, Config.c, Config.k);
    }

    /**
     * String representation of the goal
     * @returns A string representation of the goal
     */
    toString(): string {
        const tenseStr = this.tense !== Tense.Eternal ? ` ${this.tense}` : '';
        return `${this.word}${tenseStr} ${this.truth}`;
    }

    /**
     * Debug representation of the goal
     * @param is_input - Whether the goal is an input (optional)
     * @returns A formatted string representation of the goal
     */
    repr(is_input: boolean = false): string {
        const tenseStr = this.tense !== Tense.Eternal ? ` ${this.tense}` : '';
        return `${this.term.repr()}${this.punct}${tenseStr} ${this.truth}`;
    }
}

export { Goal };
