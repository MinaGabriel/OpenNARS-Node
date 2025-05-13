import { add } from "winston";
import { Bag } from "./Bag";
import { Budget } from "./Budget";
import { Item } from "./Item";
import { Judgement } from "./Judgement";
import { Sentence } from "./Sentence";
import { Task } from "./Task";
import { TaskLink } from "./TaskLink";
import { TaskLinkBag } from "./TaskLinkBag";
import { Term } from "./Term";
import { TermLink } from "./TermLink";
import { TermLinkBag } from "./TermLinkBag";
import { Parameters } from "./Parameters";

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
        } else {
            this.processQuestion(task);
        }

        //TODO: skipped the above threshold logic I don't understand it for now.

        this.buildTaskLink(task);

    }

    private buildTaskLink(task: Task): void {
        const task_budget = task.getBudget(); 
        
    }


    private addToTable(new_sentence: Sentence, table: Sentence[], capacity: number): void {
        //TODO:: I skipped all the logic in this too
        table.push(new_sentence);
    }


    private processJudgment(task: Task): void {
        let judgment: Sentence = task.getSentence();
        //TODO:: develop the old belief logic I am jumping to add to belief table
        this.addToTable(judgment, this.beliefs, Parameters.MAXIMUM_BELIEF_LENGTH);

    }

    public toString(): string {
        return `Concept ${this.term.getName()}`;
    }

    private processQuestion(task: Task): void { }


}

export { Concept }