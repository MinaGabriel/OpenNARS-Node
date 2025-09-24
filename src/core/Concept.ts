import _ from "lodash";

import { Budget } from "./nalCorePrimitives";
import { BudgetFunctions } from "./RuleFunctions";
import { Identifiable, LinkType, Punctuation } from "./Symbols";
import { Item } from "./nalCorePrimitives";
import { Judgement } from "./nalCorePrimitives";
import { LogFunctions } from "./LogFunctions";
import { Parameters } from "./Symbols";
import { RuleFunctions } from "./RuleFunctions"; 
import { StampFunctions } from "./RuleFunctions";
import { Task } from "./nalCorePrimitives"; 
import { TaskLinkBag, TermLinkBag } from "./Bag";
import { Term } from "./nalCorePrimitives";
import { Truth } from "./nalCorePrimitives";
import { TruthFunctions } from "./RuleFunctions";


/**
 * Concept represents a term in memory (like `<bird --> animal>`). 
 * It manages beliefs, questions, and links to tasks/terms. 
 * 
 * Responsibilities:
 * - Store and update beliefs (judgements).
 * - Store questions and try to answer them.
 * - Perform local revision when new evidence arrives.
 * 
 * Example:
 * - New judgment `<bird --> fly>.` added → revise with old belief.
 * - Question `<bird --> ?x>?` stored → answered if a belief like `<bird --> fly>.` exists.
 */
class Concept extends Item implements Identifiable {
    private _term: Term;
    private _taskLinksBag: TaskLinkBag;
    private _termLinksBag: TermLinkBag;
    private _questions: Task[] = [];
    private _quests: Task[] = [];
    private _beliefs: Task[] = [];
    private _desires: Task[] = [];

    constructor(term: Term, budget?: Budget) {
        super(term.name(), budget);
        this._term = term;
        this._taskLinksBag = new TaskLinkBag();
        this._termLinksBag = new TermLinkBag();
    }

    name(): string { return this.term.name(); }
    toString(): string { return `${this.name()}`; }

    get taskLinks(): TaskLinkBag { return this._taskLinksBag; }
    set taskLinks(links: TaskLinkBag) { this._taskLinksBag = links; }
    get termLinks(): TermLinkBag { return this._termLinksBag; }
    set termLinks(links: TermLinkBag) { this._termLinksBag = links; }
    get beliefs(): Task[] { return this._beliefs; }
    get term(): Term { return this._term; }
    get questions(): Task[] { return this._questions; }
    get quests(): Task[] { return this._quests; }
    get desires(): Task[] { return this._desires; }

    /** Add a question to this concept (FIFO capped by CONCEPT_GOALS_MAX). */
    public addQuestion(task: Task): void {
        if (this._questions.length >= Parameters.CONCEPT_GOALS_MAX) this._questions.shift();
        this._questions.push(task);
    }

    /** Expectation difference used as "achievement" measure. */
    private calcTaskAchievement(t1: Truth | null, t2: Truth | null): number {
        if (t1 == null) return t2!.getExpectation();
        return Math.abs(t1.getExpectation() - t2!.getExpectation());
    }

    /** Process a new judgment, possibly revising old beliefs. */
    public processJudgment(newTask: Task): void {
        const belief: Task | null = this.selectCandidate(newTask, this._beliefs);
        if (belief) {
            const newStamp = newTask.sentence.stamp, oldStamp = belief.sentence.stamp;
            if (newStamp.equals(oldStamp, false, true, true)) return;
            if (RuleFunctions.revisable(newTask.sentence, belief.sentence)) {
                this.localRevision(newTask, belief);
                newTask.achievement = this.calcTaskAchievement(newTask.sentence.truth, belief.sentence.truth);
            }
        }
        if (newTask.budget.summary() > Parameters.BUDGET_THRESHOLD) this.addBelief(newTask);
    }

    private addBelief(task: Task): void { this._beliefs.push(task); }

    /** Pick the best matching belief based on solutionQuality. */
    public selectCandidate(newTask: Task, list: Task[]): Task | null {
        let currentBest = 0, belief: Task | null = null;
        for (const task of list) {
            const beliefQuality = RuleFunctions.solutionQuality(task, task.sentence, true);
            if (beliefQuality > currentBest) { currentBest = beliefQuality; belief = task; }
        }
        if (!belief) LogFunctions.file.warn(`Concept.selectCandidate: No suitable belief for query: ${newTask.sentence}`);
        return belief;
    }

    /** Local belief revision, merging two judgments into a stronger one. */
    public localRevision(task: Task, belief: Task): Task {
        const truthTask = task.sentence.truth, truthBelief = belief.sentence.truth;
        if (truthTask && truthBelief) {
            const truthDerived = TruthFunctions.revision(truthTask, truthBelief);
            const [budgetDerived] = BudgetFunctions.revision(task.budget, truthTask, truthBelief, truthDerived);
            const stampDerived = StampFunctions.revision(task.sentence.stamp, belief.sentence.stamp);
            if (task.sentence.isJudgement()) {
                return new Task(new Judgement(task.sentence.term, Punctuation.JUDGMENT, truthDerived, stampDerived?.tense, stampDerived), budgetDerived);
            }
        }
        return task;
    }

}

export { Concept };
