import { Sentence } from './Sentence';
import { Stamp } from './Stamp';
import { Truth } from './Truth';
import { Punctuation } from './Punctuation';
import { Tense } from './Tense';
import { Config } from './Config';
import { Global } from './Global';
import { Term } from './Term';

class Judgement extends Sentence {
    truth: Truth;

    /**
     * Create a new Judgement instance
     * @param term - The term of the judgement
     * @param stamp - The stamp of the judgement (optional)
     * @param truth - The truth value of the judgement (optional)
     */
    constructor(term: Term, stamp: Stamp | null = null, truth: Truth | null = null) {
        stamp = stamp || new Stamp(Global.time, null, null, null);
        super(term, Punctuation.Judgement, stamp);
        this.truth = truth || new Truth(Config.f, Config.c, Config.k);
    }

    /**
     * String representation of the judgement
     * @returns A string representation of the judgement
     */
    toString(): string {
        const tenseStr = this.tense !== Tense.Eternal ? ` ${this.tense}` : '';
        return `${this.word}${tenseStr} ${this.truth}`;
    }

    /**
     * Debug representation of the judgement
     * @param is_input - Whether the judgement is an input (default: false)
     * @returns A formatted string representation of the judgement
     */
    repr(is_input = false): string {
        let interval = '';
        if (this.tense !== Tense.Eternal) {
            if (this.tense === Tense.Present) {
                interval = this.tense;
            } else if (this.tense === Tense.Future) {
                interval = `:!${this.stamp.t_occurrence}:`;
            } else if (this.tense === Tense.Past) {
                interval = `:!-${this.stamp.t_occurrence}:`;
            }
        }
        return `${this.term.repr()}${this.punct} ${interval} ${this.truth}`;
    }
}

export { Judgement };