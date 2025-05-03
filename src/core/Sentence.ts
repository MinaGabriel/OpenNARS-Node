import { Truth } from './Truth';
import { Config } from './Config';
import { Punctuation } from './Punctuation';
import { Stamp } from './Stamp';
import { Term } from './Term';


class Sentence {
    term: Term;
    word: string;
    punct: Punctuation;
    stamp: Stamp;
    truth: Truth | null;

    /**
     * Create a new Sentence instance
     * @param term - The term of the sentence
     * @param punct - The punctuation of the sentence
     * @param stamp - The stamp of the sentence
     * @param do_hashing - Whether to perform hashing (default: false)
     */
    constructor(term: any, punct: Punctuation, stamp: Stamp, do_hashing = false) {
        this.term = term;
        this.word = term.word + punct;
        this.punct = punct;
        this.stamp = stamp;
        this.truth = null;
    }

    /**
     * Get the evidential base of the sentence
     * @returns The evidential base
     */
    get evidential_base() {
        return this.stamp.evidential_base;
    }

    /**
     * Get the tense of the sentence
     * @returns The tense
     */
    get tense() {
        return this.stamp.tense;
    }


    /**
     * Get the sharpness of the sentence
     * @returns The sharpness value or null if no truth
     */
    /**
 * Get the sharpness of the sentence
 * @returns The sharpness value or null if no truth
 */
    get sharpness(): number | null {
        if (!this.truth || typeof this.truth.expectation !== 'number') {
            return null;
        }
        return 2 * Math.abs(Number(this.truth.expectation) - 0.5);
    }

    /**
     * Eternalize the sentence
     * @param truth - Optional truth value to set
     * @returns A new eternalized sentence
     */
    eternalize(truth: Truth | null = null): Sentence {
        const sentence = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        if (truth) {
            sentence.truth = truth;
        }
        const stamp = Object.assign({}, sentence.stamp);
        stamp.eternalize();
        sentence.stamp = stamp;
        return sentence;
    }

    /**
     * Calculate the hash value of the sentence
     * @returns The hash value
     */
    hash(): number {
        // FIXME
        return -1010;
    }

    /**
     * String representation of the sentence
     * @returns The word of the sentence
     */
    toString(): string {
        return this.word;
    }

    /**
     * Debug representation of the sentence
     * @param is_input - Whether the sentence is an input (default: true)
     * @returns A formatted string representation
     */
    repr(is_input = true): string {
        const type = this.is_eternal ? "Sentence" : "Event";
        return `<${type}: ${this.term.repr()}${this.punct}>`;
    }

    /**
     * Check if the sentence is a judgement
     * @returns True if judgement, otherwise false
     */
    get is_judgement(): boolean {
        return this.punct === Punctuation.Judgement;
    }

    /**
     * Check if the sentence is a goal
     * @returns True if goal, otherwise false
     */
    get is_goal(): boolean {
        return this.punct === Punctuation.Goal;
    }

    /**
     * Check if the sentence is a question
     * @returns True if question, otherwise false
     */
    get is_question(): boolean {
        return this.punct === Punctuation.Question;
    }

    /**
     * Check if the sentence is a quest
     * @returns True if quest, otherwise false
     */
    get is_quest(): boolean {
        return this.punct === Punctuation.Quest;
    }

    /**
     * Check if the sentence is eternal
     * @returns True if eternal, otherwise false
     */
    get is_eternal(): boolean {
        return this.stamp.is_eternal;
    }

    /**
     * Check if the sentence is an event
     * @returns True if event, otherwise false
     */
    get is_event(): boolean {
        return !this.stamp.is_eternal;
    }

}

export { Sentence };