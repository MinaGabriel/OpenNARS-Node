import { Budget } from "./Budget";
import { Concept } from "./Concept";
import { Item } from "./Item";
import { Task } from "./Task";
import { Term } from "./Term";
import { LinkType } from "./enums/Enums";
import { Statement } from "./Statement";
import { Compound } from "./Compound";
import { nanoid } from "nanoid";

/**
 * Abstract Link class representing a relationship between terms/concepts/tasks.
 */
abstract class Link extends Item {
    protected _type?: LinkType;
    protected _index: number[] | null = null;
    protected terms: Term[] = [];
    _budget: Budget;

    constructor(
        public readonly source: Concept | Task,
        public readonly target: Task | Concept,
        budget: Budget,
        protected readonly copyBudget: boolean = true,
        protected readonly enableTransform: boolean = false
    ) {
        super(nanoid(8), budget);
        this._budget = budget;
        this.setType(this.enableTransform);
    }



    get type(): LinkType | undefined { return this._type; }
    set type(value: LinkType | undefined) { this._type = value; }

    get index(): number[] | null { return this._index; }
    set index(value: number[] | null) { this._index = value; }

    /**
     * Determines the type of link based on the relationship between source and target terms.
     * Sets this.type and computes the path (terms, index) from target to source if nested.
     */
    protected setType(enableTransform: boolean = false): void {
        const termSource: Term = this.source instanceof Concept ? this.source.term : this.source.sentence.term;
        const termTarget: Term = this.target instanceof Concept ? this.target.term : this.target.sentence.term;
        const nestedResult = this.isTermNested(termSource, termTarget, []);

        if (nestedResult) {
            [this.terms, this.index] = nestedResult;
        } else {
            this.terms = [];
            this.index = null;
        }
        if (nestedResult) { // source is nested in target
            if (termTarget.identical(termSource)) {
                this.type = LinkType.SELF;
            }

            if (termTarget.isStatement()) {
                const statementTarget: Statement = termTarget as Statement;

                // If source and target are identical, it's a self-link
                if (termTarget.identical(termSource)) {
                    this.type = LinkType.SELF;
                    return;
                }

                // Check for transform links: parent of parent is statement, parent is compound, and connector is product or image
                if (this.terms.length >= 3 && enableTransform) {
                    const parentParent: Term = this.terms[this.terms.length - 3];
                    const parent: Term = this.terms[this.terms.length - 2];
                    if (parentParent.isStatement() && parent.isCompound()) {
                        if ((parent as Compound).connector.is_product_or_image) {
                            this.type = LinkType.TRANSFORM;
                            return;
                        }
                    }
                }

                // Higher-order copula: check if source is subject or predicate
                if (statementTarget.copula.isHigherOrder()) {
                    if (termSource.equals(statementTarget.subject) || termSource.equals(statementTarget.predicate)) {
                        this.type = LinkType.COMPONENT_CONDITION;
                    } else {
                        this.type = LinkType.COMPONENT_STATEMENT;
                    }
                } else if (statementTarget.copula.isInheritanceOrSimilarity()) {
                    this.type = LinkType.COMPONENT_STATEMENT;
                }
            } else if (termTarget.isCompound()) {
                this.type = LinkType.COMPOUND;
            }
        } else { // source is not nested in target
            // 1. if source is statement :
            //      1.1 copula is higher order :   "==>", "<=>", "=/>", "=|>", "=
            //          1.1.1 source and target are identical --> COMPOUND_STATEMENT
            //          1.1.2 source and target are not identical --> COMPOUND_CONDITION
            //      1.2 copula is inheritance or similarity --> COMPONENT_STATEMENT
            // 2. if source is compound --> COMPOUND
            // 3. none.

            if (termSource.isStatement()) {
                const statementSource: Statement = termSource as Statement;
                if (statementSource.copula.isHigherOrder()) {
                    if (termTarget.identical(termSource)) {
                        this.type = LinkType.COMPOUND_STATEMENT;
                    } else {
                        this.type = LinkType.COMPOUND_CONDITION;
                    }
                } else if (statementSource.copula.isInheritanceOrSimilarity()) {
                    this.type = LinkType.COMPONENT_STATEMENT;
                }
            } else if (termSource.isCompound()) {
                this.type = LinkType.COMPOUND;
            }
        }
    }

    /**
     * Finds the path (terms and indices) from target to source if source is nested in target.
     * Returns [termsOnPath, indexPath] or null if not found.
     */
    protected isTermNested(source: Term, target: Term, terms: Term[] = [], path: number[] = []): [Term[], number[]] | null {
        // If target is the source, return the path and terms
        if (target.identical(source)) return [[...terms, target], path];

        const children: Term[] = Array.from(target.terms);

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            // Recursively search for the source in child
            const result = this.isTermNested(source, child, [...terms, target], [...path, i]);
            if (result) return result;
        }
        return null; // not found in any path
    }
}

export { Link };