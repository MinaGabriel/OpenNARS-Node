// External deps
import { nanoid } from 'nanoid';
import numeral from 'numeral';

// Math / truth helpers
import { ShortFloat, MathFunctions, BudgetFunctions } from './RuleFunctions';

// Core symbols & enums
import {
    Symbols,
    ConnectorType,
    CopulaSymbols, CopulaSymbol,
    Punctuation,
    Tense,
    Parameters,
    TermType,
    TaskType,
    TemporalTypes,
    Identifiable,
} from './Symbols';

// Memory / state
import { MemoryStore } from './Memory';

// Collections
import { ImmutableOrderedSet } from './ImmutableOrderedSet';


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


/**
 * Statement class representing a NAL statement with subject, copula, and predicate
 * @extends Term
 */
class Statement extends Term {
    subject: Term;
    copula: Copula;
    predicate: Term;
    //if any term has a query variable then the statement has a query variable
    hasVariable(): boolean {
        return this.subject.hasVariable() || this.predicate.hasVariable();
    }


    constructor(subject: Term, copula: Copula, predicate: Term, type: TermType) {
        // Determine the word and word_sorted based on commutativity 

        const new_term = `<${subject}${copula}${predicate}>`;

        // Call the Term constructor
        super(new_term, type);

        // Initialize properties
        this.subject = subject;
        this.copula = copula;
        this.predicate = predicate;


        this.addTerms(new ImmutableOrderedSet([subject, predicate]));
        //change complexity of the term
        this.complexity += (subject.complexity + predicate.complexity)
        // Create an ordered set of components
        this.addComponents(new ImmutableOrderedSet(subject.subTerms().toArray(), predicate.subTerms().toArray()));

    }

}

export { Statement };

class Budget {
    private mark: string = Symbols.BUDGET_VALUE_MARK;
    private separator: string = Symbols.VALUE_SEPARATOR;
    private _priority: ShortFloat;
    private _durability: ShortFloat;
    private _quality: ShortFloat;

    constructor(budget?: Budget, p?: number, d?: number, q?: number) {
        if (budget) {
            this._priority = new ShortFloat(budget.priority);
            this._durability = new ShortFloat(budget.durability);
            this._quality = new ShortFloat(budget.quality);
        } else {
            this._priority = new ShortFloat(p ?? 0.01);
            this._durability = new ShortFloat(d ?? 0.01);
            this._quality = new ShortFloat(q ?? 0.01);
        }
    }

    get priority(): number {
        return this._priority.getValue();
    }
    set priority(value: number) {
        this._priority.setValue(value);
    }

    get durability(): number {
        return this._durability.getValue();
    }
    set durability(value: number) {
        this._durability.setValue(value);
    }

    get quality(): number {
        return this._quality.getValue();
    }
    set quality(value: number) {
        this._quality.setValue(value);
    }

    /**
     * To summarize a BudgetValue into a single number in [0, 1]
     * @return The summary value
     */
    summary(): number {
        //TRACK: where is this coming from?
        return this.durability * (this.priority + this.quality) / 2;
    }
    // Increase priority using probabilistic OR (noisy-OR)
    increasePriority(newValue: number): void {
        this.priority = MathFunctions.or(this.priority, newValue);
    }

    // Decrease priority using probabilistic AND (noisy-AND)
    decreasePriority(newValue: number): void {
        this.priority = MathFunctions.and(this.priority, newValue);
    }

    increaseQuality(newValue: number): void {
        this.quality = MathFunctions.or(this.quality, newValue);
    }

    decreaseQuality(newValue: number): void {
        this.quality = MathFunctions.and(this.quality, newValue);
    }

    increaseDurability(newValue: number): void {
        this.durability = MathFunctions.or(this.durability, newValue);
    }

    decreaseDurability(newValue: number): void {
        this.durability = MathFunctions.and(this.durability, newValue);
    }

    merge(that: Budget): void {
        BudgetFunctions.merge(this, that);
    }



    singleValue(): number {
        return MathFunctions.average(this.priority, this.durability, this.quality);
    }

    aboveThreshold(): boolean {
        return this.singleValue() > 0.001;
    }

    reducePriorityByAchievingLevel(h: number): void {
        this.priority = this.priority * (1 - h);
    }

    toString(): string {
        return (
            this.mark +
            this._priority.toString() +
            this.separator +
            this._durability.toString() +
            this.separator +
            this._quality.toString() +
            this.mark
        );
    }

    toStringTwo(): string {
        return (
            this.mark +
            this._priority.toStringTwoDigits() +
            this.separator +
            this._durability.toStringTwoDigits() +
            this.separator +
            this._quality.toStringTwoDigits() +
            this.mark
        );
    }

    reduceByAchievingLevel(h: number): void {
        this.priority = this.priority * (1 - h);
    }
}

export { Budget };




class Compound extends Term {
    private _connector: Connector;


    constructor(connector: Connector, terms: Term[], is_input: boolean = false) {
        super(Compound.termsToWord(connector, terms), TermType.COMPOUND);
        this._connector = connector;

        //Add term complexity and components
        this.complexity = terms.reduce((acc, term) => acc + term.complexity, 0); // Complexity calculation
        this.addTerms(new ImmutableOrderedSet(terms));
        this.addComponents(new ImmutableOrderedSet(terms.map(term => term.subTerms().toArray()).flat()));

    }

    get connector(): Connector { return this._connector; }


    private static termsToWord(connector: Connector, terms: Term[]): string {
        // this return the string literal example '(--, <A-->B>)'
        return `(${connector.type.toString()}, ${terms.map(term => term.toString()).join(', ')})`;
    }


}

export { Compound };



export class Connector {
    private _is_commutative: boolean;
    private _is_product_or_image: boolean;
    private _is_single_only: boolean;
    private _is_double_only: boolean;
    private _is_multiple_only: boolean;
    private _is_temporal: boolean;
    private _is_predictive: boolean;
    private _is_concurrent: boolean;
    private _atemporal_version: ConnectorType;
    private _concurrent_version: ConnectorType;
    private _predictive_version: ConnectorType;

    constructor(public readonly type: ConnectorType) {
        // Compute once and store

        this._is_commutative = [
            ConnectorType.CONJUNCTION,
            ConnectorType.DISJUNCTION,
            ConnectorType.PARALLEL_EVENTS,
            ConnectorType.INTENSIONAL_INTERSECTION,
            ConnectorType.EXTENSIONAL_INTERSECTION,
            ConnectorType.INTENSIONAL_SET,
            ConnectorType.EXTENSIONAL_SET
        ].includes(type);

        this._is_single_only = type === ConnectorType.NEGATION;

        this._is_product_or_image = [
            ConnectorType.PRODUCT,
            ConnectorType.EXTENSIONAL_IMAGE,
            ConnectorType.INTENSIONAL_IMAGE
        ].includes(type);

        this._is_double_only = [
            ConnectorType.EXTENSIONAL_DIFFERENCE,
            ConnectorType.INTENSIONAL_DIFFERENCE
        ].includes(type);

        this._is_multiple_only = [
            ConnectorType.CONJUNCTION,
            ConnectorType.DISJUNCTION,
            ConnectorType.PARALLEL_EVENTS,
            ConnectorType.SEQUENTIAL_EVENTS,
            ConnectorType.INTENSIONAL_INTERSECTION,
            ConnectorType.EXTENSIONAL_INTERSECTION,
            ConnectorType.EXTENSIONAL_DIFFERENCE,
            ConnectorType.INTENSIONAL_DIFFERENCE,
            ConnectorType.INTENSIONAL_IMAGE,
            ConnectorType.EXTENSIONAL_IMAGE
        ].includes(type);

        this._is_temporal = [
            ConnectorType.SEQUENTIAL_EVENTS,
            ConnectorType.PARALLEL_EVENTS
        ].includes(type);

        this._is_predictive = type === ConnectorType.SEQUENTIAL_EVENTS;
        this._is_concurrent = type === ConnectorType.PARALLEL_EVENTS;

        this._atemporal_version = this._is_temporal ? ConnectorType.CONJUNCTION : type;
        this._concurrent_version = type === ConnectorType.CONJUNCTION ? ConnectorType.PARALLEL_EVENTS : type;
        this._predictive_version = type === ConnectorType.CONJUNCTION ? ConnectorType.SEQUENTIAL_EVENTS : type;
    }


    /** Whether this connector is commutative (order doesn't matter) */
    public get is_commutative(): boolean {
        return this._is_commutative;
    }

    public get is_product_or_image(): boolean {
        return this._is_product_or_image;
    }

    /** Whether this connector accepts only one term */
    public get is_single_only(): boolean {
        return this._is_single_only;
    }

    /** Whether this connector accepts exactly two terms */
    public get is_double_only(): boolean {
        return this._is_double_only;
    }

    /** Whether this connector requires two or more terms */
    public get is_multiple_only(): boolean {
        return this._is_multiple_only;
    }

    /** Whether this connector implies time (sequential or parallel events) */
    public get is_temporal(): boolean {
        return this._is_temporal;
    }

    /** Whether this connector is specifically predictive (sequential events) */
    public get is_predictive(): boolean {
        return this._is_predictive;
    }

    /** Whether this connector implies concurrency (parallel events) */
    public get is_concurrent(): boolean {
        return this._is_concurrent;
    }

    /** Atemporal version of this connector (e.g., &/ → &&) */
    public get atemporal_version(): ConnectorType {
        return this._atemporal_version;
    }

    /** Concurrent version of this connector (e.g., && → &|) */
    public get concurrent_version(): ConnectorType {
        return this._concurrent_version;
    }

    /** Predictive version of this connector (e.g., && → &/) */
    public get predictive_version(): ConnectorType {
        return this._predictive_version;
    }

    /** Validate number of terms allowed with this connector */
    public check_valid(len_terms: number): boolean {
        if (this._is_single_only) return len_terms === 1;
        if (this._is_double_only) return len_terms === 2;
        if (this._is_multiple_only) return len_terms > 1;
        return len_terms > 0;
    }
}

/**
 * Abstract Sentence class.
 * Base for Judgement, Goal, and Question.
 */
abstract class Sentence implements Identifiable {
    protected readonly _term: Term;
    protected readonly _punctuation: Punctuation;
    protected readonly _truth: Truth | null;
    protected readonly _stamp: Stamp;
    _bestSolution: Task | null = null;

    constructor(term: Term, punctuation: Punctuation, truth: Truth | null, stamp: Stamp) {
        this._term = term;
        this._punctuation = punctuation;
        this._truth = truth;
        this._stamp = stamp;
    }

    /**
     * Returns a human-readable name for the sentence.
     */
    name(): string {
        const parts: string[] = [this.term?.toString() ?? "[null term]", this.punctuation?.toString() ?? "[null punctuation]"];

        if (this.truth) parts.push(this.truth.toString());

        if ((this.punctuation === Punctuation.JUDGMENT || this.punctuation === Punctuation.QUESTION) && !!this.stamp) { parts.push(this.stamp.toString()); }

        return parts.join(" ");
    }

    /**
     * Returns a string representation of the sentence.
     */
    toString(): string { return `${this.name()}`; }

    // ========== GETTERS ==========

    get term(): Term { return this._term; }

    get punctuation(): Punctuation { return this._punctuation; }

    get truth(): Truth | null { return this._truth; }

    get stamp(): Stamp { return this._stamp; }

    get bestSolution(): Task | null { return this._bestSolution; }
    set bestSolution(value: Task | null) { this._bestSolution = value; }

    // ========== METHODS ==========

    /**
     * Checks if the sentence is a question.
     */
    public isQuestion(): boolean { return this._punctuation === Punctuation.QUESTION; }

    public isGoal(): boolean { return this._punctuation === Punctuation.GOAL; }

    public isJudgement(): boolean { return this._punctuation === Punctuation.JUDGMENT; }

    public containQueryVariable(): boolean { return this._term.name().includes("?"); }

    public isRevisable(): boolean {
        const statementTarget = this.term as Statement;
        return (statementTarget.copula.symbol === "-->" || statementTarget.copula.symbol === "<=>" || !this.term.hasDependantVariable());
    }

    public isEternal(): boolean { return this._stamp.isEternal(); }

    atoms(): Term[] {
        let terms: Term[] = [];
        function collectAtoms(term: Term): void {
            const children: Term[] = Array.from(term.terms);
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.isStatement() || child.isCompound()) collectAtoms(child);
                if (child.isAtom()) terms.push(child);
            }
        }
        collectAtoms(this.term);
        return terms;
    }
}

export { Sentence };




export class Copula {
    public readonly symbol: CopulaSymbol;

    private constructor(symbol: CopulaSymbol) {
        this.symbol = symbol;
    }

    toString(): string { return this.symbol; }

    public isHigherOrder(): boolean {
        return [
            "==>", "<=>", "=/>", "=|>", "=\\>", "</>", "<|>"
        ].includes(this.symbol);
    }

    public isInheritanceOrSimilarity(): boolean {
        return this.symbol === "-->" || this.symbol === "<->";
    }

    // Static map for quick lookup
    private static symbolMap: Record<CopulaSymbol, Copula> = Object.entries(CopulaSymbols)
        .reduce((map, [symbol, name]) => {
            map[symbol as CopulaSymbol] = new Copula(symbol as CopulaSymbol);
            return map;
        }, {} as Record<CopulaSymbol, Copula>);

    /**
     * Lookup Copula by symbol
     */
    public static fromSymbol(symbol: string): Copula | undefined {
        return Copula.symbolMap[symbol as CopulaSymbol];
    }


}

// PEG.js Copula rule should call: Copula.fromSymbol(value)import { Truth } from './Truth';


class Goal extends Sentence {


}

export { Goal };



/**
 * Base Item class for NARS system
 * Provides budget management and comparison functionality
 */
abstract class Item {
    protected _key: string;
    _budget: Budget;

    constructor(key?: string, budget?: Budget) {
        this._key = key ?? '';
        this._budget = budget ? new Budget(budget) : new Budget();
    }

    get key(): string { return this._key; }
    get budget(): Budget { return this._budget; }
    get priority(): number { return this._budget.priority; }
    get durability(): number { return this._budget.durability; }
    get quality(): number { return this._budget.quality; }
    set key(value: string) { this._key = value; }
    set priority(value: number) { this._budget.priority = value; }
    set durability(value: number) { this._budget.durability = value; }
    set quality(value: number) { this._budget.quality = value; }
    set budget(value: Budget) { this._budget = value; }
    merge(that: Item): void { this._budget.merge(that.budget); }
}

export { Item };





export class Judgement extends Sentence {
    constructor(term: Term, punctuation: Punctuation, truth: Truth, tense?: Tense | null, stamp?: Stamp | null) {

        if (truth === null) truth = new Truth(1.0, Parameters.DEFAULT_JUDGMENT_CONFIDENCE)

        /* if -1, will be set right before the Task is input NarseseChannel */
        const base = new BaseEntry(Number(MathFunctions.randomSigned64Bit()), MemoryStore.getState().getNextStampSerial());
        const finalStamp = stamp ? stamp : new Stamp(-1, tense !== undefined ? tense : null, base, Parameters.DURATION);
        super(term, punctuation, truth, finalStamp);
    }

}


class Question extends Sentence {
    constructor(term: Term, tense?: Tense | null) {

        /* if -1, will be set right before the Task is input NarseseChannel */
        const base = new BaseEntry(Number(MathFunctions.randomSigned64Bit()), MemoryStore.getState().getNextStampSerial());
        const finalStamp = new Stamp(-1, tense !== undefined ? tense : null, base, Parameters.DURATION);
        super(term, Punctuation.QUESTION, null, finalStamp);
    }

}

export { Question };




/**
 * Represents a single evidence entry with NAR and input identifiers.
 */
export class BaseEntry {
    constructor(
        public readonly narId: number,
        public readonly inputId: number
    ) { }

    toString(): string {
        return `(${this.narId},${this.inputId})`;
    }

    equals(other?: BaseEntry): boolean {
        return !!other && this.narId === other.narId && this.inputId === other.inputId;
    }
}

/**
 * Represents a stamp in NARS, containing evidential base and temporal information.
 * Implements identifiable interface for Non-Axiomatic Logic (NAL).
 */


export class Stamp implements Identifiable {
    private readonly _evidentialBase: BaseEntry[];
    private _creationTime: number;
    private _occurrenceTime: number;
    private readonly _tense: Tense | null;
    private _name: string | null;
    private _evidentialHash: number | null;
    public static readonly ETERNAL: number = -2147483648;

    constructor(time: number, tense: Tense | null, serial: BaseEntry, duration: number) {
        this._evidentialBase = [serial];
        this._tense = tense;
        this._name = null;
        this._evidentialHash = null;
        this._creationTime = time;
        this._occurrenceTime = this.calculateOccurrenceTime(time, tense, duration);
    }

    get evidentialBase(): BaseEntry[] {
        return [...this._evidentialBase];
    }

    set evidentialBase(entries: BaseEntry[]) {
        this._evidentialBase.length = 0;
        this._evidentialBase.push(...entries);
        this._evidentialHash = null;
        this._name = null;
    }

    get creationTime(): number {
        return this._creationTime;
    }

    set creationTime(time: number) {
        this._creationTime = time;
        this._name = null;
    }

    get occurrenceTime(): number {
        return this._occurrenceTime;
    }

    set occurrenceTime(time: number) {
        if (this._occurrenceTime !== time) {
            this._occurrenceTime = time;
            this._name = null;
        }
    }

    get tense(): Tense | null {
        return this._tense;
    }

    name(): string {
        if (!this._name) {
            const base = this._evidentialBase.map(e => e.toString()).join(Symbols.STAMP_SEPARATOR);
            const timePart = this.isEternal() ? '' : `|${this._occurrenceTime}`;
            this._name = `${Symbols.STAMP_OPENER}${this._creationTime}${timePart} ${Symbols.STAMP_STARTER} ${base}${Symbols.STAMP_CLOSER}`;
        }
        return this._name;
    }

    toString(): string {
        return this.name();
    }

    private calculateOccurrenceTime(time: number, tense: Tense | null, duration: number): number {
        if (tense === null || tense === Tense.Eternal) return Stamp.ETERNAL;
        if (tense === Tense.Past) return time - duration;
        if (tense === Tense.Future) return time + duration;
        return time; // Tense.Present
    }

    evidentialHash(): number {
        if (this._evidentialHash === null) {
            const baseStrings = this._evidentialBase.map(e => e.toString()).sort();
            let hash = 0;
            for (const str of baseStrings) {
                for (let i = 0; i < str.length; i++) {
                    hash = (hash * 31 + str.charCodeAt(i)) | 0;
                }
            }
            this._evidentialHash = hash;
        }
        return this._evidentialHash;
    }

    isEternal(): boolean {
        return this._occurrenceTime === Stamp.ETERNAL;
    }

    equals(other: Stamp, creationTimeCheck: boolean, occurrenceTimeCheck: boolean, evidentialBaseCheck: boolean): boolean {
        if (this === other) return true;
        if (creationTimeCheck && this._creationTime !== other._creationTime) return false;
        if (occurrenceTimeCheck && this._occurrenceTime !== other._occurrenceTime) return false;
        if (evidentialBaseCheck && this.evidentialHash() !== other.evidentialHash()) return false;
        return true;
    }

    static baseOverlap(a: Stamp, b: Stamp): boolean {
        const base1 = a.evidentialBase;
        const base2 = b.evidentialBase;
        if (!base1.length || !base2.length) return false;
        const set = new Set(base1.map(e => e.toString()));
        return base2.some(e => set.has(e.toString()));
    }
}








/**
 * Task class representing a NARS task
 * Extends the base Item class
 */
export class Task extends Item implements Identifiable {
    private _sentence: Sentence;
    //best Goal or Question answer found for this task.
    private _bestSolution: Sentence | null = null;
    private _achievement: number | null = null;

    _budget: Budget;

    taskType: TaskType = TaskType.INPUT;

    constructor(sentence: Sentence, budget: Budget) {
        super(sentence.toString(), budget);
        this._sentence = sentence;
        this._budget = budget ?? new Budget();
    }
    name(): string {
        return this._sentence.toString();
    }
    toString(): string {
        return `${this._budget.toString()} ${this._sentence.toString()}`;
    }
    isInput(): boolean {
        return this.taskType === TaskType.INPUT;
    }
    get sentence(): Sentence {
        return this._sentence;
    }
    get term(): Term {
        return this._sentence.term;
    }

    public get bestSolution(): Sentence | null {
        return this._bestSolution;
    }
    public set bestSolution(value: Sentence) {
        this._bestSolution = value;
    }

    public get achievement(): number | null {
        return this._achievement;
    }
    public set achievement(value: number | null) {
        this._achievement = value;
    }

}







/**
 * Represents a truth value with frequency and confidence.
 * Implements NARS truth value logic.
 */
export class Truth implements Identifiable {
    delimiter: string = Symbols.TRUTH_VALUE_MARK;
    separator: string = Symbols.VALUE_SEPARATOR;
    isAnalytic: boolean = false;
    frequency: ShortFloat;
    confidence: ShortFloat;
    // k is a constant used in the expectation calculation, defaulting to 1
    k: number = 1;

    constructor(f: number | ShortFloat, c: number | ShortFloat) {
        this.frequency = typeof f === 'number' ? new ShortFloat(f) : f;
        this.confidence = typeof c === 'number' ? new ShortFloat(c) : c;
    }

    /**
     * Returns a formatted string representation of the truth value.
     */
    name(): string {
        return `${this.delimiter}${numeral(this.frequency).format('0.00')}${this.separator}${numeral(this.confidence).format('0.00')}${this.delimiter}`;
    }

    /**
     * Returns the string representation of the truth value.
     */
    toString(): string {
        return this.name();
    }

    /**
     * Gets the frequency as a number.
     */
    public getFrequency(): number {
        return this.frequency.getValue();
    }

    /**
     * Gets the confidence as a number.
     */
    public getConfidence(): number {
        return this.confidence.getValue();
    }

    /**
     * Calculates the expectation value.
     */
    public getExpectation(): number {
        return this.getConfidence() * (this.getFrequency() - 0.5) + 0.5;
    }

    /**
     * Returns the absolute difference between a given expectation and this truth's expectation.
     */
    public getExpDifAbs(e: number): number {
        return Math.abs(e - this.getExpectation());
    }

    /**
     * Returns the absolute difference between this and another truth's expectation.
     */
    public getExpDifAbsFromTruth(t: Truth): number {
        return this.getExpDifAbs(t.getExpectation());
    }

    /**
     * Checks if another object is a Truth and has the same frequency and confidence.
     */
    public equals(that: unknown): boolean {
        return (
            that instanceof Truth &&
            this.getFrequency() === that.getFrequency() &&
            this.getConfidence() === that.getConfidence()
        );
    }
}

