import { Sentence } from './Sentence';
import { Stamp } from './Stamp';
import { Punctuation } from './Punctuation';
import { Tense } from './Tense';
import { Global } from './Global';
import { Term } from './Term';
import { Truth } from './Truth';

class Quest extends Sentence {
    best_answer: Sentence | null = null;
    is_query: boolean;

    /**
     * Create a new Quest instance
     * @param term - The term of the quest
     * @param stamp - The stamp of the quest (optional)
     * @param curiosity - The curiosity (truth value) of the quest (optional)
     */
    constructor(term: Term, stamp: Stamp | null = null, curiosity: Truth | null = null) {
        stamp = stamp || new Stamp(Global.time, null, null, null);
        super(term, Punctuation.Quest, stamp);
        this.is_query = false; // TODO: Set to true if term has query variables
    }

    /**
     * String representation of the quest
     * @returns A string representation of the quest
     */
    toString(): string {
        const tenseStr = this.tense !== Tense.Eternal ? ` ${this.tense}` : '';
        return `${this.word}${tenseStr}`;
    }

    /**
     * Debug representation of the quest
     * @param is_input - Whether the quest is an input (optional)
     * @returns A formatted string representation of the quest
     */
    repr(is_input: boolean = false): string {
        const tenseStr = this.tense !== Tense.Eternal ? ` ${this.tense}` : '';
        return `${this.term.repr()}${this.punct}${tenseStr}`;
    }
}

export { Quest };
