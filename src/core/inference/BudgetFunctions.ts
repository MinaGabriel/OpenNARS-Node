// ───── Imports ─────
import { Budget } from "../Budget";
import { Concept } from "../Concept";
import { Sentence } from "../Sentence";
import { Truth } from "../Truth";
import { table } from "table"; //  npm install table
import _ from 'lodash'; 
import { MathFunctions } from "../utils/MathFunctions";
import cloneDeep from "clone-deep"; 
import { TruthFunctions } from "./TruthFunctions";

export class BudgetFunctions { 
    /**
     * Rank a belief based on either expectation or confidence.
     * Handles null truth values safely.
     */
    static rankBelief(judgement: Sentence, rankTruthExpectation: boolean): number {
        if (!judgement.truth) {
            return 0; // no truth, no ranking
        }
        if (rankTruthExpectation) {
            return judgement.truth.getExpectation();
        } else {
            return judgement.truth.getConfidence();
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
     */
    static revision(
        budgetTask: Budget,
        truthTask: Truth | null,
        truthBelief: Truth | null,
        truthDerived: Truth | null,
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

        // If no derived truth → nothing to revise
        if (!truthDerived) {
            return [taskBudget, taskBudget, tasklinkBudget, termlinkBudget];
        }

        // Safely compute expectations
        const expTask = truthTask ? truthTask.getExpectation() : truthDerived.getExpectation();
        const expBelief = truthBelief ? truthBelief.getExpectation() : truthDerived.getExpectation();
        const diffTask = Math.abs(expTask - truthDerived.getExpectation());

        // Update task budget
        taskBudget.priority = MathFunctions.and(taskBudget.priority, 1 - diffTask);
        taskBudget.durability = MathFunctions.and(taskBudget.durability, 1 - diffTask);

        // Update task link budget if provided
        if (tasklinkBudget) {
            tasklinkBudget.priority = MathFunctions.and(taskBudget.priority, diffTask);
            tasklinkBudget.durability = MathFunctions.and(taskBudget.durability, diffTask);
        }

        // Update term link budget if provided
        if (termlinkBudget) {
            const diff_belief = Math.abs(expBelief - truthDerived.getExpectation());
            termlinkBudget.priority = MathFunctions.and(termlinkBudget.priority, 1 - diff_belief);
            termlinkBudget.durability = MathFunctions.and(termlinkBudget.durability, 1 - diff_belief);
        }

        // Compute new budget values
        const confTask = truthTask ? truthTask.getConfidence() : 0;
        const confBelief = truthBelief ? truthBelief.getConfidence() : 0;
        const diff = truthDerived.getConfidence() - Math.max(confTask, confBelief);

        const priority = MathFunctions.or(diff, taskBudget.priority);
        const durability = MathFunctions.average(diff, taskBudget.durability);
        const quality = TruthFunctions.truthToQuality(truthDerived);

        return [new Budget(undefined, priority, durability, quality), taskBudget, tasklinkBudget, termlinkBudget];
    }
}
