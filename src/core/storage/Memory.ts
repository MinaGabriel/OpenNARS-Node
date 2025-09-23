import { Concept } from "../Concept";
import { Task } from "../Task";
import { ConceptBag } from "./ConceptBag";
import { Budget } from "../Budget";
import { Term } from "../Term";
import { Sentence } from "../Sentence";
import { Parameters } from "../Parameters";
import { NovelTaskBag } from "./NovelTaskBag";
import { TaskLink } from "../TaskLink";
import _ from "lodash";
import { TaskLinkBag } from "./TaskLinkBag";
import { TermLinkBag } from "./TermLinkBag";
import { GlobalTaskBag } from "./GlobalTaskBag";
import { MathFunctions } from "../utils/MathFunctions";
import { LogFunctions } from "../utils/LogFunctions";
import { Question } from "../Question";
import { RuleFunctions } from "../inference/RuleFunctions";
import { TruthFunctions } from "../inference/TruthFunctions";
import { PrintFunctions } from "../utils/PrintFunctions";
import { TermLink } from "../TermLink";

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
