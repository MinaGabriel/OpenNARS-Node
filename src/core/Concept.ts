import { Bag } from "./Bag";
import { Budget } from "./Budget";
import { Item } from "./Item";
import { Sentence } from "./Sentence";
import { Task } from "./Task";
import { TaskLink } from "./TaskLink";
import { TaskLinkBag } from "./TaskLinkBag";
import { Term } from "./Term";
import { TermLink } from "./TermLink";
import { TermLinkBag } from "./TermLinkBag";

class Concept extends Item {
   
    private term: Term;
    private taskLinks: TaskLinkBag;
    private termLinks: TermLinkBag;
    private termLinkTemplates?: TermLink[];
    private questions: Task[] = [];
    private beliefs: Sentence[] = [];

    constructor(term: Term) {
        super(term.getName());
        this.term = term;
        this.taskLinks = new TaskLinkBag();
        this.termLinks = new TermLinkBag();
    }

    public getTerm(): Term {
        return this.term;
    }

    public directProcess(task: Task): void {
        if (task.getSentence().isJudgement()) {
            this.processJudgment(task);
        }else {
            this.processQuestion(task);
        }
    }
    private processJudgment(task: Task): void { }

    private processQuestion(task: Task): void { }


    /**
     * Conceptualizes a task in the NARS memory system
     * 
     * Process:
     * Checks if the task's concept exists in memory
     *    - If exists: Merges the new concept with existing one
     *    - If not: Creates a new concept and adds it to memory
     *  
     */
    public static conceptualize(concepts: Bag<Concept>, term: Term, budget: Budget): void {
        //TODO:: DEVELOP TEMPORAL 

        if (term.is_variable) return;
 
    }
}

export { Concept }