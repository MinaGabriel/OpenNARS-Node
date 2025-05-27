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
import { LinkType } from "./LinkType";
import { TermLink } from "./TermLink";
import { or, utility } from "../utils/Utility";
import _, { clone } from 'lodash';
import { table } from "table";
import { TaskLinkBag } from "./TaskLinkBag";
import colors from "ansi-colors";
import { TermLinkBag } from "./TermLinkBag";
export class Memory {

    private data: string[][] = []

    private _conceptsBag: Bag<Concept>;
    private _taskLinksBag: TaskLinkBag = new TaskLinkBag(); //Task links for indirect processing
    private _termLinksBag: TermLinkBag = new TermLinkBag();// Term links between the term and its components and compounds

    private _newTasks: OrderedSet<Task> = OrderedSet<Task>();
    private _novelTasks: NovelTaskBag = new NovelTaskBag();

    public task!: Task; //OpenNars currentTask@Memory 
    public currentWorkingConcept!: Concept | null;  

    constructor() {
        this._conceptsBag = new ConceptBag();
    }
    get conceptsBag(): Bag<Concept> {
        return this._conceptsBag;
    }


    public activateConcept(concept: Concept, budget: Budget): void {
        this._conceptsBag.pickOut(concept.key)
        //update the budget -> this is what this method do 
        BudgetFunctions.activate(concept, budget);
        this._conceptsBag.putBack(concept);
    }

    public workCycle(): void {
        this.processNewTasks();

        this.processConcept();
        
    }

    public input(task: Task): void {
        this._newTasks = this._newTasks.add(task);
    }


    public processNewTasks() {
        let counter: number = this._newTasks.size;
        while (counter > 0) {
            counter--;
            const task: Task = this._newTasks.first()!;
            this._newTasks = this._newTasks.remove(task);
            if (task.isInput() || this._conceptsBag.get(task.term.name) !== null) { // new input or existing concept
                this.immediateProcess(task);
                utility.conceptBagTableView();
            } else {
                const sentence: Sentence = task.sentence;
                if (sentence.isJudgement()) {
                    const expectation: number = sentence.getTruth().getExpectation(); // should not be null
                    if (expectation > Parameters.DEFAULT_CREATION_EXPECTATION) {
                        const putin: boolean = this._novelTasks.putIn(task);
                    }
                }
            }
        }
    }

    private processConcept(): void {
        this.currentWorkingConcept = this._conceptsBag.takeOut();
        if (this.currentWorkingConcept !== null) {
            this._conceptsBag.putBack(this.currentWorkingConcept);
            this.currentWorkingConcept.fire();

        }
    }

    private immediateProcess(task: Task) {
        this.task = task;
        const term = task.term;
        this.data = [];
        const subterms = term.subTerms().toArray();

        // Add task links
        _.forEach(subterms, (sub_term) => {
            const concept = this.pickOrGenerateConcept(sub_term);
            if (concept === null) {
                throw new Error("Concept cannot be null");
            }
            this.activateConcept(concept, task.budget);
            concept.directProcess(task);
            const task_link = new TaskLink(concept, task, task.budget);
            this._taskLinksBag.putIn(task_link);
            concept.taskLinks.putIn(task_link);

            //TODO:: Update priority and durability of the task link

            // Add row: [row number, concept, task, link type, index]
            this.data.push([
                `${concept.toString()} (${sub_term.key})`,
                task.toString(),
                LinkType[task_link.type!]?.toString() ?? "",
                colors.yellow(_.isArray(task_link.index) && task_link.index.length > 0 ? JSON.stringify(task_link.index) : "")
            ]);
        });
        console.log(table(this.data, { header: { alignment: 'center', content: 'TASK LINK TABLE' } }));
        this.data = []; // Clear the data after logging

        //Add term links
        const relationship: [Term, Term][] = this.getAncestorPairs(term);
        const swapped_relationship: [Term, Term][] = _.map(relationship, ([a, b]) => [b, a] as [Term, Term]);
        _.forEach(swapped_relationship, ([source, target]) => {
            const concept_source = this.pickOrGenerateConcept(source);
            if (concept_source === null) {
                throw new Error("Concept cannot be null");
            }
            const concept_target = this.pickOrGenerateConcept(target);
            if (concept_source === null || concept_target === null) {
                throw new Error("Concept cannot be null");
            }

            this.activateConcept(concept_source, task.budget);
            this.activateConcept(concept_target, task.budget);

            // example link from concept A to concept <A --> B>
            let term_link = new TermLink(concept_target, concept_source, task.budget);
            this._termLinksBag.putIn(term_link);
            concept_target.termLinks.putIn(term_link);

            // example link from concept <A --> B> to concept A
            term_link = new TermLink(concept_source, concept_target, task.budget);
            this._termLinksBag.putIn(term_link);
            concept_source.termLinks.putIn(term_link);

            this.data.push([
                concept_target.toString(),
                concept_source.toString(),
                LinkType[term_link.type!]?.toString() ?? "",
                colors.yellow("-")
            ]);

            term_link = new TermLink(concept_source, concept_target, task.budget);
            this._termLinksBag.putIn(term_link);
            // Add row: [row number, concept, task, link type, index]

            this.data.push([
                concept_source.toString(),
                concept_target.toString(),
                LinkType[term_link.type!]?.toString() ?? "",
                colors.yellow(_.isArray(term_link.index) && term_link.index.length > 0 ? JSON.stringify(term_link.index) : "")
            ]);
        });

        console.log(table(this.data, { header: { alignment: 'center', content: 'TERM LINK TABLE' } }));
        this.data = []; // Clear the data after logging


    }

    private getAncestorPairs(node: Term, ancestors: Term[] = [], pairs: [Term, Term][] = []): [Term, Term][] {
        // Log ancestor links *before* visiting children
        for (const ancestor of ancestors) {
            if (pairs.some(([existingAncestor, existingNode]) =>
                existingAncestor.identical(ancestor) && existingNode.identical(node))) {
                continue;
            }
            pairs.push([ancestor, node]); // Add the ancestor-descendant pair if not already in the list
        }

        if (node.isAtom) return pairs; // stop recursion if node is an atom

        for (const child of node.components) {
            this.getAncestorPairs(child, [node, ...ancestors], pairs); // Add current node to ancestor chain
        }

        return pairs;
    }



    public pickOrGenerateConcept(term: Term): Concept | null {
        const name: string = term.name;
        let oldConcept: Concept | null = this._conceptsBag.pickOut(name);
        const newConcept: Concept = new Concept(term);

        if (oldConcept) {
            _.forEach(oldConcept.taskLinks.item_table, (taskLinkArray: TaskLink[]) => {
                _.forEach(taskLinkArray, (task: TaskLink) => {
                    newConcept.taskLinks.putIn(task);
                });
            });

            _.forEach(oldConcept.termLinks.item_table, (termLinkArray: TermLink[]) => {
                _.forEach(termLinkArray, (term: TermLink) => {
                    newConcept.termLinks.putIn(term);
                });
            });
        }

        return newConcept;
    }
}
