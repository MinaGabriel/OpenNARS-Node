import { Bag } from "./Bag";
import { Concept } from "./Concept";
import { Task } from "./Task";
import { ConceptBag } from "./ConceptBag";
import { Budget } from "./Budget";
import { compileFunction } from "vm";
import { Term } from "./Term";
import { BudgetFunctions } from "./BudgetFunctions";

export class Memory {
    private concepts: Bag<Concept>;

    constructor() {
        this.concepts = new ConceptBag();
    }

    public accept(task: Task): void {
        // Implementation here

        //TODO::WHY
        const conceptualize_budget: Budget = new Budget(undefined, task.budget.getPriority(),
            task.budget.getDurability(),
            task.sentence.getContent().simplicity);

    }

    public activateConcept(concept: Concept, budget: Budget): void {
        this.concepts.pickOut(concept.getKey())
        //update the budget -> this is what this method do 
        BudgetFunctions.activate(concept, budget);
        this.concepts.putBack(concept);
    }



    private immediateProcess(task: Task) {
        const current_term = task.getContent();
        const current_concept = this.getConcept(current_term);
        if (current_concept != null) {
            //update it Budget from the task it is belonging to
            this.activateConcept(current_concept, task.getBudget());
            current_concept.directProcess(task);

        }
    }

    public getConcept(term: Term): Concept | null {

        //TODO::DEVELOP THE CONSTANT METHOD OpenNARS 3.1.0 MEMORY LINE 213

        const n: string = term.getName();
        let concept: Concept | undefined = this.concepts.get(n);
        if (concept == undefined) {
            // It will take the default budget from Item 
            concept = new Concept(term); // the only place to make a new concept (legendary comment)
            let created: boolean = this.concepts.putIn(concept);
            if (created == undefined) {
                return null
            }

        }
        return concept;

    }
}



