import { Truth } from "../Truth";
import { Stamp } from "../Stamp";
import { ShortFloat } from "../ShortFloat";
import { Judgement } from "../Judgement";
import { Question } from "../Question";
import { Premise } from "../enums/Types";
import { Memory } from "../storage/Memory";
import { MemoryStore } from "../storage/MemoryStore";

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
    static fc_to_w_plus = (frequency: number, confidence: number, k: number): number => {
        return k * frequency * confidence / (1 - confidence);
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
    static fc_to_w_minus = (frequency: number, confidence: number, k: number): number => {
        return k * (1 - frequency) * confidence / (1 - confidence);
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
    static truth_from_w = (positiveWeight: number, totalWeight: number, k: number): Truth => {
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
    static projection = (truth: Truth, sourceTime: number, currentTime: number, targetTime: number): Truth => {
        const temporalDistance = Math.abs(sourceTime - targetTime);
        const minTime = Math.min(sourceTime, targetTime);
        const maxTime = Math.max(sourceTime, targetTime);
        const isCurrentTimeBetween = currentTime >= minTime && currentTime <= maxTime;
        const intervalDistance = isCurrentTimeBetween ? 0.5 : Math.min(
            Math.abs(sourceTime - currentTime),
            Math.abs(targetTime - currentTime)
        );
        const confidenceDiscount = (2 * intervalDistance) / (2 * intervalDistance + temporalDistance);
        const newConfidence = truth.getConfidence() * confidenceDiscount;
        return new Truth(new ShortFloat(truth.getFrequency()), new ShortFloat(newConfidence));
    };

    /**
     * Adjusts a belief’s truth value to align with a task’s temporal properties.
     * Implements temporal inference logic from Non-Axiomatic Logic (NAL).
     * 
     * Reference:
     *   - Section 7.3: Temporal Inference, p. 192
     *   - Table C.3: The Truth-Value Functions of Inference Rules, p. 290
     *     - Uses projection: d = 2s / (2s + v), c_new = c * d
     *     - Uses eternalization: c_new = c / (c + k)
     *     - If belief is non-eternal, projects to task’s time (if non-eternal) and eternalizes
     * 
     * Example:
     *   - PremiseOne (Task): New observation <birds --> fly> with <0.8, 0.9> at time 150
     *   - PremiseTwo (Belief): Stored concept <birds --> fly> with <0.7, 0.85> at time 100
     *   - Current Time: 200 (from MemoryStore)
     *   - Since belief is non-eternal:
     *     - Since task is non-eternal, applies projection:
     *       - sourceTime = 100 (belief time)
     *       - currentTime = 200 (current time)
     *       - targetTime = 150 (task time)
     *       - v = |100 - 150| = 50, s = min(|100 - 200|, |150 - 200|) = 50
     *       - d = 2*50 / (2*50 + 50) = 0.667, c_new = 0.85 * 0.667 ≈ 0.567
     *     - Applies eternalize: c_new = 0.567 / (0.567 + 1) ≈ 0.362 (k = 1)
     * The function projects premiseTwo’s truth value to align with premiseOne’s time.
     * 
     * @param premiseOne - Task premise with truth value and stamp (new input)
     * @param premiseTwo - Belief premise with truth value and stamp (stored concept)
     * @returns Adjusted truth value of the belief
     */
    static projectionTruth(premiseOne: Premise, premiseTwo: Premise): Truth {
        let truth: Truth = premiseTwo.truth;

        if (!premiseTwo.stamp.isEternal) {
            if (!premiseOne.stamp.isEternal) {
                const sourceTime = premiseTwo.stamp.occurrenceTime;
                const currentTime = MemoryStore.getState().time.narsClock?.() ?? 0;
                const targetTime = premiseOne.stamp.occurrenceTime;
                truth = this.projection(truth, sourceTime, currentTime, targetTime);
            }
            truth = this.eternalize(truth);
        }

        return truth;
    }

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
        return Math.max(expectation, (1 - expectation) * 0.75);
    };

}