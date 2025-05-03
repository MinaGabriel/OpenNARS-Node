import { Term, TermType } from './Term';
import { Copula } from './Copula';
import { ImmutableOrderedSet } from './ImmutableOrderedSet';

/**
 * Statement class representing a NAL statement with subject, copula, and predicate
 * @extends Term
 */
class Statement extends Term {
    subject: Term;
    copula: Copula;
    predicate: Term;
    isInput: boolean;
    isSubterm: boolean;

    /**
     * Create a new Statement
     * @param subject - The subject term
     * @param copula - The copula relating subject and predicate
     * @param predicate - The predicate term
     * @param isInput - Whether this is an input statement (default: false)
     * @param isSubterm - Whether this is a subterm of another statement (default: true)
     */
    constructor(subject: Term, copula: Copula, predicate: Term, isInput = false, isSubterm = true) {
        // Determine the word and word_sorted based on commutativity
        const isCommutative = copula.is_commutative;
        const [subjectWord, predicateWord] = isCommutative
            ? [subject, predicate].sort((a, b) => a.hashCode() - b.hashCode())
            : [subject, predicate];

        const word = `<${subjectWord.word}${copula.value}${predicateWord.word}>`;
        const word_sorted = `<${subjectWord.word_sorted}${copula.value}${predicateWord.word_sorted}>`;

        // Call the Term constructor
        super({ word, word_sorted, term_type: TermType.STATEMENT });

        // Initialize properties
        this.subject = subject;
        this.copula = copula;
        this.predicate = predicate;
        this.isInput = isInput;
        this.isSubterm = isSubterm;

        // Create an ordered set of components
        this.add_compound(new ImmutableOrderedSet(subject.sub_terms().toArray(),  predicate.sub_terms().toArray()));

        // Update complexity and other properties
        this.complexity += this.subject.complexity + this.predicate.complexity;
        this.is_higher_order = this.copula.is_higher_order;
        this.is_operation = this.predicate.is_operation;
    }

    /**
     * String representation of the statement
     * @returns A string representation of the statement
     */
    toString(): string {
        return this.word;
    }

    /**
     * Debug representation of the statement
     * @returns A formatted string representation of the statement
     */
    repr(): string {
        return `<Statement: ${this.word}>`;
    }
}

export { Statement };