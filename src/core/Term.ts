import { hashString } from '../utils/Utility';
import { IndexVar } from './IndexVar';
import { Config } from './Config';
import { ImmutableOrderedSet } from './ImmutableOrderedSet';
import { TermType } from './TermType';

class Term {
    private name: string;
    private type: TermType;
    private components: Set<Term> = new Set<Term>;

    private _complexity: number = 1;

    public is_variable : boolean = false;


    constructor(name: string, type: TermType) {
        this.name = name;
        this.type = type;
    }

    toString(): string {
        return this.name;
    }

    getTermType(): TermType {
        return this.type;
    }

    equals(that: Term): boolean {
        return that instanceof Term && this.getName() === that.getName();
    }

    public get isStatement(): boolean {
        return this.type === TermType.STATEMENT;
    }

    public get isCompound(): boolean {
        return this.type === TermType.COMPOUND;
    }

    public get isAtom(): boolean {
        return this.type === TermType.ATOM;
    }

    public subTerms(): ImmutableOrderedSet<Term> {
        return new ImmutableOrderedSet(Array.from(this.components), [this]);
    }

    addComponents(_: ImmutableOrderedSet<Term>): void {
        _.toArray().forEach(term => this.components.add(term));
    }

    public toJSON(): any {
        return {
            name: this.name,
            components: Array.from(this.components).map(component => component.toJSON()),
        };
    }

    //check if two terms are identical

    public identical(that: Term): boolean {
        if (!(that instanceof Term)) return false;

        const thisJSON = JSON.stringify(this.toJSON());
        const thatJSON = JSON.stringify(that.toJSON());

        return thisJSON === thatJSON;
    }

    
    //MATH :: 
    public get simplicity(): number {
        return Math.max(0, Math.min(1, 1 / Math.sqrt(this.complexity)));
    }

    /**
    * Gets the complexity of the term
    * Base complexity for atomic terms is 1
    * @returns number >= 1
    */
    public  get complexity(): number {
        return this._complexity;
    }

    public set complexity(val: number) {
        this._complexity = val;
    }

    getName(): string {
        return this.name;
    }

    clone(): Term {
        return new Term(this.name, this.type);
    }


}

export { Term };


/**
 * What does this code mean?
 * You have two related properties:
 * 
 * 1️⃣ complexity
 * This is the measure of how complex a term is.
 * 
 * For an atomic (basic) term, it’s set as 1 by default.
 * 
 * In a real system, more complex terms (like large compounds or nested statements) might have higher values,
 * but in this snippet, it just returns 1.
 * 
 * So, atomic terms → complexity = 1.
 * 
 * 2️⃣ simplicity
 * This is the inverse measure of complexity: how “simple” the term is.
 * 
 * The formula used is:
 * simplicity = max(0, min(1, 1 / sqrt(complexity)))
 * 
 * Let’s break this formula down:
 * - sqrt(complexity) → takes the square root of the complexity.
 * - 1 / sqrt(complexity) → the higher the complexity, the lower the simplicity.
 * - max(0, min(1, ⋅)) → clamps the result between 0 and 1 so simplicity is always in this safe range.
 * 
 * 🔧 Why is it designed this way?
 * 
 * If complexity = 1,
 * simplicity = 1 / sqrt(1) = 1 → maximum simplicity.
 * 
 * If complexity = 4,
 * simplicity = 1 / sqrt(4) = 1 / 2 = 0.5
 * 
 * If complexity = 100,
 * simplicity = 1 / sqrt(100) = 1 / 10 = 0.1
 * 
 * This means:
 * - Simple (atomic) terms → simplicity near 1.
 * - Very complex (nested) terms → simplicity approaches 0.
 * 
 * 🧠 Conceptual meaning in NARS
 * In NARS:
 * - Simple terms are easier to work with, infer from, and match.
 * - Complex terms carry more structural weight and might need more careful reasoning.
 * - Tracking simplicity allows the system to favor simpler solutions when possible
 *   (following the principle of parsimony or Occam’s razor).
 * 
 * Example:
 * | Term                                 | Complexity  | Simplicity  |
 * |--------------------------------------|-------------|-------------|
 * | A (atomic)                           | 1           | 1.0         |
 * | <A --> B> (simple statement)         | maybe 2 or 3| ~0.7–0.5    |
 * | <(*, A, B) --> C> (compound product) | maybe 4–5   | ~0.5–0.45   |
 * | <(&&, <A --> B>, <C --> D>) --> E>   | maybe 9–16  | ~0.33–0.25  |
 * 
 * (Note: the exact numbers depend on how the full system defines complexity beyond just returning 1.)
 * 
 * If you want, I can explain how you might extend the complexity method to calculate real values
 * based on term structure! Let me know.
 */

