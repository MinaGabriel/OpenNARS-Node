// ───── Imports ─────
import { Budget } from "../Budget";
import { Concept } from "../Concept";
import { Sentence } from "../Sentence";
import { Truth } from "../Truth";
import { Term } from '../Term';
import { table } from "table"; //  npm install table
import _ from 'lodash'; 
import { MathFunctions } from "../utils/MathFunctions";
import cloneDeep from "clone-deep"; 
import { TruthFunctions } from "./TruthFunctions";

export class BudgetFunctions { 
    static rankBelief(judgement: Sentence, rankTruthExpectation: boolean): number {
        // Rank based on truth expectation or confidence
        if (rankTruthExpectation) {
            return judgement.truth.getExpectation();
        } else {
            return judgement.truth.confidence.getValue();
        }
    }

    static forget(budget: Budget, forget_rate: number, RELATIVE_THRESHOLD: number): void {
        let quality = budget.quality * RELATIVE_THRESHOLD;
        const priority = budget.priority - quality;
        if (priority > 0) {
            quality += priority * Math.pow(budget.durability, 1.0 / (forget_rate * priority));
        }
        budget.priority = quality;
    }

    static activate(concept: Concept, budget: Budget): void {
        const priority = MathFunctions.or(concept.priority, budget.priority);
        const durability = MathFunctions.mean(concept.durability, budget.durability);
        concept.priority = priority;
        concept.durability = durability;
        // quality remains unchanged
    }

    static merge(base: Budget, adjuster: Budget): void {
        base.priority = adjuster.priority;
        base.durability = Math.max(base.durability, adjuster.durability);
        base.quality = Math.max(base.quality, adjuster.quality);
    }


    /**
     * Revises the budget of a task based on truth value differences from a revision.
     * Implements budget revision from Non-Axiomatic Logic (NAL).
     * 
     * Reference:
     *   - Section 6.2: Budget Functions, p. 143
     *   - Table C.3: The Truth-Value Functions of Inference Rules, p. 290
     *   - OpenNARS 3.1.0 BudgetFunctions.java, lines 72–118
     * 
     * Example:
     *   - Budget_task: <0.8, 0.9, 0.7>, Truth_task: <0.8, 0.9>
     *   - Truth_belief: <0.7, 0.85>, Truth_derived: <0.75, 0.95>
     *   - diff_task = |0.8 - 0.75| = 0.05
     *   - budget_task.priority = and(0.8, 1 - 0.05) = 0.76
     *   - budget_task.durability = and(0.9, 1 - 0.05) = 0.855
     *   - diff = 0.95 - max(0.9, 0.85) = 0.05
     *   - New Budget: <or(0.05, 0.76), Average(0.05, 0.855), truth_to_quality(<0.75, 0.95>)>
     * 
     * this revision function updates the budgets of the task, task link, and term link:

        Task Budget: Adjusts taskBudget.priority and taskBudget.durability using MathFunctions.and with 1 - diffTask.
        Task Link Budget: If budgetTasklink is provided, updates tasklinkBudget.priority and tasklinkBudget.durability using MathFunctions.and with diffTask.
        Term Link Budget: If budgetTermlink is provided, updates termlinkBudget.priority and termlinkBudget.durability using MathFunctions.and with 1 - diff_belief.
        The function returns a new Budget and the modified taskBudget, tasklinkBudget, and termlinkBudget.
     * 
     * @param budgetTask - Budget of the task to be revised
     * @param truthTask - Truth value of the task
     * @param truthBelief - Truth value of the belief
     * @param truthDerived - Truth value of the derived task
     * @param budgetTasklink - Budget of the task link (optional)
     * @param budgetTermlink - Budget of the term link (optional)
     * @param replace - If true, modifies budget_task in place; else, creates a copy
     * @param replaceTasklink - If true, modifies budget_tasklink in place; else, creates a copy
     * @param replaceTermlink - If true, modifies budget_termlink in place; else, creates a copy
     * @returns Tuple of new Budget and modified budgets (task, tasklink, termlink)
     */
    static revision(
        budgetTask: Budget,
        truthTask: Truth,
        truthBelief: Truth,
        truthDerived: Truth,
        budgetTasklink: Budget | null = null,
        budgetTermlink: Budget | null = null,
        replace: boolean = true,
        replaceTasklink: boolean = true,
        replaceTermlink: boolean = true
    ): [Budget, Budget, Budget | null, Budget | null] {
        // Deep copy if not replacing in place
        let taskBudget = replace ? budgetTask : cloneDeep(budgetTask);
        let tasklinkBudget = budgetTasklink ? (replaceTasklink ? budgetTasklink : cloneDeep(budgetTasklink)) : null;
        let termlinkBudget = budgetTermlink ? (replaceTermlink ? budgetTermlink : cloneDeep(budgetTermlink)) : null;

        // Calculate difference in expectation for task
        const diffTask = Math.abs(truthTask.getExpectation() - truthDerived.getExpectation());
        taskBudget.priority = MathFunctions.and(taskBudget.priority, 1 - diffTask);
        taskBudget.durability = MathFunctions.and(taskBudget.durability, 1 - diffTask);

        // Update task link budget if provided
        if (tasklinkBudget) {
            tasklinkBudget.priority = MathFunctions.and(taskBudget.priority, diffTask);
            tasklinkBudget.durability = MathFunctions.and(taskBudget.durability, diffTask);
        }

        // Update term link budget if provided
        if (termlinkBudget) {
            const diff_belief = Math.abs(truthBelief.getExpectation() - truthDerived.getExpectation());
            termlinkBudget.priority = MathFunctions.and(termlinkBudget.priority, 1 - diff_belief);
            termlinkBudget.durability = MathFunctions.and(termlinkBudget.durability, 1 - diff_belief);
        }

        // Compute new budget values
        const diff = truthDerived.getConfidence() - Math.max(truthTask.getConfidence(), truthBelief.getConfidence());
        const priority = MathFunctions.or(diff, taskBudget.priority);
        const durability = MathFunctions.average(diff, taskBudget.durability);
        const quality = TruthFunctions.truthToQuality(truthDerived);

        // Return new Budget and modified budgets
        return [new Budget(undefined, priority, durability, quality), taskBudget, tasklinkBudget, termlinkBudget];
    }
}

