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
import { nanoid } from 'nanoid';
import { LinkType } from "./LinkType";
import _ from "lodash";

class Concept extends Item {

    private _term: Term;
    private _taskLinksBag: TaskLinkBag;
    private _termLinksBag: TermLinkBag;
    private _questions: Task[] = [];
    /**
     * Sentences directly made about the term, with non-future tense
     */
    private _beliefs: Sentence[] = [];



    constructor(term: Term) {
        super(term.name);
        this._term = term;
        this._taskLinksBag = new TaskLinkBag();
        this._termLinksBag = new TermLinkBag();
    }

    toString(): string { return `<Concept ${this.term.name}>`; }

    get taskLinks(): TaskLinkBag { return this._taskLinksBag; }
    set taskLinks(links: TaskLinkBag) { this._taskLinksBag = links; }
    get termLinks(): TermLinkBag { return this._termLinksBag; }
    set termLinks(links: TermLinkBag) { this._termLinksBag = links; }


    get term(): Term { return this._term; }
    public directProcess(task: Task): void {
        if (task.sentence.isJudgement()) {
            this.processJudgment(task);
        } else {
            this.processQuestion(task);
        }

        //TODO: skipped the above threshold logic I don't understand it for now.

        this.buildTaskLink(task);

    }

    private buildTaskLink(task: Task): void {
        const task_budget = task.budget;

    }

//     public static float solutionQuality(Sentence problem, Sentence solution) {
//         if (problem == null) {
//             return solution.getTruth().getExpectation();
//         }
//         TruthValue truth = solution.getTruth();
//         if (problem.containQueryVar()) {   // "yes/no" question
//             return truth.getExpectation() / solution.getContent().getComplexity();
//         } else {                                    // "what" question or goal
//             return truth.getConfidence();
//         }
//     }
//  private Sentence evaluation(Sentence query, ArrayList<Sentence> list) {
//         if (list == null) {
//             return null;
//         }
//         float currentBest = 0;
//         float beliefQuality;
//         Sentence candidate = null;
//         for (Sentence judg : list) {
//             beliefQuality = LocalRules.solutionQuality(query, judg);
//             if (beliefQuality > currentBest) {
//                 currentBest = beliefQuality;
//                 candidate = judg;
//             }
//         }
//         return candidate;
//     }


    private processJudgment(task: Task): void {
        const judgment = task.sentence;
        let bestBelief: Sentence | null = null;

        // Step 1: Find matching belief with highest truth value OpenNARS 3.1.0 evaluation@Concept
        for (const belief of this._beliefs) {
            if (belief.term.equals(judgment.term)) {
                // Split the OpenNARS 3.1.0 code solutionQuality@LocalRules 
                if (!bestBelief || belief.getTruth().getExpectation() > bestBelief.getTruth().getExpectation()) {
                    bestBelief = belief;
                }
            }
        }
        
        // Step 2: Check if the new judgment has the exact same origin as an existing belief
        // If the current task is a judgment derived from another judgment,
        // then this is a duplicate of something already processed,
        // so reduce its priority to avoid redundant processing.

    }


    private processQuestion(task: Task): void { }

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
            _.times(Parameters.MAX_REASONED_TERM_LINK, ($) => {

                //Maximum number of tries to get a novel term link
                //if null return, if not novel try again, if novel stop looking
                for (let i = 0; i < Parameters.MAX_MATCHED_TERM_LINK; i++) {
                    const currentTermLink: TermLink | null = this.termLinks.takeOut();
                    if (!currentTermLink) break;

                    const isNovel = currentTaskLink.isNovel(currentTermLink);
                    if(!isNovel) break;


                    

                }


            });
        }
        this.taskLinks.putBack(currentTaskLink);
    }
}
export { Concept }