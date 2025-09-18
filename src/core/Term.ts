import { nanoid } from 'nanoid';
import { ImmutableOrderedSet } from './utils/ImmutableOrderedSet';
import { TermType } from './enums/Enums';
import { Symbols } from './enums/Symbols';
import { TemporalTypes } from './enums/Enums';
import { Identifiable } from './interface/Identifiable';
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
    get simplicity(): number{ return Math.pow(this.complexity , -1.0)}   //TOOBAD: Need to know when is this 0.5 and 1.0 Issue 1

    name(): string { return this._name; }
    toString(): string { return this._name;}

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