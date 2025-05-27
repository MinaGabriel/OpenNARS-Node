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
    private _sentence: Sentence;
    protected _budget: Budget;

    private _parent_task: Task | null = null;

    toString(): string { return `<Task ${this._sentence}>`; }
    get sentence(): Sentence { return this._sentence; }
    get term(): Term { return this._sentence.term; }
    get parent_task(): Task | null { return this._parent_task; }
    
    set parent_task(value: Task | null) { this._parent_task = value; }

    // is input if the task is from the input channel
    public isInput(): boolean {
        return this.parent_task == null;
    }

    //NOTE: parser will call task with null budget if noting was provided
    constructor(sentence: Sentence, budget: Budget) {
        super(sentence.toString(), budget);
        this._sentence = sentence;
        this._budget = budget ?? new Budget();
    }

}

export { Task };