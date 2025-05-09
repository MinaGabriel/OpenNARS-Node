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
    //NOTE: parser will call task with null budget if noting was provided
    constructor(sentence: Sentence, budget: Budget) {
        super(sentence.toString(), budget);
        this.sentence = sentence;
        this.budget = budget?? new Budget();
    }
    public getSentence(): Sentence {
        return this.sentence;
    }

    public getContent() : Term{
        return this.sentence.getContent(); 
    }
}

export { Task };