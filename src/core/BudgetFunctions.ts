import { mean, or } from "../utils/Utility";
import { Budget } from "./Budget";
import { Concept } from "./Concept";
import { Truth } from "./Truth";

class BudgetFunctions {


    /* ----------------------- Belief evaluation ----------------------- */
    /**
     * Determine the quality of a judgment by its truth value alone
     * <p>
     * Mainly decided by confidence, though binary judgment is also preferred
     *
     * @param t The truth value of a judgment
     * @return The quality of the judgment, according to truth value only
     */
    public static truthToQuality(truth: Truth): number {
        const exp = truth.getExpectation()
        return Math.max(exp, (1.0 - exp) * 0.75);
    }

    //MATH ::

    /* ---------------- Bag functions, on all Items ------------------- */
    /**
     * Decrease Priority after an item is used, called in Bag
     * <p>
     * After a constant time, p should become d*p. Since in this period, the
     * item is accessed c*p times, each time p-q should multiple d^(1/(c*p)).
     * The intuitive meaning of the parameter "forgetRate" is: after this number
     * of times of access, priority 1 will become d, it is a system parameter
     * adjustable in run time.
      Numerical Example:
  *
  * Let’s assume:
  * - Initial priority, p = 1.0
  * - Durability, d = 0.9 (meaning we want priority to drop by 10% over time)
  * - Forget rate, c = 100 (meaning after 100 accesses, priority should drop to 0.9)
  *
  * Calculation:
  * After 100 accesses,
  * final priority = 1.0 * d = 1.0 * 0.9 = 0.9
  *
  * To achieve this over 100 steps,
  * each access should apply a multiplier:
  *
  * multiplier = d^(1 / (c * p)) = 0.9^(1 / 100)
  *
  * Numerical value:
  * 0.9^(1/100) ≈ 0.998947
  *
  * This means:
  * - After 1 access: priority = 1.0 * 0.998947 ≈ 0.9989
  * - After 2 accesses: priority ≈ 0.9989 * 0.998947 ≈ 0.9979
  * - After 100 accesses: priority ≈ 1.0 * (0.998947)^100 ≈ 0.9
     * @param budget The previous budget value
     * @param forgetRate The budget for the new item
     * @param relativeThreshold The relative threshold of the bag
     */
    public static forget(budget: Budget, forget_rate: number, RELATIVE_THRESHOLD: number): void {
        let quality: number = budget.getQuality() * RELATIVE_THRESHOLD;
        const priority: number = budget.getPriority() - quality;
        if (priority > 0) {
            quality += priority * Math.pow(budget.getDurability(), 1.0 / (forget_rate * priority))
        }
        budget.setPriority(quality);
    }


    public static activate(concept: Concept, budget: Budget): void {
        //MATH ::

        let priority = or(concept.getPriority(), budget.getPriority()); 
        let durability = mean(concept.getDurability(), budget.getDurability());
        let quality = concept.getQuality();
        concept.setPriority(priority);
        concept.setDurability(durability);
        concept.setQuality(quality);
    }

    public static merge(base: Budget, adjuster: Budget): void {
        base.setPriority(adjuster.getPriority());
        base.setDurability(Math.max(base.getDurability(), adjuster.getDurability()));
        base.setQuality(Math.max(base.getQuality(), adjuster.getQuality()));
    }
}

export { BudgetFunctions };