import { nanoid } from 'nanoid';
import { ImmutableOrderedSet } from './utils/ImmutableOrderedSet';
import { TermType } from './enums/Enums';
import { Symbols } from './enums/Symbols';
import { TemporalTypes } from './enums/Enums';
import { Identifiable } from './interface/Identifiable';
import { Statement } from './Statement';
export class Term implements Identifiable {
    private readonly _key: string = nanoid(8);
    private _complexity: number = 1;
    private _terms: Set<Term> = new Set();
    private _components: Set<Term> = new Set();
    private _hasVariable: boolean = true;
    private _hasDependantVariable: boolean = false;
    private _hasIndependentVariable: boolean = false;
    private _hasQueryVariable: boolean = false;

    constructor(private readonly _name: string, private readonly _type: TermType, private readonly _variable: string = "") {
        switch (_variable) {
            case Symbols.VAR_INDEPENDENT:
                this._hasIndependentVariable = true;
                break;
            case Symbols.VAR_DEPENDENT:
                this._hasDependantVariable = true;
                break;
            case Symbols.VAR_QUERY:
                this._hasQueryVariable = true;
                break;
            default:
                this._hasVariable = false;
        }
    }

    /** ========== READ-ONLY GETTERS ========== */

    get type(): TermType { return this._type; }
    get key(): string { return this._key; }
    get complexity(): number { return this._complexity; }
    get terms(): Set<Term> { return new Set(this._terms); }
    get components(): Set<Term> { return new Set(this._components); }
    get temporalOrder(): TemporalTypes { return TemporalTypes.ORDER_NONE; }
    get simplicity(): number { return Math.pow(this.complexity, -1.0) }   //TOOBAD: Need to know when is this 0.5 and 1.0 Issue 1

    name(): string { return this._name; }
    toString(): string { return this._name; }

    isAtom(): boolean { return this._type === TermType.ATOM; }
    isCompound(): boolean { return this._type === TermType.COMPOUND; }
    isStatement(): boolean { return this._type === TermType.STATEMENT; }
    variable(): string { return this._variable; }

    hasVariable(): boolean { return this._hasVariable; }
    hasDependantVariable(): boolean { return this._hasDependantVariable; }
    hasIndependentVariable(): boolean { return this._hasIndependentVariable; }
    hasQueryVariable(): boolean { return this._hasQueryVariable; }

    /** ========== CONTROLLED SETTERS ========== */
    set complexity(val: number) {
        if (val >= 1) this._complexity = val;
    }

    /** ========== METHODS ========== */



    public subTerms(): ImmutableOrderedSet<Term> {
        return new ImmutableOrderedSet([this], Array.from(this._components));
    }

    public addComponents(set: ImmutableOrderedSet<Term>): void {
        set.toArray().forEach(term => this._components.add(term));
    }

    public addTerms(set: ImmutableOrderedSet<Term>): void {
        this._terms = new Set(set.toArray());
    }

    public identical(that: Term): boolean {
        return that instanceof Term && this._key === that.key;
    }

    public equals(that: Term): boolean {
        return that instanceof Term && this.name() === that.name();
    }

    public clone(): Term {
        const cloned = new Term(this._name, this._type, this._variable);
        cloned.complexity = this._complexity;
        cloned._components = new Set([...this._components].map(term => term.clone()));
        cloned._terms = new Set([...this._terms].map(term => term.clone()));
        return cloned;
    }

    /**
     * isStructurallyCompatible
     * 
     * Checks whether this term and another term can be considered compatible
     * under variable/constant matching rules.
     * 
     * Examples:
     *   <bird --> ?x> vs <bird --> fly> → true   (variable matches constant)
     *   <$0 --> A> vs <$1 --> A>         → true   (same variable type)
     *   <dog --> run> vs <cat --> run>   → false  (constants differ)
     *   <$0 --> A> vs <?x --> A>         → false  (different variable types)
     */
    public isStructurallyCompatible(that: Term): boolean {
        if (that.isAtom()) {
            if (this.hasVariable() !== that.hasVariable()) return true; // var vs const
            if (this.hasVariable() && that.hasVariable()) {
                return (
                    (this.hasIndependentVariable() && that.hasIndependentVariable()) ||
                    (this.hasDependantVariable() && that.hasDependantVariable()) ||
                    (this.hasQueryVariable() && that.hasQueryVariable())
                );
            }
            return this.identical(that); // both constants
        }
        if ((that.isCompound() || that.isStatement()) && this.hasVariable()) return true;
        return false;
    }

    /**
     * unifyWith
     *
     * Attempts to unify this term with another term under NAL-style 
     * structural compatibility and variable-binding rules.
     *
     * Rules:
     * - A query variable (?x) can bind to an atomic, compound, or statement term.  
     * - If the same variable appears multiple times, it must bind consistently.  
     * - Two variables are only compatible if they are of the same type 
     *   (independent, dependent, query).  
     * - Two atomic terms are compatible only if they are identical.  
     *
     * Returns:
     * - `{ substitutionMap }` if unification succeeds.
     * - `null` if unification fails.
     *
     * Examples:
     *   <bird --> ?x> unifyWith <bird --> fly>          
     *     → { "?x": fly }
     *
     *   <<?x --> A> --> <?x --> B>> unifyWith <<C --> A> --> <C --> B>>  
     *     → { "?x": C }
     *
     *   <dog --> run> unifyWith <dog --> run>           
     *     → { }   (no variables, identical atoms)
     *
     *   <dog --> run> unifyWith <cat --> run>           
     *     → null  (constant mismatch)
     */
    public unifyWith(that: Term): { substitutionMap: Map<string, Term> } | null {
        const unify = (self: Term, other: Term, m: Map<string, Term>): boolean => {
            if (self.hasQueryVariable()) { //TOOBAD: Need to make this more general
                if (m.has(self.name())) return m.get(self.name())?.name() === other.name();
                m.set(self.name(), other);
                return true;
            }
            if (self.isStatement() && other.isStatement()) {
                const s = self as Statement;
                const o = other as Statement;
                if (s.copula.symbol !== o.copula.symbol) return false;
                return unify(s.subject, o.subject, m) && unify(s.predicate, o.predicate, m);
            }
            return self.name() === other.name();
        };

        const map = new Map<string, Term>();
        return unify(this, that, map) ? { substitutionMap: map } : null;
    }




    public static getAncestorPairs(node: Term, ancestors: Term[] = [], pairs: [Term, Term][] = []): [Term, Term][] {
        // Log ancestor links *before* visiting children
        for (const ancestor of ancestors) {
            if (pairs.some(([existingAncestor, existingNode]) =>
                existingAncestor.identical(ancestor) && existingNode.identical(node))) {
                continue;
            }
            pairs.push([ancestor, node]); // Add the ancestor-descendant pair if not already in the list
        }
        if (node.isAtom()) return pairs; // stop recursion if node is an atom
        for (const child of node.components) {
            this.getAncestorPairs(child, [node, ...ancestors], pairs); // Add current node to ancestor chain
        }
        return pairs;
    }


} 