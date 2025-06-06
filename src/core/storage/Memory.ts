import { Bag } from "./Bag";
import { Concept } from "../Concept";
import { Task } from "../Task";
import { ConceptBag } from "./ConceptBag";
import { Budget } from "../Budget";
import { Term } from "../Term";
import { Sentence } from "../Sentence";
import { Parameters } from "../Parameters";
import { NovelTaskBag } from "./NovelTaskBag";
import { TaskLink } from "../TaskLink";
import { LinkType } from "../enums/Enums";
import { TermLink } from "../TermLink";
import _, { fromPairs } from "lodash";
import { table } from "table";
import { TaskLinkBag } from "./TaskLinkBag";
import colors from "ansi-colors";
import { TermLinkBag } from "./TermLinkBag"; 
import { GlobalTaskBag } from "./GlobalTaskBag";
import { Logger } from "winston";
import cloneDeep from 'clone-deep';
import { BudgetFunctions } from "../inference/BudgetFunctions";

export class Memory {
    private data: string[][] = [];
    private _conceptsBag: ConceptBag = new ConceptBag();
    private _taskLinksBag: TaskLinkBag = new TaskLinkBag();
    private _termLinksBag: TermLinkBag = new TermLinkBag();
    private _globalTasksBag: GlobalTaskBag = new GlobalTaskBag();
    private _novelTasksBag: NovelTaskBag = new NovelTaskBag();
    public task!: Task;
    public currentWorkingConcept: Concept | null = null;
    private currentTime: number = 0; // Track cycles


    constructor() { }

    get conceptsBag(): ConceptBag {
        return this._conceptsBag;
    }
    get globalTasksBag(): GlobalTaskBag {
        return this._globalTasksBag;
    }

    public activateConcept(concept: Concept, budget: Budget): void {
        this._conceptsBag.pickOut(concept.key);
        BudgetFunctions.activate(concept, budget);
        this._conceptsBag.putBack(concept);
    }

    public workCycle(): void {
        this.processNewTasks();
        this.processConcept();
    }

    public input(task: Task): void {

        this._globalTasksBag.putIn(task);
    }

    public processNewTasks() {
        const task = this._globalTasksBag.takeOut();
        if (task) {
            if (task.isInput() || this._conceptsBag.get(task.term.name()) !== null) {
                this.immediateProcess(task);
            } else {
                const sentence: Sentence = task.sentence;
                if (sentence.isJudgement()) {
                    const expectation = sentence.truth.getExpectation();
                    if (expectation > Parameters.DEFAULT_CREATION_EXPECTATION) {
                        const putInNovel = this._novelTasksBag.putIn(task);
                        if (!putInNovel) {
                            this._globalTasksBag.putBack(task);
                        }
                    }
                }
            }
            this._globalTasksBag.putBack(task);
        }
    }

    private processConcept() {
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
            if (!concept) {
                throw new Error("Concept cannot be null");
            }
            concept.directProcess(task);
            const task_link = new TaskLink(concept, task, task.budget);
            this._taskLinksBag.putIn(task_link);
            concept.taskLinks.putIn(task_link);

            this.data.push([
                `${concept.toString()} (${sub_term.key})`,
                task.toString(),
                LinkType[task_link.type!]?.toString() ?? "",
                colors.yellow(_.isArray(task_link.index) && task_link.index.length > 0 ? JSON.stringify(task_link.index) : "")
            ]);
        });
        console.log(table(this.data, { header: { alignment: 'center', content: 'TASK LINK TABLE' } }));
        this.data = [];

        // Add term links
        const relationship: [Term, Term][] = Term.getAncestorPairs(term);
        const swapped_relationship: [Term, Term][] = _.map(relationship, ([a, b]) => [b, a] as [Term, Term]);
        _.forEach(swapped_relationship, ([source, target]) => {
            const concept_source = this.pickOrGenerateConcept(source);
            const concept_target = this.pickOrGenerateConcept(target);
            if (!concept_source || !concept_target) {
                throw new Error("Concept cannot be null");
            }

            this.activateConcept(concept_source, task.budget);
            this.activateConcept(concept_target, task.budget);

            let term_link = new TermLink(concept_target, concept_source, task.budget);
            this._termLinksBag.putIn(term_link);
            concept_target.termLinks.putIn(term_link);

            term_link = new TermLink(concept_source, concept_target, task.budget);
            this._termLinksBag.putIn(term_link);
            concept_source.termLinks.putIn(term_link);

            this.data.push([
                concept_target.toString(),
                concept_source.toString(),
                LinkType[term_link.type!]?.toString() ?? "",
                colors.yellow("-")
            ]);

            this.data.push([
                concept_source.toString(),
                concept_target.toString(),
                LinkType[term_link.type!]?.toString() ?? "",
                colors.yellow(_.isArray(term_link.index) && term_link.index.length > 0 ? JSON.stringify(term_link.index) : "")
            ]);
        });

        console.log(table(this.data, { header: { alignment: 'center', content: 'TERM LINK TABLE' } }));
        this.data = [];
    }

    public pickOrGenerateConcept(term: Term): Concept | null {
        const name = term.name();
        const oldConcept = this._conceptsBag.pickOut(name);

        const newConcept = oldConcept ? cloneDeep(oldConcept) : new Concept(term);
        this._conceptsBag.putIn(newConcept);
        return newConcept;
    }

}
