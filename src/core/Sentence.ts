import { Term } from './Term';
import { Punctuation } from './Punctuation';
import { Truth } from './Truth';
import { Stamp } from './Stamp';
import { Tense } from './Tense';

/**
 * Abstract Sentence class
 * Base for Judgement, Goal, Question
 */
abstract class Sentence {
    protected readonly _term: Term;
    protected readonly _punctuation: Punctuation;
    protected readonly _truth: Truth;
    protected readonly _stamp: Stamp;
    protected readonly _tense: Tense;
    protected readonly _revisable: boolean;
   
    constructor(
        term: Term,
        punctuation: Punctuation,
        truth: Truth,
        stamp: Stamp,
        tense: Tense,
        revisable: boolean = true
    ) {
        this._term = term;
        this._punctuation = punctuation;
        this._truth = truth;
        this._stamp = stamp;
        this._tense = tense;
        this._revisable = revisable;
    }

    /** ========== GETTERS ========== */
    get term(): Term {
        return this._term;
    }

    get punctuation(): Punctuation {
        return this._punctuation;
    }

    get truth(): Truth {
        return this._truth;
    }

    get stamp(): Stamp {
        return this._stamp;
    }

    get tense(): Tense {
        return this._tense;
    }

    get revisable(): boolean {
        return this._revisable;
    }


    /** ========== METHODS ========== */
    toString(): string {
        return [
            this.term.toString(),
            this.punctuation.toString()
        ].filter(Boolean).join(' ');
    }

    isQuestion(): boolean {
        return this._punctuation === Punctuation.QUESTION;
    }

    isJudgement(): boolean {
        return this._punctuation === Punctuation.JUDGMENT;
    }

    containQueryVariable(): boolean {
        return this._term.name.includes('?');
    }
}

export { Sentence };
