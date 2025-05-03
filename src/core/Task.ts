import { Item } from './Item';
import { Sentence } from './Sentence';
import { Judgement } from './Judgement';
import { Goal } from './Goal';
import { Quest } from './Quest';
import { Question } from './Question';
import { Budget } from './Budget';
import { Term } from './Term';
import { Truth } from './Truth';

/**
 * Task class representing a NARS task
 * Extends the base Item class
 */
class Task extends Item {
    static input_id: number = -1;
    best_solution: Sentence | null = null;
    processed: boolean = false;
    immediate_rules_applied: boolean = false;

    sentence: Sentence;
    input_id: number;
    stamp: any;
    evidential_base: any;
    term: Term;
    truth: Truth | null;

    is_judgement: boolean;
    is_goal: boolean;
    is_question: boolean;
    is_quest: boolean;
    is_query: boolean;
    is_eternal: boolean;
    is_event: boolean;
    is_external_event: boolean;
    is_operation: boolean;
    is_mental_operation: boolean;
    is_executable: boolean;

    /**
     * Create a new Task
     * @param sentence - Task sentence
     * @param budget - Task budget (optional)
     * @param input_id - Task input ID (optional)
     */
    constructor(sentence: Sentence, budget: Budget | null = null, input_id: number | null = null) {
        super(sentence.hash(), budget);
        this.sentence = sentence;
        this.input_id = input_id ?? Task.input_id;

        // Basic properties
        this.stamp = this.sentence.stamp;
        this.evidential_base = this.sentence.evidential_base;
        this.term = this.sentence.term;
        this.truth = this.sentence.truth;

        // Type checking properties
        this.is_judgement = this.sentence instanceof Judgement;
        this.is_goal = this.sentence instanceof Goal;
        this.is_question = this.sentence instanceof Question;
        this.is_quest = this.sentence instanceof Quest;
        this.is_query = this.term.has_qvar && (this.is_question || this.is_quest);
        this.is_eternal = this.sentence.is_eternal;
        this.is_event = this.sentence.is_event;
        //FIXME:Not developed yet
        this.is_external_event = false;
        this.is_operation = this.term.is_operation;
        this.is_mental_operation = this.term.is_mental_operation;
        this.is_executable = this.is_goal && this.term.is_executable;
    }

    
    /**
     * String representation of the task
     * @returns The sentence as a string
     */
    toString(): string {
        return this.sentence.toString();
    }

    
    /**
     * Update budget priority with reward
     * @param reward - Reward value
     */
    reward_budget(reward: number): void {
        // TODO: Implement budget priority update logic
    }
}

// Type aliases
type Belief = Task;
type Desire = Task;

export { Task, Belief, Desire };