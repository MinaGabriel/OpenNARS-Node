import { add } from "winston";
import { Bag } from "./bag/Bag";
import { Budget } from "./Budget";
import { Item } from "./Item";
import { Judgement } from "./Judgement";
import { Sentence } from "./Sentence";
import { Task } from "./Task";
import { TaskLink } from "./TaskLink";
import { TaskLinkBag } from "./bag/TaskLinkBag";
import { Term } from "./Term";
import { TermLink } from "./TermLink";
import { TermLinkBag } from "./bag/TermLinkBag";
import { Parameters } from "./Parameters";
import { nanoid } from 'nanoid';
import { LinkType } from "./Enums";
import _ from "lodash";
import { System } from "./Functions";
import { Identifiable } from "./interfaces/Identifiable";
import { BaseEntry, Stamp } from "./Stamp";
import cloneDeep from 'clone-deep';
class Concept extends Item implements Identifiable {

    private _term: Term;
    private _taskLinksBag: TaskLinkBag;
    private _termLinksBag: TermLinkBag;
    private _questions: Task[] = [];
    /**
     * Sentences directly made about the term, with non-future tense
     */
    private _beliefs: Task[] = [];



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
        if (task.sentence.isJudgement()) {
            this.processJudgment(task);
        } else {
            //this.processQuestion(task);
        }

        //TODO: skipped the above threshold logic I don't understand it for now.

        this.buildTaskLink(task);

    }

    private buildTaskLink(task: Task): void {
        const task_budget = task.budget;

    }


    private processJudgment(newTask: Task): void {
        System.Log.info(`Concept.processJudgment: Processing new judgment: ${newTask.sentence}`);
        const newBelief = newTask.sentence;
        // Step 1: Find matching belief with highest truth value OpenNARS 3.1.0 @concept.selectCandidate
        const oldBelief: Task | null = this.selectCandidate(newTask, this._beliefs);
        if (oldBelief) {
            System.Log.info(`Concept.processJudgment: Found candidate belief: ${oldBelief.sentence} for new belief: ${newBelief}`);
            // Step 2: If candidate exists, update the belief with the new judgment
            const newStamp = newBelief.stamp;
            const oldStamp = oldBelief.sentence.stamp;
            if (newStamp.equals(oldStamp, false, true, true)) return // No change, same belief
            if (System.Rule.revisable(newBelief, oldBelief.sentence)) {
                //Truth Revision 
                
                //Merge evidential base
                const newBase = newStamp.evidentialBase;
                const oldBase = oldStamp.evidentialBase;
                const interleaved = _.flatten(_.zip(newBase, oldBase)).filter(e => e !== undefined) as BaseEntry[];
                const maxLength = Parameters.MAXIMUM_EVIDENTIAL_BASE_LENGTH;
                
                let stamp : Stamp = cloneDeep(newStamp);




            }


        }
        Concept.addToTable(newTask, this._beliefs, Parameters.CONCEPT_BELIEFS_MAX, true);
        // Step 3: If no candidate exists, add the judgment as a new belief
    }

    static addToTable(
        newTask: Task,
        table: Task[],
        capacity: number,
        rankTruthExpectation: boolean
    ): Task | null {
        const newSentence = newTask.sentence;
        const rank1 = System.Budget.rankBelief(newSentence, rankTruthExpectation);

        for (let i = 0; i < table.length; i++) {
            const sentence2 = table[i].sentence;
            const rank2 = System.Budget.rankBelief(sentence2, rankTruthExpectation);
            if (rank1 >= rank2) {
                if (
                    newSentence.truth.equals(sentence2.truth) &&
                    newSentence.stamp.equals(sentence2.stamp, false, true, true)
                ) {
                    console.log(` ---------- Equivalent Belief: ${newSentence} == ${sentence2}`);
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

    public selectCandidate(query: Task, list: Task[]): Task | null {
        let currentBest: number = 0;
        let beliefQuality: number = 0;
        let candidate: Task | null = null;
        let rateByConfidence: boolean = true; //use confidence or expectation otherwise
        for (const task of list) {
            const Judgement = task.sentence;
            beliefQuality = System.Rule.solutionQuality(query, Judgement, rateByConfidence);
            if (beliefQuality > currentBest) {
                currentBest = beliefQuality;
                candidate = task;
            }
        }
        return candidate;
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