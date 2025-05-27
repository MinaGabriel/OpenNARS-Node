import { Budget } from "./Budget";
import { Truth } from "./Truth";


export class BudgetFunctions {

    public static truthToQuality(truth: Truth): number {
        const exp = truth.getExpectation()
        return Math.max(exp, (1.0 - exp) * 0.75);
    }
    public static forget(budget: Budget, forget_rate: number, RELATIVE_THRESHOLD: number): void {
        let quality: number = budget.quality * RELATIVE_THRESHOLD;
        const priority: number = budget.priority - quality;
        if (priority > 0) {
            quality += priority * Math.pow(budget.durability, 1.0 / (forget_rate * priority))
        }
        budget.priority = quality;
    }
    public static rankBelief(judgment: Sentence): number { 
        const confidence : number = judgment.getTruth().getConfidence();
        const originality : number = 1.0 / (judgment.getStamp().length() + 1);
        return or(confidence, originality);
    }

    public static activate(concept: Concept, budget: Budget): void {
        //MATH ::

        let priority = or(concept.priority, budget.priority); 
        let durability = mean(concept.durability, budget.durability);
        let quality = concept.quality;
        concept.priority = priority;
        concept.durability = durability;
        concept.quality = quality;
    }

    public static merge(base: Budget, adjuster: Budget): void {
        base.priority = adjuster.priority;
        base.durability = Math.max(base.durability, adjuster.durability);
        base.quality = Math.max(base.quality, adjuster.quality);
    }

}



export class System {
    static Budget = BudgetFunctions;
}