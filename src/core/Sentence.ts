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
    protected readonly term: Term;
    protected readonly punctuation: Punctuation;
    protected readonly truth: Truth;
    protected readonly stamp: Stamp;
    protected readonly tense: Tense;
    protected readonly revisable: boolean;

    constructor(
        term: Term,
        punctuation: Punctuation,
        truth: Truth,
        stamp: Stamp,
        tense: Tense,
        revisable: boolean = true
    ) {
        this.term = term;
        this.punctuation = punctuation;
        this.truth = truth;
        this.stamp = stamp;
        this.tense = tense;
        this.revisable = revisable;

    }

    public getTerm(): Term {
        return this.term;
    }

    public isQuestion(): boolean {
        return this.punctuation == Punctuation.QUESTION;
    }
    public isJudgement(): boolean {
        return this.punctuation == Punctuation.JUDGMENT;
    }


    public getPunctuation(): Punctuation {
        return this.punctuation;
    }

    public getTruth(): Truth {
        return this.truth;
    }

    public getStamp(): Stamp {
        return this.stamp;
    }

    public getTense(): Tense {
        return this.tense;
    }

    public isRevisable(): boolean {
        return this.revisable;
    }

    public containQueryVariable(): boolean {
        return this.term.getName().includes('?');
    }

    public toString(): string {
        return [
            this.term.toString(),
            this.punctuation.toString() + ' ',
            this.truth?.toString(),
            this.stamp?.toString()
        ].filter(Boolean).join(' ');
    }
}

export { Sentence };
