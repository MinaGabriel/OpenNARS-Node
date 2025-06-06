
import { Sentence } from "../Sentence";
import { Task } from "../Task";
import { Parameters } from "../Parameters";
import { MemoryStore } from "../storage/MemoryStore";
import { Stamp } from "../Stamp";
import { TruthFunctions } from "./TruthFunctions";
import { TemporalTypes } from "../enums/Enums";

export class RuleFunctions {
  static revisable(sentenceOne: Sentence, sentenceTwo: Sentence): boolean {
    if (!sentenceOne.stamp.isEternal() && !sentenceTwo.stamp.isEternal()) {
      if (Math.abs(sentenceOne.stamp.occurrenceTime - sentenceTwo.stamp.occurrenceTime) > Parameters.REVISION_MAX_OCCURRENCE_DISTANCE) {
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
     * Computes the quality of a solution (task) as an answer to a problem (belief).
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

  static solutionQuality(problem: Task, solution: Sentence, rateOfConfidence: boolean): number {
    if (problem.sentence.punctuation !== solution.punctuation && solution.term.hasVariableQuery()) return 0.0;

    let truth = solution.truth;
    if (problem.sentence.stamp.occurrenceTime !== solution.stamp.occurrenceTime) {
      truth = TruthFunctions.projectionTruth(problem.sentence, solution)
    }
    const complexity = solution.term.complexity;
    const rTermComplexityUnit = Parameters.COMPLEXITY_UNIT;
    return rateOfConfidence
      ? Number(truth.confidence)
      : truth.getExpectation() / Math.sqrt(Math.sqrt(Math.sqrt(complexity * rTermComplexityUnit)));
  }
}