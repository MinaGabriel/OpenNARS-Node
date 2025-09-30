import _ from "lodash";
import { Concept } from "./Concept";
import { Task } from "./nalCorePrimitives";
import { Budget } from "./nalCorePrimitives";
import { Term } from "./nalCorePrimitives";
import { Sentence } from "./nalCorePrimitives";
import { TaskLink } from "./Link";
import { TermLink } from "./Link";
import { Question } from "./nalCorePrimitives";
import { ConceptBag, NovelTaskBag, TaskLinkBag, TermLinkBag, GlobalTaskBag } from "./Bag";
import { MathFunctions } from "./RuleFunctions";
import { PrintFunctions } from "./LogFunctions";
import { RuleFunctions, TruthFunctions } from "./RuleFunctions";
// src/core/MemoryStore.ts
import { createStore } from 'zustand/vanilla';
import { Reasoner } from './Reasoner';
import { NarseseChannel } from './NarseseChannel';
import { LLMs } from "./LLMs";
import { B } from "vitest/dist/chunks/worker.d.1GmBbd7G";
import { BM25Engine } from "./BM25Engine";
import { VectorDB } from "./VectorDB";
// This file defines the MemoryStore, which is a Zustand store for managing the memory, time, reasoner, engine, and channel in the NARS system.

/**
 * Memory manages concepts, tasks, and inference cycle.
 * - Input new tasks (judgments/questions).
 * - Handle Yes/No and Wh-questions.
 * - Try to find solutions by unifying tasks with beliefs.
 */
export class Memory {
    private _conceptsBag: ConceptBag = new ConceptBag();
    private _taskLinksBag: TaskLinkBag = new TaskLinkBag();
    private _termLinksBag: TermLinkBag = new TermLinkBag();
    private _globalTasksBag: GlobalTaskBag = new GlobalTaskBag();
    private _novelTasksBag: NovelTaskBag = new NovelTaskBag();
    public task!: Task;
    public currentWorkingConcept: Concept | null = null;
    private currentTime = 0; // cycles

    get conceptsBag(): ConceptBag { return this._conceptsBag; }
    get globalTasksBag(): GlobalTaskBag { return this._globalTasksBag; }

    /** Insert a new task into memory, conceptualize and process. */
    /** Insert a new task into memory, conceptualize and process. */
    public input(task: Task): { answers: Sentence[] } {
        const ConceptualizeBudget = new Budget(undefined, task.budget.priority, task.budget.durability, task.term.simplicity);
        const concept = this.pickOrGenerateConcept(task.term, ConceptualizeBudget);

        let answers: Sentence[] = [];

        if (task.sentence.isJudgement()) { concept.processJudgment(task); }
        if (task.sentence.isQuestion()) {
            const hasQueryVariable = _.some(task.sentence.atoms(), atom => atom.hasQueryVariable());
            answers = hasQueryVariable ? this.processWhQuestion(task, concept) : this.processYesNoQuestion(task, concept);
        }

        this.createTaskLinks(task);
        this.createTermLinks(task);

        return { answers };
    }

    /** Process a Yes/No question (like `<bird --> fly>?`). */
    public processYesNoQuestion(query: Task, concept: Concept): Sentence[] {
        const answers: Sentence[] = [];
        concept.addQuestion(query);
        const belief: Task | null = concept.selectCandidate(query, concept.beliefs);
        if (belief) {
            const answer: Sentence | null = this.trySolution(query, belief);
            if (answer) answers.push(answer);
        }
        PrintFunctions.printAnswers(answers);
        return answers;
    }

    /** Process a Wh-question (like `<bird --> ?x>?`). */
    public processWhQuestion(query: Task, concept: Concept): Sentence[] {
        const answers: Sentence[] = [];
        concept.addQuestion(query);

        _.forEachRight(query.term.subTerms().toArray(), subTerm => {
            if (subTerm.hasQueryVariable()) return;
            const subTermConcept = this._conceptsBag.get(subTerm.name()); if (!subTermConcept) return;

            _.forEach(subTermConcept.taskLinks.toArray(), taskLink => {
                const taskLinkConcept = this._conceptsBag.get(taskLink.task.term.name()); if (!taskLinkConcept) return;
                const result = query.term.unifyWith(taskLinkConcept.term);
                if (result === null || result.substitutionMap.size === 0) return;

                _.forEach(taskLinkConcept.beliefs, belief => {
                    const answer = this.trySolution(query, belief);
                    if (answer) answers.push(answer);
                });
            });
        });
        PrintFunctions.printAnswers(answers);
        return answers;
    }

    /** Try to solve a question with a belief, reward if better. */
    public trySolution(query: Task, belief: Task): Sentence | null {
        const question = query.sentence as Question, answer = belief.sentence;
        if (!query.bestSolution) { query.bestSolution = answer; return answer; }
        const qualityOld = RuleFunctions.solutionQuality(query, query.bestSolution, question.term.hasQueryVariable());
        const qualityNew = RuleFunctions.solutionQuality(query, answer, question.term.hasQueryVariable());
        if (qualityNew > qualityOld) {
            query.bestSolution = answer;
            belief.budget = new Budget(undefined, MathFunctions.or(query.budget.priority, qualityNew), query.budget.durability, TruthFunctions.truthToQuality(answer.truth!));
            query.budget.priority = Math.min(1.0 - qualityNew, query.budget.priority); // lower priority once solved
            return answer;
        }
        return null;
    }

    /** Create task links for subterms of the input task. */
    private createTaskLinks(task: Task) {
        _.forEach(task.term.subTerms().toArray(), subTerm => {
            const concept = this.pickOrGenerateConcept(subTerm, task.budget, "createTaskLink");
            const taskLink = new TaskLink(concept, task, task.budget);
            this._taskLinksBag.putIn(taskLink);
            concept.taskLinks.putBack(taskLink);
        });
    }

    private createTermLinks(task: Task) {
        const relationships: [Term, Term][] = Term.getAncestorPairs(task.term);
        const swappedRelationships: [Term, Term][] = _.map(relationships, ([a, b]) => [b, a]);
        _.forEach(swappedRelationships, ([source, target]) => {
            const conceptSource = this.pickOrGenerateConcept(source, task.budget);
            const conceptTarget = this.pickOrGenerateConcept(target, task.budget);

            // target -> source
            let termLink = new TermLink(conceptTarget, conceptSource, task.budget);
            this._termLinksBag.putIn(termLink);
            conceptTarget.termLinks.putBack(termLink);

            // source -> target
            termLink = new TermLink(conceptSource, conceptTarget, task.budget);
            this._termLinksBag.putIn(termLink);
            conceptSource.termLinks.putBack(termLink);
        });


    }

    /** Retrieve or generate a concept for a term. */
    public pickOrGenerateConcept(term: Term, taskBudget: Budget, caller?: string): Concept {
        const name = term.name(); let concept = this._conceptsBag.pickOut(name);
        if (concept) {
            concept.priority = MathFunctions.or(concept.priority, taskBudget.priority);
            concept.durability = MathFunctions.or(concept.durability, taskBudget.durability);
            concept.quality = Math.max(concept.quality, taskBudget.quality);
        } else concept = new Concept(term, taskBudget);
        this._conceptsBag.putBack(concept); return concept;
    }
}

export class Time {
    private _startTime: number;
    private _narsClock: number;

    constructor() {
        this._startTime = Date.now();
        this._narsClock = 0;
    }

    /** Real time since boot in ms */
    public now(): number {
        return Date.now() - this._startTime;
    }

    /** Absolute system time in ms */
    public nowAbsolute(): number {
        return Date.now();
    }

    /** Logical time (number of cycles since boot) */
    public narsClock(): number {
        return this._narsClock;
    }

    /** Advance the logical clock by 1 */
    public tick(): void {
        this._narsClock++;
    }

    /** Reset everything */
    public reset(): void {
        this._startTime = Date.now();
        this._narsClock = 0;
    }
}


let currentStampSerial = -1; // Serial number for the current stamp, initialized to -1
export interface MemoryStore {
    time: Time;
    memory: Memory;
    reasoner: Reasoner;
    channel: NarseseChannel;
    llms: LLMs;
    bm25: BM25Engine;
    vectorDB: VectorDB;
    getNextStampSerial: () => number; // Serial number for the current stamp
    resetAll: () => void;
    
}

export const MemoryStore = createStore<MemoryStore>((set) => ({
    time: new Time(),
    memory: new Memory(),
    channel: new NarseseChannel(),
    llms: new LLMs(),
    bm25: new BM25Engine(),
    vectorDB: new VectorDB(),
    reasoner: undefined as unknown as Reasoner, // placeholder, set after
    getNextStampSerial: () => {
        currentStampSerial += 1;
        return currentStampSerial;
    },
    
    
    resetAll: () =>
        set({
            time: new Time(),
            memory: new Memory(),
            channel: new NarseseChannel(),
            reasoner: undefined as unknown as Reasoner,
        }),
}));

