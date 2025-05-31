import { OrderedSet } from "immutable";
import { Connector } from "./Connector";
import { ConnectorType } from "./Enums";
import { Term } from "./Term";
import { TermType } from "./Enums";
import { ImmutableOrderedSet } from "./ImmutableOrderedSet";


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
        switch (connector.type) {
            case ConnectorType.EXTENSIONAL_SET:
                return `{${terms.map(term => term.toString()).join(', ')}}`;

            case ConnectorType.INTENSIONAL_SET:
                return `[${terms.map(term => term.toString()).join(', ')}]`;

            default:
                return `(${connector.type.toString()}, ${terms.map(term => term.toString()).join(', ')})`;
        }
    }


}

export { Compound };