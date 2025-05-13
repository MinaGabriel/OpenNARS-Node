import { Bag } from "./Bag";
import { Concept } from "./Concept";
import { Task } from "./Task";
import { ConceptBag } from "./ConceptBag";
import { Budget } from "./Budget";
import { compileFunction } from "vm";
import { Term } from "./Term";
import { BudgetFunctions } from "./BudgetFunctions";
import { Sentence } from "./Sentence";
import { Parameters } from "./Parameters";
import { NovelTaskBag } from "./NovelTaskBag";
import logger from "../utils/Logger";
import { OrderedSet } from "immutable";
import { TaskLink } from "./TaskLink";
import { get } from "http";
export class Memory {
    private concepts: Bag<Concept>;
    private _new_tasks: OrderedSet<Task> = OrderedSet<Task>();
    private _novel_tasks: NovelTaskBag = new NovelTaskBag();

    constructor() {
        this.concepts = new ConceptBag();
    }

    public accept(task: Task): void {
        // Implementation here
        //TODO::WHY
        const conceptualize_budget: Budget = new Budget(undefined, task.budget.getPriority(),
            task.budget.getDurability(),
            task.sentence.getTerm().simplicity);

    }

    public activateConcept(concept: Concept, budget: Budget): void {
        this.concepts.pickOut(concept.getKey())
        //update the budget -> this is what this method do 
        BudgetFunctions.activate(concept, budget);
        this.concepts.putBack(concept); 
    }

    public workCycle(clock: number): void {
        this.processNewTasks();


    }

    public input(task: Task): void {
        this._new_tasks = this._new_tasks.add(task); 
    }


    public processNewTasks() {
        let counter: number = this._new_tasks.size;
        while (counter > 0) {
            counter--;
            const task: Task = this._new_tasks.first()!;
            this._new_tasks = this._new_tasks.remove(task); 
            if (task.isInput() || this.concepts.get(task.getTerm().getName()) !== null) { // new input or existing concept
                this.immediateProcess(task);
            } else {
                const sentence: Sentence = task.getSentence();
                if (sentence.isJudgement()) {
                    const expectation: number = sentence.getTruth().getExpectation(); // should not be null
                    if (expectation > Parameters.DEFAULT_CREATION_EXPECTATION) {
                        const putin: boolean = this._novel_tasks.putIn(task);
                    }
                }
            }
        }
    }

    private immediateProcess(task: Task) {

        const term = task.getTerm();
        
        this.getAncestorPairs(term).forEach(([ancestor, descendant]) => {
            logger.console.info(`${ancestor.getName()} --- ${descendant.getName()}`);
        });
        const subterms = term.subTerms().toArray();
        //TODO:: I am not developing index for TaskLink it is not needed 

        //FIXME:: Subterms include the task term itself
        //FIXME:: Also repeated terms are included

        for (const subterm of subterms) {
            const concept = this.getOrGenerateConcept(subterm);
            if (!concept) continue;

            // Activate the concept based on the task's budget
            this.activateConcept(concept, task.getBudget());

            // Process the task in the context of this concept
            concept.directProcess(task);
            new TaskLink(concept, task, task.getBudget());
            

        }
    }

    private getAncestorPairs(node: Term, ancestors: Term[] = [], pairs: [Term, Term][] = []): [Term, Term][] {
        // Log ancestor links *before* visiting children
        for (const ancestor of ancestors) {
            if (pairs.some(([existingAncestor, existingNode]) => existingAncestor === ancestor && existingNode === node)) {
                continue; // Skip if the pair already exists
            }
            pairs.push([ancestor, node]); // Add the ancestor-descendant pair if not already in the list
        }
    
        if (node.isAtom) return pairs; // stop recursion if node is an atom
    
        for (const child of node.components) {
            this.getAncestorPairs(child, [node, ...ancestors], pairs); // Add current node to ancestor chain
        }
    
        return pairs;
    }
    


    public getOrGenerateConcept(term: Term): Concept | null {

        //TODO::DEVELOP THE CONSTANT METHOD OpenNARS 3.1.0 MEMORY LINE 213
        //There is no hashing the term name === term key (Item Key)
        //TODO: if term is variable return 
        const key: string = term.getName();
        let concept: Concept | undefined = this.concepts.get(key);
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




