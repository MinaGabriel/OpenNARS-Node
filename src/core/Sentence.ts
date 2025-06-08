import { Term } from "./Term";
import { Punctuation } from "./enums/Enums";
import { Truth } from "./Truth";
import { Stamp } from "./Stamp";
import { Statement } from "./Statement";
import { Identifiable } from "./interface/Identifiable";
import { Task } from "./Task";

/**
 * Abstract Sentence class.
 * Base for Judgement, Goal, and Question.
 */
abstract class Sentence implements Identifiable {
    protected readonly _term: Term;
    protected readonly _punctuation: Punctuation;
    protected readonly _truth: Truth;
    protected readonly _stamp: Stamp;

    constructor(
        term: Term,
        punctuation: Punctuation,
        truth: Truth,
        stamp: Stamp
    ) {
        this._term = term;
        this._punctuation = punctuation;
        this._truth = truth;
        this._stamp = stamp;
    }

    /**
     * Returns a human-readable name for the sentence.
     */
    name(): string {
        const parts: string[] = [
            this.term?.toString() ?? "[null term]",
            this.punctuation?.toString() ?? "[null punctuation]",
        ];

        if (this.truth) parts.push(this.truth.toString());

        if (
            (this.punctuation === Punctuation.JUDGMENT ||
                this.punctuation === Punctuation.QUESTION) &&
            !!this.stamp
        ) {
            parts.push(this.stamp.toString());
        }

        return parts.join(" ");
    }

    /**
     * Returns a string representation of the sentence.
     */
    toString(): string {
        return `${this.name()}`;
    }

    // ========== GETTERS ==========

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

    // ========== METHODS ==========

    /**
     * Checks if the sentence is a question.
     */
    public isQuestion(): boolean {
        return this._punctuation === Punctuation.QUESTION;
    }

    /**
     * Checks if the sentence is a goal.
     */
    public isGoal(): boolean {
        return this._punctuation === Punctuation.GOAL;
    }

    /**
     * Checks if the sentence is a judgement.
     */
    public isJudgement(): boolean {
        return this._punctuation === Punctuation.JUDGMENT;
    }

    /**
     * Checks if the term contains a query variable.
     */
    public containQueryVariable(): boolean {
        return this._term.name().includes("?");
    }

    /**
     * Checks if the sentence is revisable.
     */
    public isRevisable(): boolean {
        const statementTarget = this.term as Statement;
        return (
            statementTarget.copula.symbol === "-->" ||
            statementTarget.copula.symbol === "<=>" ||
            !this.term.hasDependantVariable()
        );
    }

    public isEternal(): boolean {
        return this._stamp.isEternal();
    }
     
    
    atoms(): Term[] {
        let terms: Term[] = [];
        function collectAtoms(term : Term): void {
            const children: Term[] = Array.from(term.terms);
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                 if (child.isStatement() || child.isCompound()) collectAtoms(child);
                 if (child.isAtom())terms.push(child);
            } 
        }
        collectAtoms(this.term);
        return terms;
    }


    achievingLevel(previousBelief: Task | null): number {
        if (!previousBelief) {
            if (this.isJudgement() || this.isGoal()) {
                return Math.abs(this.truth.getExpectation() - 0.5);
            }
            if (this.isQuestion()) {
                return 0;
            }
            throw new Error("achievingLevel: No previous belief and sentence type is not supported.");
        }

        if (this.isJudgement() || this.isGoal()) {
            return 1 - Math.abs(this.truth.getExpectation() - previousBelief.sentence.truth.getExpectation());
        }
        if (this.isQuestion()) {
            return this.containQueryVariable() //FIXME: Check logic in this
                ? previousBelief.sentence.truth.getExpectation()
                : previousBelief.sentence.truth.getConfidence();
        }

        throw new Error("achievingLevel: Sentence type is not supported.");
    }
}

export { Sentence };
