import { add } from "winston";
import { Bag } from "./storage/Bag";
import { Budget } from "./Budget";
import { Item } from "./Item";
import { Judgement } from "./Judgement";
import { Sentence } from "./Sentence";
import { Task } from "./Task";
import { TaskLink } from "./TaskLink";
import { TaskLinkBag } from "./storage/TaskLinkBag";
import { Term } from "./Term";
import { TermLink } from "./TermLink";
import { TermLinkBag } from "./storage/TermLinkBag";
import { Parameters } from "./Parameters";
import { nanoid } from 'nanoid';
import { LinkType, Punctuation } from "./enums/Enums";
import _ from "lodash";

import { Identifiable } from "./interface/Identifiable";
import { BaseEntry, Stamp } from "./Stamp";
import cloneDeep from 'clone-deep';
import { LogFunctions } from "./utils/LogFunctions";
import { RuleFunctions } from "./inference/RuleFunctions";
import { BudgetFunctions } from "./inference/BudgetFunctions";
import { Memory } from "./storage/Memory";
import { MemoryStore } from "./storage/MemoryStore";
import { Truth } from "./Truth";
import { TruthFunctions } from "./inference/TruthFunctions";
import { Premise } from "./enums/Types";
import { StampFunctions } from "./inference/StampFunctions";
class Concept extends Item implements Identifiable {

    private _term: Term;
    private _taskLinksBag: TaskLinkBag;
    private _termLinksBag: TermLinkBag;
    /**
     * Pending Question directly asked about the term **/
    private _questions: Task[] = [];
    private _quests: Task[] = [];
    /**
     * Sentences directly made about the term, with non-future tense
     */
    private _beliefs: Task[] = [];
    private _desires: Task[] = [];

    constructor(term: Term) {
        super(term.name());
        this._term = term;
        this._taskLinksBag = new TaskLinkBag();
        this._termLinksBag = new TermLinkBag();
    }
    name(): string {
        return this.term.name();
    }

    toString(): string { return `${this.name()}`; }

    get taskLinks(): TaskLinkBag { return this._taskLinksBag; }
    set taskLinks(links: TaskLinkBag) { this._taskLinksBag = links; }
    get termLinks(): TermLinkBag { return this._termLinksBag; }
    set termLinks(links: TermLinkBag) { this._termLinksBag = links; }
    get beliefs(): Task[] { return this._beliefs; }
    get term(): Term { return this._term; }
    public directProcess(task: Task): void {
        if (task.sentence.isJudgement()) this.processJudgment(task);
        if (task.sentence.isQuestion()) this.processQuestionOrQuest(task);

        //TODO: skipped the above threshold logic I don't understand it for now.

        this.buildTaskLink(task);

    }

    private buildTaskLink(task: Task): void {
        const task_budget = task.budget;

    }
    private processQuestionOrQuest(newTask: Task): void {
        let questionTask: Task = newTask;

        // Select the appropriate list (questions or quests) based on punctuation
        let questions: Task[] = (questionTask.sentence.punctuation === Punctuation.QUEST) ? this._quests : this._questions;

        // Remove the oldest task if we've reached the max allowed number (FIFO)
        if (questions.length >= Parameters.CONCEPT_QUESTIONS_MAX) {
            questions.shift(); // removes the first (oldest) item in-place
        }

        // Add the new task to the appropriate list
        questions.push(questionTask);

        // Select an answer based on whether it's a question (uses beliefs) or a quest (uses desires)
        const answer: Task | null = questionTask.sentence.isQuestion()
            ? this.selectCandidate(questionTask, this._beliefs)
            : this.selectCandidate(questionTask, this._desires);

            
    }

    private processJudgment(newTask: Task): void {
        LogFunctions.info(`Concept.processJudgment: Processing new judgment: ${newTask.sentence}`);
        // Step 1: Find matching belief with highest truth value OpenNARS 3.1.0 @concept.selectCandidate
        const oldBelief: Task | null = this.selectCandidate(newTask, this._beliefs);
        if (oldBelief) {
            // Step 2: If candidate exists, update the belief with the new judgment
            const newStamp = newTask.sentence.stamp;
            const oldStamp = oldBelief.sentence.stamp;
            if (newStamp.equals(oldStamp, false, true, true)) return; // No change, same belief
            if (RuleFunctions.revisable(newTask.sentence, oldBelief.sentence)) {
                const believedRevisedTask: Task = this.localRevision(newTask, oldBelief);
                //reduce priority by achieving the same belief 
                newTask.reducePriorityByAchievingLevel(oldBelief);
            }

        }

        if (newTask.budget.summary() > Parameters.BUDGET_THRESHOLD) {
            Concept.addToTable(newTask, this._beliefs, Parameters.CONCEPT_BELIEFS_MAX, true);

            //Try to solve a question if it exists
        }
    }
    public localRevision(task: Task, belief: Task): Task {
        const taskTerm = task.sentence.term;

        const budgetTask = task.budget;

        const taskSentence: Premise = task.sentence;
        const beliefSentence: Premise = belief.sentence;

        const truthTask = taskSentence.truth;
        const truthBelief = beliefSentence.truth;

        const taskStamp = taskSentence.stamp;
        const beliefStamp = beliefSentence.stamp;

        const truthDerived = TruthFunctions.revision(truthTask, truthBelief);
        const [budgetDerived, ...others] = BudgetFunctions.revision(budgetTask, truthTask, truthBelief, truthDerived);
        const stampDerived = StampFunctions.revision(taskStamp, beliefStamp);

        if (taskSentence.isJudgement()) return new Task(new Judgement(taskTerm, Punctuation.JUDGMENT, truthDerived,
            stampDerived?.tense, stampDerived), budgetDerived)

        return task;
    }

    static addToTable(newTask: Task, table: Task[], capacity: number, rankTruthExpectation: boolean): Task | null {
        const newSentence = newTask.sentence;
        const rankOne = BudgetFunctions.rankBelief(newSentence, rankTruthExpectation);

        for (let i = 0; i < table.length; i++) {
            const sentence = table[i].sentence;
            const rankTwo = BudgetFunctions.rankBelief(sentence, rankTruthExpectation);
            if (rankOne >= rankTwo) {
                if (
                    newSentence.truth.equals(sentence.truth) &&
                    newSentence.stamp.equals(sentence.stamp, false, true, true)
                ) {
                    console.log(` ---------- Equivalent Belief: ${newSentence} == ${sentence}`);
                    return null;
                }
                table.splice(i, 0, newTask); // insert at index i
                if (table.length > capacity) {
                    return table.pop()!; // remove the lowest ranked
                }
                return null;
            }
        }

        // If not inserted yet
        if (table.length < capacity) {
            table.push(newTask);
        } else if (table.length === capacity) {
            // Do nothing, too weak to be inserted
        }

        return null;
    }

    public selectCandidate(newTask: Task, list: Task[]): Task | null {
        let currentBest: number = 0;
        let beliefQuality: number = 0;
        let belief: Task | null = null;
        let rateByConfidence: boolean = true; //use confidence or expectation otherwise
        for (const task of list) {
            const currentBelief = task.sentence;
            beliefQuality = RuleFunctions.solutionQuality(task, currentBelief, rateByConfidence);
            if (beliefQuality > currentBest) {
                currentBest = beliefQuality;
                belief = task;
            }
        }
        if (belief) {

        } else {
            LogFunctions.info(`Concept.selectCandidate: No suitable belief found for query: ${newTask.sentence}`);
        }
        return belief;
    }


    /*
        currentTaskLink: Source (Concept): Concept(A), Target (Task): Task(<(/, A, <A-->B>)-->C>).
        currentTermLink: Source: Concept(A), Target: Concept((/, A, <A-->B>)).
    */
    public fire(): void {
        const currentTaskLink: TaskLink | null = this.taskLinks.takeOut();
        if (!currentTaskLink) return;

        if (currentTaskLink.type === LinkType.TRANSFORM) {
            //do something 
        } else {
            _.times(Parameters.TERMLINK_MAX_REASONED, ($) => {

                //Maximum number of tries to get a novel term link
                //if null return or if not novel try again, if novel stop looking
                for (let i = 0; i < Parameters.TERM_LINK_MAX_MATCHED; i++) {
                    // const currentTermLink: TermLink | null = this.termLinks.takeOut();
                    // if (!currentTermLink) break;

                    // const isNovel = currentTaskLink.isNovel(currentTermLink);
                    // if (!isNovel) break; //TODO: Put back the term link if not novel





                }


            });
        }
        this.taskLinks.putBack(currentTaskLink);
    }
}
export { Concept }