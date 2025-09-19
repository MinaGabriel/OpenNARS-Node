
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
import { MathFunctions } from "../utils/MathFunctions";
import { log } from "console";
import { Connector } from "../Connector";
import { LogFunctions } from "../utils/LogFunctions";


interface InputAccepted {
    taskRevised: Task | null,


}

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
 

    //This is what the input function is expected to return (one or more of these)

    public input(task: Task) {

        //There is a difference between Conceptualize and Task Budget
        const ConceptualizeBudget = new Budget(undefined, task.budget.priority,
            task.budget.durability,
            task.term.simplicity //TOOBAD: Review
        )

        const concept = this.pickOrGenerateConcept(task.term, ConceptualizeBudget);

        if (task.sentence.isJudgement()) {
            concept.processJudgment(task);
        }
        if (task.sentence.isQuestion()) {
            //Dig into the atoms to see if there is a query variable
            const hasQueryVariable = _.some(task.sentence.atoms(), (atom) => { 
                return atom.hasQueryVariable();
            }); 
            hasQueryVariable ? concept.processWhQuestion(task) : concept.processYesNoQuestion(task);
        }

        //Create TermLinks and TaskLinks
        this.createTaskLink(task);
        

    }

    private createTaskLink(task: Task){
        _.forEach(task.term.subTerms().toArray(), (subTerm) => {
            const concept = this.pickOrGenerateConcept(subTerm, task.budget, "createTaskLink");
            const taskLink = new TaskLink(concept, task, task.budget);
            this._taskLinksBag.putBack(taskLink);
            concept.taskLinks.putBack(taskLink);
        });
    }
         


    public pickOrGenerateConcept(term: Term, taskBudget: Budget, caller?: string): Concept {
        const name = term.name();
        let concept = this._conceptsBag.pickOut(name);
        if (concept) { //MERGE 
            concept.priority = MathFunctions.or(concept.priority, taskBudget.priority);
            concept.durability = MathFunctions.or(concept.durability, taskBudget.durability);
            concept.quality = Math.max(concept.quality, taskBudget.quality);
        } else {
            concept = new Concept(term, taskBudget);
        }

        this._conceptsBag.putBack(concept);
        return concept;
    }


}