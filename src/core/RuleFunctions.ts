// ───── Imports ─────
import { Budget, Sentence } from "./nalCorePrimitives";
import { Task } from "./nalCorePrimitives";
import { Parameters } from "./Symbols";
import { Stamp, BaseEntry } from "./nalCorePrimitives";
import { TemporalTypes } from "./Symbols";

import { Truth } from "./nalCorePrimitives";

import cloneDeep from "clone-deep";
import _ from "lodash";

import { Concept } from "./Concept"; 
import { MemoryStore } from "./Memory";


// ───────────────────────────────────────────────────────────────────────────────
// RuleFunctions
// ───────────────────────────────────────────────────────────────────────────────

export class RuleFunctions {
  static revisable(sentenceOne: Sentence, sentenceTwo: Sentence): boolean {
    if (!sentenceOne.stamp.isEternal() && !sentenceTwo.stamp.isEternal()) {
      if (
        Math.abs(
          sentenceOne.stamp.occurrenceTime - sentenceTwo.stamp.occurrenceTime
        ) > Parameters.REVISION_MAX_OCCURRENCE_DISTANCE
      ) {
        return false;
      }
    }
    if (!sentenceOne.isRevisable()) return false;
    if (
      sentenceOne.term.temporalOrder !== sentenceTwo.term.temporalOrder &&
      sentenceOne.term.temporalOrder !== TemporalTypes.ORDER_NONE &&
      sentenceTwo.term.temporalOrder !== TemporalTypes.ORDER_NONE
    ) {
      return false;
    }
    if (Stamp.baseOverlap(sentenceOne.stamp, sentenceTwo.stamp)) return false;
    return true;
  }

  /**
   * Computes the quality of a solution (task) as an answer to a problem (task).
   * Implements answer evaluation from Non-Axiomatic Logic (NAL).
   *
   * Reference:
   *   - Section 6.1: Inference Rules, p. 139
   *   - Section 7.3: Temporal Inference, p. 192
   *   - Table C.3: The Truth-Value Functions of Inference Rules, p. 290
   *
   * @param problem - Task representing the belief or question
   * @param solution - Sentence representing the candidate answer (task)
   * @param rateOfConfidence - If true, returns confidence; else, expectation adjusted by complexity
   * @returns Quality score (confidence or complexity-adjusted expectation)
   */
  // TEMPORAL
  static solutionQuality(
    problem: Task,
    solution: Sentence,
    rateOfConfidence: boolean
  ): number {
    if (
      problem.sentence.punctuation !== solution.punctuation &&
      solution.term.hasQueryVariable()
    )
      return 0.0;

    if (!solution.truth) return 0.0;

    const complexity = solution.term.complexity;
    const rTermComplexityUnit = Parameters.COMPLEXITY_UNIT;
    return rateOfConfidence
      ? Number(solution.truth.confidence)
      : solution.truth.getExpectation() /
          Math.sqrt(Math.sqrt(Math.sqrt(complexity * rTermComplexityUnit)));
  }
}


// ───────────────────────────────────────────────────────────────────────────────
// BudgetFunctions
// ───────────────────────────────────────────────────────────────────────────────

export class BudgetFunctions {
  /**
   * Rank a belief based on either expectation or confidence.
   * Handles null truth values safely.
   */
  static rankBelief(
    judgement: Sentence,
    rankTruthExpectation: boolean
  ): number {
    if (!judgement.truth) {
      return 0; // no truth, no ranking
    }
    if (rankTruthExpectation) {
      return judgement.truth.getExpectation();
    } else {
      return judgement.truth.getConfidence();
    }
  }

  static distributeAmongLinks(budget: Budget, numberOfLinks: number): Budget {
    const priority = budget.priority / Math.sqrt(numberOfLinks);
    const durability =
      budget.durability > 1.0
        ? budget.durability - Parameters.TRUTH_EPSILON
        : budget.durability;
    const quality = budget.quality > 1.0 ? 1.0 : budget.quality;
    return new Budget(undefined, priority, durability, quality);
  }

  static forget(budget: Budget, forgetRate: number, RELATIVE_THRESHOLD: number): void {
    /**
     * Ref: The Conceptual Design of OpenNARS 3.1.0
     * Ref: OpenNARS 3.1.0 BudgetFunctions.java line 176~196
     *
     * Decrease Priority after an item is used, called in Bag.
     * After a constant time, p should become d * p.
     * Since in this period, the item is accessed c * p times,
     * each time (p - q) should be multiplied by d^(1 / (c * p)).
     *
     * forgetRate = Config.cycles_forget
     * Q = Config.quality_min
     */

    const Q = 0.3; // quality_min, should be parameterized
    const C = forgetRate; // cycles_forget

    const p = budget.priority;
    const q = budget.quality * Q;
    const d = budget.durability;

    // Guard: if (p - q) is too small, skip update
    const diff = p - q;
    if (Math.abs(diff) < RELATIVE_THRESHOLD) {
      return;
    }

    // Decay formula
    budget.priority = q + diff * Math.pow(d, 1.0 / (C * Math.abs(diff)));
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
    const taskBudget = replace ? budgetTask : cloneDeep(budgetTask);
    const tasklinkBudget = budgetTasklink
      ? replaceTasklink
        ? budgetTasklink
        : cloneDeep(budgetTasklink)
      : null;
    const termlinkBudget = budgetTermlink
      ? replaceTermlink
        ? budgetTermlink
        : cloneDeep(budgetTermlink)
      : null;

    // If no derived truth → nothing to revise
    if (!truthDerived) {
      return [taskBudget, taskBudget, tasklinkBudget, termlinkBudget];
    }

    // Safely compute expectations
    const expDerived = truthDerived.getExpectation();
    const expTask = truthTask ? truthTask.getExpectation() : expDerived;
    const expBelief = truthBelief ? truthBelief.getExpectation() : expDerived;
    const diffTask = Math.abs(expTask - expDerived);

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
      const diff_belief = Math.abs(expBelief - expDerived);
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

    return [
      new Budget(undefined, priority, durability, quality),
      taskBudget,
      tasklinkBudget,
      termlinkBudget,
    ];
  }
}


// ───────────────────────────────────────────────────────────────────────────────
// StampFunctions
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Utility functions for stamp manipulation in Non-Axiomatic Reasoning System (NARS).
 * Implements stamp operations from Non-Axiomatic Logic (NAL).
 */
export class StampFunctions {
  /**
   * Merges two stamps, interleaving evidential bases and updating occurrence time.
   * Implements stamp merging from Non-Axiomatic Logic (NAL).
   *
   * Reference:
   *   - Section 7.3: Temporal Inference, p. 192
   *   - Section 4.1: Belief Revision, pp. 45–50
   *   - PyNARS Stamp_merge (pynars.NAL.Functions.StampFunctions)
   *
   * Example:
   *   - stamp1: { tOccurrence: 100, evidentialBase: [(1,1), (2,2)], isEternal: false, creationTime: 50 }
   *   - stamp2: { tOccurrence: 150, evidentialBase: [(3,3), (4,4)], isEternal: false, creationTime: 60 }
   *   - orderMark: Connector.SequentialEvents, reverseOrder: false, tBias: 0
   *   - Result: { tOccurrence: 150 + Config.temporalDuration, evidentialBase: [(1,1), (3,3), (2,2), (4,4)].slice(0, maxLength), creationTime: currentTime, isEternal: false }
   *
   * @param stampOne - First stamp to merge (new belief)
   * @param stampTwo - Second stamp to merge (old belief)
   * @param orderMark - Temporal connector or copula (optional)
   * @param reverseOrder - If true, reverses the temporal interval
   * @param tBias - Time bias to adjust occurrence time
   * @returns Merged stamp
   */
  static revision(
    stampOne: Stamp | null,
    stampTwo: Stamp | null,
    orderMark: string | null = null,
    reverseOrder: boolean = false,
    tBias: number = 0
  ): Stamp | null {
    if (!stampOne || !stampTwo) return null;
    const stamp: Stamp = cloneDeep(stampOne);

    // Interleave evidential bases
    const newBase = stampOne.evidentialBase;
    const oldBase = stampTwo.evidentialBase;
    const interleaved = _.flatten(_.zip(newBase, oldBase)).filter(
      (e): e is BaseEntry => !!e
    );
    stamp.evidentialBase = interleaved.slice(
      0,
      Parameters.MAXIMUM_EVIDENTIAL_BASE_LENGTH
    );

    // Update creation time
    stamp.creationTime = MemoryStore.getState().time.narsClock();

    // Update occurrence time
    if (!stampOne.isEternal() && !stampTwo.isEternal()) {
      stamp.occurrenceTime = Math.max(
        stampOne.occurrenceTime,
        stampTwo.occurrenceTime
      );
    }
    if (!stampOne.isEternal()) {
      const intervalMap: Record<string, number> = {
        "&/": Parameters.DURATION,
        "=/>": Parameters.DURATION,
        "</>": Parameters.DURATION,
        "=\\>": -Parameters.DURATION,
      };
      let interval = orderMark ? intervalMap[orderMark] || 0 : 0;
      if (reverseOrder) interval = -interval;
      stamp.occurrenceTime += interval + tBias;
    }
    return stamp;
  }
}


// ───────────────────────────────────────────────────────────────────────────────
// TruthFunctions
// ───────────────────────────────────────────────────────────────────────────────

export class TruthFunctions {
  /**
   * Converts confidence to total evidence weight.
   * Implements the confidence-to-weight conversion from Non-Axiomatic Logic (NAL).
   *
   * Reference:
   *   - Table C.1: The Relations Among Uncertainty Measurements, p. 289
   *     - Formula: w = c / (1 - c), where w is the total evidence weight and c is confidence
   *   - Section 3.3: Truth Value, p. 31
   *
   * @param confidence - Confidence value in [0, 1)
   * @returns Total evidence weight
   */
  static c2w = (confidence: number): number => {
    return confidence / (1 - confidence);
  };

  /**
   * Converts total evidence weight to confidence.
   * Implements the weight-to-confidence conversion from Non-Axiomatic Logic (NAL).
   *
   * Reference:
   *   - Table C.1: The Relations Among Uncertainty Measurements, p. 289
   *     - Formula: c = w / (w + k), where w is total evidence weight and k is evidential horizon
   *   - Section 3.3: Truth Value, p. 31
   *
   * @param weight - Total evidence weight (non-negative)
   * @param k - Evidential horizon (default 1, must be positive)
   * @returns Confidence value in [0, 1)
   */
  static w2c = (weight: number, k: number = 1): number => {
    return weight / (weight + k);
  };

  /**
   * Computes positive evidence weight from frequency and confidence.
   * Implements the positive weight calculation from Non-Axiomatic Logic (NAL).
   *
   * Reference:
   *   - Table C.1: The Relations Among Uncertainty Measurements, p. 289
   *     - Formula: w+ = k * f * c / (1 - c), where w+ is positive evidence weight
   *   - Section 3.3: Truth Value, p. 31
   *
   * @param frequency - Frequency value in [0, 1]
   * @param confidence - Confidence value in [0, 1)
   * @param k - Evidential horizon (must be positive)
   * @returns Positive evidence weight
   */
  static fc_to_w_plus = (
    frequency: number,
    confidence: number,
    k: number
  ): number => {
    return (k * frequency * confidence) / (1 - confidence);
  };

  /**
   * Computes negative evidence weight from frequency and confidence.
   * Implements the negative weight calculation from Non-Axiomatic Logic (NAL).
   *
   * Reference:
   *   - Table C.1: The Relations Among Uncertainty Measurements, p. 289
   *     - Formula: w− = k * (1 - f) * c / (1 - c), where w− is negative evidence weight
   *   - Section 3.3: Truth Value, p. 31
   *
   * @param frequency - Frequency value in [0, 1]
   * @param confidence - Confidence value in [0, 1)
   * @param k - Evidential horizon (must be positive)
   * @returns Negative evidence weight
   */
  static fc_to_w_minus = (
    frequency: number,
    confidence: number,
    k: number
  ): number => {
    return (k * (1 - frequency) * confidence) / (1 - confidence);
  };

  /**
   * Converts positive and total evidence weights to frequency.
   * Implements the weight-to-frequency conversion from Non-Axiomatic Logic (NAL).
   *
   * Reference:
   *   - Table C.1: The Relations Among Uncertainty Measurements, p. 289
   *     - Formula: f = w+ / w, where w+ is positive weight and w is total weight
   *   - Section 3.3: Truth Value, p. 31
   *
   * @param positiveWeight - Positive evidence weight (non-negative)
   * @param totalWeight - Total evidence weight (non-negative)
   * @returns Frequency value in [0, 1], or 0.5 if totalWeight is 0
   */
  static w_to_f = (positiveWeight: number, totalWeight: number): number => {
    return totalWeight !== 0 ? positiveWeight / totalWeight : 0.5;
  };

  /**
   * Converts total evidence weight to confidence.
   * Implements the weight-to-confidence conversion from Non-Axiomatic Logic (NAL).
   *
   * Reference:
   *   - Table C.1: The Relations Among Uncertainty Measurements, p. 289
   *     - Formula: c = w / (w + k), where w is total weight and k is evidential horizon
   *   - Section 3.3: Truth Value, p. 31
   *
   * @param totalWeight - Total evidence weight (non-negative)
   * @param k - Evidential horizon (must be positive)
   * @returns Confidence value in [0, 1), or 0 if totalWeight is 0
   */
  static w_to_c = (totalWeight: number, k: number): number => {
    return totalWeight !== 0 ? totalWeight / (totalWeight + k) : 0.0;
  };

  /**
   * Creates a truth value from positive and total evidence weights.
   * Implements the weight-to-truth conversion from Non-Axiomatic Logic (NAL).
   *
   * Reference:
   *   - Table C.1: The Relations Among Uncertainty Measurements, p. 289
   *     - Formulas: f = w+ / w, c = w / (w + k)
   *   - Table C.3: The Truth-Value Functions of Inference Rules, p. 290
   *     - Used in revision rule
   *   - Section 3.3: Truth Value, p. 31
   *
   * @param positiveWeight - Positive evidence weight (non-negative)
   * @param totalWeight - Total evidence weight (non-negative)
   * @param k - Evidential horizon (must be positive)
   * @returns New Truth object with computed frequency and confidence
   */
  static truth_from_w = (
    positiveWeight: number,
    totalWeight: number,
    k: number
  ): Truth => {
    const frequency = this.w_to_f(positiveWeight, totalWeight);
    const confidence = this.w_to_c(totalWeight, k);
    return new Truth(new ShortFloat(frequency), new ShortFloat(confidence));
  };

  /**
   * Combines two truth values by revising their evidence weights.
   * Implements the revision rule from Non-Axiomatic Logic (NAL).
   *
   * Reference:
   *   - Section 4.1: Belief Revision, pp. 45–50
   *   - Table 4.1: The Revision Rule with Truth-value Function, p. 48
   *   - Table C.3: The Truth-Value Functions of Inference Rules, p. 290
   *     - Formulas: w+ = w+_1 + w+_2, w− = w−_1 + w−_2
   *     - f_new = w+_new / (w+_new + w−_new)
   *     - c_new = (w+_new + w−_new) / (w+_new + w−_new + k)
   *
   * @param truthOne - First truth value with frequency, confidence, and k
   * @param truthTwo - Second truth value with frequency, confidence, and k
   * @returns New Truth object with combined frequency and confidence
   * @throws Error if evidential horizons (k) differ
   */
  static revision = (truthOne: Truth, truthTwo: Truth): Truth => {
    const frequency1 = truthOne.getFrequency();
    const confidence1 = truthOne.getConfidence();
    const k1 = truthOne.k;

    const frequency2 = truthTwo.getFrequency();
    const confidence2 = truthTwo.getConfidence();
    const k2 = truthTwo.k;

    // If implementations can carry different horizons, you may want to guard:
    // if (k1 !== k2) throw new Error("Evidential horizons (k) must match for revision.");

    const positiveWeight1 = this.fc_to_w_plus(frequency1, confidence1, k1);
    const positiveWeight2 = this.fc_to_w_plus(frequency2, confidence2, k2);
    const negativeWeight1 = this.fc_to_w_minus(frequency1, confidence1, k1);
    const negativeWeight2 = this.fc_to_w_minus(frequency2, confidence2, k2);

    const positiveWeight = positiveWeight1 + positiveWeight2;
    const negativeWeight = negativeWeight1 + negativeWeight2;
    const totalWeight = positiveWeight + negativeWeight;

    return this.truth_from_w(positiveWeight, totalWeight, k1);
  };

  /**
   * Adjusts a truth value’s confidence for eternal (non-temporal) use.
   * Implements the eternalization rule from Non-Axiomatic Logic (NAL).
   *
   * Reference:
   *   - Section 7.3: Temporal Inference, p. 192
   *   - Table C.3: The Truth-Value Functions of Inference Rules, p. 290
   *     - Formula: d = 1 / (c + k), c_new = c * d = c / (c + k)
   *     - Frequency and k remain unchanged
   *
   * @param truth - Input truth value with frequency, confidence, and k
   * @returns New Truth object with same frequency and k, and adjusted confidence
   */
  static eternalize = (truth: Truth): Truth => {
    const confidence = truth.getConfidence();
    const k = truth.k;
    const newConfidence = confidence / (confidence + k);
    return new Truth(new ShortFloat(truth.getFrequency()), new ShortFloat(newConfidence));
  };

  /**
   * Adjusts a truth value’s confidence based on temporal distances.
   * Implements the projection rule from Non-Axiomatic Logic (NAL).
   *
   * Reference:
   *   - Section 7.3: Temporal Inference, p. 192
   *   - Table C.3: The Truth-Value Functions of Inference Rules, p. 290
   *     - Formula: d = 2s / (2s + v), where:
   *       - v = |t_source - t_target|
   *       - s = 0.5 if t_current is between t_source and t_target, else min(|t_source - t_current|, |t_target - t_current|)
   *     - c_new = c * d
   *
   * @param truth - Input truth value with frequency, confidence, and k
   * @param sourceTime - Time of the source event
   * @param currentTime - Current time
   * @param targetTime - Target time for projection
   * @returns New Truth object with same frequency and adjusted confidence
   */
  static projection = (
    truth: Truth,
    sourceTime: number,
    currentTime: number,
    targetTime: number
  ): Truth => {
    const temporalDistance = Math.abs(sourceTime - targetTime);
    const minTime = Math.min(sourceTime, targetTime);
    const maxTime = Math.max(sourceTime, targetTime);
    const isCurrentTimeBetween = currentTime >= minTime && currentTime <= maxTime;
    const intervalDistance = isCurrentTimeBetween
      ? 0.5
      : Math.min(
          Math.abs(sourceTime - currentTime),
          Math.abs(targetTime - currentTime)
        );
    const confidenceDiscount =
      (2 * intervalDistance) / (2 * intervalDistance + temporalDistance);
    const newConfidence = truth.getConfidence() * confidenceDiscount;
    return new Truth(
      new ShortFloat(truth.getFrequency()),
      new ShortFloat(newConfidence)
    );
  };

  /**
   * Converts a truth value to a quality score for budget calculations.
   * Implements the truth-to-quality function in Non-Axiomatic Logic (NAL).
   *
   * Reference:
   *   - Section 6.2: Budget Functions, p. 143
   *     - General principles for budget management (priority, durability, quality)
   *   - Section 4.1: Belief Revision, pp. 45–50
   *     - Budget adjustments during belief revision
   *   - PyNARS truth_to_quality (pynars.NAL.Functions.Tools)
   *     - Used in budget revision to compute quality (e.g., quality = truth_to_quality(truth_derived))
   *   - OpenNARS 3.1.0 BudgetFunctions.java, lines 72–118
   *     - Budget revision based on truth value differences
   *   - Formula: quality = max(e, (1 - e) * 0.75), where e is the truth expectation
   *
   * @param truth - Truth value with expectation in [0, 1]
   * @returns Quality score in [0, 1]
   */
  static truthToQuality = (truth: Truth): number => {
    const expectation = truth.getExpectation();
    return Math.max(expectation, (1 - expectation) * 0.75); // TRACK::WHY 0.75?
  };
}


 
export class MathFunctions {

    /**
     * Computes the arithmetic mean of multiple truth value components (frequencies or confidences).
     * Implements the average function for budget calculations in Non-Axiomatic Logic (NAL).
     * 
     * Reference:
     *   - Section 6.2: Budget Functions, p. 143
     *     - General principles for budget management (priority, durability, quality)
     *   - Section 4.1: Belief Revision, pp. 45–50
     *     - Budget adjustments during belief revision
     *   - PyNARS Budget_revision (pynars.NAL.Functions.BudgetFunctions)
     *     - Used in budget revision to compute durability (e.g., Average(diff, durability))
     *   - OpenNARS 3.1.0 BudgetFunctions.java, lines 72–118
     *     - Budget revision based on truth value differences
     *   - Formula: average(x1, ..., xn) = (x1 + x2 + ... + xn) / n
     * 
     * @param values - Array of numbers in [0, 1] (frequencies or confidences)
     * @returns Arithmetic mean of values, or 0 if array is empty
     */
    static average = (...values: number[]): number => {
        return values.length === 0 ? 0 : values.reduce((acc, val) => acc + val, 0) / values.length;
    };
    static or(...array: number[]): number {
        return 1 - array.reduce((acc, val) => acc * (1 - val), 1);
    }

    static and(...array: number[]): number {
        return array.reduce((acc, val) => acc * val, 1);
    }

    static mean(...arr: number[]): number {
        return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }

    static randomSigned64Bit(): bigint {
        const buf = new Uint8Array(8);
        crypto.getRandomValues(buf);
        const hex = [...buf].map(b => b.toString(16).padStart(2, '0')).join('');
        return BigInt.asIntN(64, BigInt('0x' + hex));
    }
}


/*
It stores a floating-point number between 0 and 1, but instead of using a float internally, it stores it as a short integer (short = 16-bit integer).

Example:
Instead of storing 0.5678, it stores the integer 5678 and interprets it as 0.5678 when needed.

It ensures:
* 4-digit accuracy (values are rounded to 0.0001 resolution)
* validity check: only values between 0 and 1 are accepted
* custom string formatting (e.g., "0.5678" or rounded "0.56")
*/

export class ShortFloat {
    private value: number; // stores integer 0–10000

    constructor(v: number) {
        if (v < 0 || v > 1) {
            throw new Error(`Invalid value: ${v}. Value must be between 0 and 1`);
        }
        this.value = Math.round(v * 10000);
    }

    public getValue(): number {
        return this.value * 0.0001;
    }

    public getShortValue(): number {
        return this.value;
    }

    public toNumber(): number {
        return this.value * 0.0001;
    }

    public setValue(v: number): void {
        if (v < 0 || v > 1) {
            throw new Error(`Invalid value: ${v}. Value must be between 0 and 1`);
        }
        this.value = Math.round(v * 10000);
    }

    public equals(that: unknown): boolean {
        if (!(that instanceof ShortFloat)) {
            return false;
        }
        return this.value === that.getShortValue();
    }

    public toString(): string {
        if (this.value === 10000) {
            return "1.0000";
        }
        const paddedValue = this.value.toString().padStart(4, "0");
        return `0.${paddedValue}`;
    }

    public toStringTwoDigits(): string {
        const fullString = this.toString();
        return fullString.substring(0, 4);
    }
}
