import { Bag } from "./Bag";
import { Concept } from "./Concept";
import { Parameters } from "./Parameters";

export class ConceptBag extends Bag<Concept> {
    // ConceptBag specific implementations

    constructor() {
        super(Parameters.CONCEPT_BAG_SIZE); 
    }
 
}