import { hashString } from '../utils/Utility';
import { IndexVar } from './IndexVar';
import { Config } from './Config';
import { TermType } from './TermType';
import { ImmutableOrderedSet } from './ImmutableOrderedSet';

type TermConstructorArgs = {
    word: string;
    do_hashing?: boolean;
    word_sorted?: string | null;
    is_input?: boolean;
    term_type?: TermType;
};

class Term {
    type: TermType;
    word: string;
    word_sorted: string;
    private _components: Set<Term>;
    private _hash_value: number | null;
    private _complexity: number;
 
    has_var: boolean;
    has_ivar: boolean;
    has_dvar: boolean;
    has_qvar: boolean;
    is_var: boolean;
    is_ivar: boolean;
    is_dvar: boolean;
    is_qvar: boolean;
    is_closed: boolean;
    is_interval: boolean;
    is_operation: boolean;

    private _vars_independent: IndexVar;
    private _vars_dependent: IndexVar;
    private _vars_query: IndexVar;

    simplicity: number;
    complexity: number;

    is_statement: boolean;
    is_compound: boolean;
    is_atom: boolean;
    is_commutative: boolean;
    is_higher_order: boolean;
    is_executable: boolean;

    terms: Set<Term>;
    variables: IndexVar[];
    is_mental_operation: boolean;

    /**
     * Create a new Term instance
     * @param args - Constructor arguments
     */
    constructor({
        word,
        do_hashing = false,
        word_sorted = null,
        is_input = false,
        term_type = TermType.ATOM
    }: TermConstructorArgs) { 

        this.type = term_type;
        this.word = word;
        this.word_sorted = word_sorted ?? word;
        this._components = new Set();

        this._hash_value = null;
        this._complexity = 1;

        this.has_var = false;
        this.has_ivar = false;
        this.has_dvar = false;
        this.has_qvar = false;
        this.is_var = false;
        this.is_ivar = false;
        this.is_dvar = false;
        this.is_qvar = false;
        this.is_closed = true;
        this.is_interval = false;
        this.is_operation = false;

        this._vars_independent = new IndexVar();
        this._vars_dependent = new IndexVar();
        this._vars_query = new IndexVar();

        this.simplicity = parseFloat(Math.pow(this._complexity, -Config.r_term_complexity_unit).toFixed(6));
        this.complexity = this._complexity;

        this.is_statement = this.type === TermType.STATEMENT;
        this.is_compound = this.type === TermType.COMPOUND;
        this.is_atom = this.type === TermType.ATOM;
        this.is_commutative = false;
        this.is_higher_order = false;
        this.is_executable = this.is_statement && this.is_operation;

        this.terms = new Set<Term>().add(this);
        this.variables = [this._vars_independent, this._vars_dependent, this._vars_query];
        this.is_mental_operation = false;

        if (do_hashing) this.do_hashing();
    }

    /**
     * Get sub-terms as an ImmutableOrderedSet
     * @returns ImmutableOrderedSet of sub-terms
     */
    sub_terms(): ImmutableOrderedSet<Term> {
        return new ImmutableOrderedSet(Array.from(this._components), [this]);
    }

    /**
     * Count the number of components in the term
     * @returns Number of components
     */
    count(): number {
        return this._components ? this._components.size + 1 : 1;
    }

    components(): Set<Term> {
        return this._components;
    }

    add_compound(c: ImmutableOrderedSet<Term>): void {
        c.toArray().forEach(term => this._components.add(term));
    }

    /**
     * Perform hashing for the term
     * @returns Hash value of the term
     */
    do_hashing(): number {
        // const independentIndices = this._vars_independent?.indices_normalized || '';
        // const dependentIndices = this._vars_dependent?.indices_normalized || '';
        // const queryIndices = this._vars_query?.indices_normalized || '';

        // const hashInput = this.word_sorted + independentIndices + dependentIndices + queryIndices;
        //FIXME
        this._hash_value = hashString('b');
        return this._hash_value;
    }

    /**
     * String representation of the term
     * @returns Term word
     */
    toString(): string {
        return this.word;
    }

    //FIXME
    repr(): string {
        return this.word;
    }


    /**
     * Check equality with another term
     * @param other - Another term to compare
     * @returns True if equal, otherwise false
     */
    equals(other: Term): boolean {
        return other instanceof Term &&
               this.word === other.word &&
               this.type === other.type;
    }

    /**
     * Get the hash code of the term
     * @returns Hash code
     */
    hashCode(): number {
        return hashString(`${this.word}:${this.type}`);
    }
}

export { Term, TermType };
