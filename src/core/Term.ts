import { nanoid } from 'nanoid';
import { ImmutableOrderedSet } from './ImmutableOrderedSet';
import { TermType } from './TermType';
import { Symbols } from './Symbols';

class Term {
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
    get name(): string { return this._name; }
    get type(): TermType { return this._type; }
    get key(): string { return this._key; }
    get complexity(): number { return this._complexity; }
    get terms(): Set<Term> { return new Set(this._terms); }
    get components(): Set<Term> { return new Set(this._components); }

    get isAtom(): boolean { return this._type === TermType.ATOM; }
    get isCompound(): boolean { return this._type === TermType.COMPOUND; }
    get isStatement(): boolean { return this._type === TermType.STATEMENT; }

    get hasVariable(): boolean { return this._hasVariable; }
    get hasVariableDependant(): boolean { return this._hasDependantVariable; }
    get hasVariableIndependent(): boolean { return this._hasIndependentVariable; }
    get hasVariableQuery(): boolean { return this._hasQueryVariable; }

    /** ========== CONTROLLED SETTERS ========== */
    set complexity(val: number) {
        if (val >= 1) this._complexity = val;
    }

    /** ========== METHODS ========== */

    toString(): string {
        return this._name;
    }

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
        return that instanceof Term && this._name === that.name;
    }

    public clone(): Term {
        const cloned = new Term(this._name, this._type, this._variable);
        cloned.complexity = this._complexity;
        cloned._components = new Set([...this._components].map(term => term.clone()));
        cloned._terms = new Set([...this._terms].map(term => term.clone()));
        return cloned;
    }
}

export { Term };
