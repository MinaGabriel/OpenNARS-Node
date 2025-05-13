import { Item } from './Item';
import { Sentence } from './Sentence';
import { Memory } from './Memory';
import { Budget } from './Budget';
import { Term } from './Term';

/**
 * Task class representing a NARS task
 * Extends the base Item class
 */
class Task extends Item {
    sentence: Sentence;
    budget: Budget;

    private _parent_task: Task | null = null;
    public get parent_task(): Task | null {
        return this._parent_task;
    }
    public set parent_task(value: Task | null) {
        this._parent_task = value;
    }

    // is input if the task is from the input channel
    public isInput(): boolean {
        return this.parent_task == null;
    }

    //NOTE: parser will call task with null budget if noting was provided
    constructor(sentence: Sentence, budget: Budget) {
        super(sentence.toString(), budget);
        this.sentence = sentence;
        this.budget = budget ?? new Budget();
    }
    public getSentence(): Sentence {
        return this.sentence;
    }

    public getTerm(): Term {
        return this.sentence.getTerm();
    }
 
}

export { Task };