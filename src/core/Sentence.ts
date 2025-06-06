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
            !this.term.hasVariableDependant()
        );
    }

    public isEternal(): boolean {
        return this._stamp.isEternal();
    }

    achievingLevel(previousBelief: Task | null): number {
        if ((this.isJudgement() || this.isGoal()) && previousBelief != null) return (1 - Math.abs(this.truth.getExpectation() - previousBelief.sentence.truth.getExpectation()));
        if ((this.isJudgement() || this.isGoal()) && previousBelief == null) return Math.abs(this.truth.getExpectation() - 0.5);
        if (this.isQuestion() && previousBelief != null) return 1 - Math.abs(this.truth.getExpectation() - 0.5);
        if (this.isQuestion() && previousBelief == null) return 0.5;
        return 0;
    }
}

export { Sentence };
