import { add, exceptions } from "winston";
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
import { nanoid } from "nanoid";
import { LinkType, Punctuation } from "./enums/Enums";
import _ from "lodash";
import { Identifiable } from "./interface/Identifiable";
import { BaseEntry, Stamp } from "./Stamp";
import cloneDeep from "clone-deep";
import { LogFunctions } from "./utils/LogFunctions";
import { RuleFunctions } from "./inference/RuleFunctions";
import { BudgetFunctions } from "./inference/BudgetFunctions";
import { Memory } from "./storage/Memory";
import { MemoryStore } from "./storage/MemoryStore";
import { Truth } from "./Truth";
import { TruthFunctions } from "./inference/TruthFunctions";
import { Premise } from "./enums/Types";
import { StampFunctions } from "./inference/StampFunctions";
import { Question } from "./Question";
import { Goal } from "./Goal";
import { MathFunctions } from "./utils/MathFunctions";

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

    public addQuestion(task: Task): void {
        if (this._questions.length >= Parameters.CONCEPT_GOALS_MAX) {
            this._questions.shift(); // remove the oldest question
        }
        this._questions.push(task);
    }


    private calcTaskAchievement(t1: Truth | null, t2: Truth | null): number {
        if (t1 == null) return t2!.getExpectation();
        return Math.abs(t1.getExpectation() - t2!.getExpectation());
    }

    public processJudgment(newTask: Task): void {
        const belief: Task | null = this.selectCandidate(newTask, this._beliefs);

        if (belief) {
            const newStamp = newTask.sentence.stamp;
            const oldStamp = belief.sentence.stamp;
            if (newStamp.equals(oldStamp, false, true, true)) return;
            //why do you revise the task and the belief?
            //to summarize and consolidate evidence, producing a stronger, more reliable judgment.
            //Why do you reduce task by achievement?
            // // to give chance to other tasks since this one is already achieved
            if (RuleFunctions.revisable(newTask.sentence, belief.sentence)) {
                const believedRevisedTask: Task = this.localRevision(newTask, belief);
                newTask.achievement = this.calcTaskAchievement(newTask.sentence.truth, belief.sentence.truth);
            }

        }

        if (newTask.budget.summary() > Parameters.BUDGET_THRESHOLD) {
            this.addBelief(newTask); //try to solve a question
            //Now Answer questions about this task
            const answers: Task[] = this.solveJudgement(newTask);

        }
    }

    public processYesNoQuestion(task: Task): void {
        this.addQuestion(task);
        const belief: Task | null = this.selectCandidate(task, this._beliefs);
        if (belief) {
            const answer: Sentence | null = this.trySolution(belief, task);
            if (answer) {
                LogFunctions.console.info(`Concept.processQuestion: Solved question: ${task} with answer: ${answer}`);
            }
        }


    }

    public processWhQuestion(task: Task): void {
        this.addQuestion(task);
        LogFunctions.console.info(`Concept.processWhQuestion: Added Wh- question: ${task} to concept: ${this}`);
    }

    public solveJudgement(belief: Task): Task[] {
        const answers: Task[] = []
        //Solving Yes/No questions <bird --> fly>?
        _.forEach(this._questions, (questionTask, index) => {
            const answer: Sentence | null = this.trySolution(belief, questionTask); //concept questions are tasks
            answer ?? answers.push(questionTask);            LogFunctions.console.info(`Concept.solveJudgement: Solved question: ${questionTask} with answer: ${answer}`);

        })
        //Solving Wh- questions <bird --> ?x>?


        return answers;
    }


    private trySolution(belief: Task, task: Task): Sentence | null {
        const question = task.sentence as Question;
        const answer = belief.sentence;

        if (!task.bestSolution) { task.bestSolution = answer; return answer; }

        const qualityOld = RuleFunctions.solutionQuality(task, task.bestSolution, question.term.hasQueryVariable());
        const qualityNew = RuleFunctions.solutionQuality(task, answer, question.term.hasQueryVariable());

        if (qualityNew > qualityOld) {
            task.bestSolution = answer;

            //NAL2:if the task is a question, and the belief provides an answer that is better than the current best, then the priority of the belief is increased (as a reward), while the priority of the task is decreased (since the prob-lem has been partially solved).
            // increase the priority of the belief that provided a better answer by giving it a stronger budget
            //reward the belief: 
            const strongerBudget = new Budget(
                undefined, // make a new budget
                MathFunctions.or(task.budget.priority, qualityNew), // boosted priority
                task.budget.durability,                             // inherit durability from task
                TruthFunctions.truthToQuality(answer.truth!)         // recompute quality from truth
            );
            belief.budget = strongerBudget;
            //de-prioritize the question task (the better the answer the less priority the question has)
            //p_new = min(1.0 - qualityNew, p_old)
            task.budget.priority = Math.min(1.0 - qualityNew, task.budget.priority);
            return answer;
        }
        return null;
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

        if (truthTask && truthBelief) {
            const truthDerived = TruthFunctions.revision(truthTask, truthBelief);
            const [budgetDerived, ...others] = BudgetFunctions.revision(budgetTask, truthTask, truthBelief, truthDerived);
            const stampDerived = StampFunctions.revision(taskStamp, beliefStamp);

            if (taskSentence.isJudgement()) { return new Task(new Judgement(taskTerm, Punctuation.JUDGMENT, truthDerived, stampDerived?.tense, stampDerived), budgetDerived); }
        }
        return task;
    }

    //TOOBAD: a lot of work need to be done in this check opennars 3.1.0
    private addBelief(task: Task): void { this.beliefs.push(task); }

    public selectCandidate(newTask: Task, list: Task[]): Task | null {
        let currentBest: number = 0;
        let beliefQuality: number = 0;
        let belief: Task | null = null;
        let rateByConfidence: boolean = true;

        for (const task of list) {
            const currentBelief = task.sentence;
            beliefQuality = RuleFunctions.solutionQuality(task, currentBelief, rateByConfidence);
            if (beliefQuality > currentBest) { currentBest = beliefQuality; belief = task; }
        }

        if (!belief) LogFunctions.file.warn(`Concept.selectCandidate: No suitable belief found for query: ${newTask.sentence}`);
        return belief;
    }

    public fire(): void {
        const currentTaskLink: TaskLink | null = this.taskLinks.takeOut();
        if (!currentTaskLink) return;

        if (currentTaskLink.type === LinkType.TRANSFORM) {
            // do something
        } else {
            _.times(Parameters.TERMLINK_MAX_REASONED, ($) => {
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

export { Concept };