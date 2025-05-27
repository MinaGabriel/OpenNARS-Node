import { Term } from './Term';
import { Copula } from './Copula';
import { ImmutableOrderedSet } from './ImmutableOrderedSet';
import { TermType } from './TermType';
import logger from '../utils/Logger';

/**
 * Statement class representing a NAL statement with subject, copula, and predicate
 * @extends Term
 */
class Statement extends Term {
    subject: Term;
    copula: Copula;
    predicate: Term;
 

    constructor(subject: Term, copula: Copula, predicate: Term, type: TermType) {
        // Determine the word and word_sorted based on commutativity 

        const new_term= `<${subject}${copula}${predicate}>`;

        // Call the Term constructor
        super(new_term,type);

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

