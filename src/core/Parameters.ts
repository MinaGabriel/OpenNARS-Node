/*
 * The MIT License
 *
 * Copyright 2018 The OpenNARS authors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

export class Parameters {
  public static NOVELTY_HORIZON = 100000; // Originally equal to the termlink record length (10), scaled to time
  public static DECISION_THRESHOLD = 0.51; // Minimum expectation for a desire value to execute an operation
  public static CONCEPT_BAG_SIZE = 10000; // Size of ConceptBag
  public static CONCEPT_BAG_LEVELS = 1000; // Levels of ConceptBag
  public static DURATION = 5; // Cycles per duration, range of "now" is [-DURATION/2, +DURATION/2]
  public static MAX_BUFFER_DURATION_FACTOR = 2; // Value * DURATION = time buffer element stays
  public static HORIZON = 1; // Evidential Horizon, amount of future evidence to be considered
  public static TRUTH_EPSILON = 0.01; // Internal precision for TruthValue calculations
  public static BUDGET_EPSILON = 0.0001; // Budget value epsilon
  public static BUDGET_THRESHOLD = 0.01; // Budget threshold rate for task to be accepted
  public static DEFAULT_CONFIRMATION_EXPECTATION = 0.6; // Default expectation for confirmation on anticipation
  public static ALWAYS_CREATE_CONCEPT = true; // Ignore expectation for creation of concept
  public static DEFAULT_CREATION_EXPECTATION = 0.66; // Default expectation for creation of concept
  public static DEFAULT_CREATION_EXPECTATION_GOAL = 0.6; // Default expectation for creation of concept for goals
  public static DEFAULT_JUDGMENT_CONFIDENCE = 0.9; // Default confidence of input judgment
  public static DEFAULT_JUDGMENT_PRIORITY = 0.8; // Default priority of input judgment
  public static DEFAULT_JUDGMENT_DURABILITY = 0.5; // Default durability of input judgment
  public static DEFAULT_QUESTION_PRIORITY = 0.9; // Default priority of input question
  public static DEFAULT_QUESTION_DURABILITY = 0.9; // Default durability of input question
  public static DEFAULT_GOAL_CONFIDENCE = 0.9; // Default confidence of input goal
  public static DEFAULT_GOAL_PRIORITY = 0.9; // Default priority of input goal
  public static DEFAULT_GOAL_DURABILITY = 0.9; // Default durability of input goal
  public static DEFAULT_QUEST_PRIORITY = 0.9; // Default priority of input quest
  public static DEFAULT_QUEST_DURABILITY = 0.9; // Default durability of input quest
  public static BAG_THRESHOLD = 1.0; // Level separation in LevelBag, one digit
  public static FORGET_QUALITY_RELATIVE = 0.3; // Used in budgetfunctions iterative forgetting
  public static REVISION_MAX_OCCURRENCE_DISTANCE = 10; // Maximum occurrence distance for revision
  public static TASK_LINK_BAG_SIZE = 100; // Size of TaskLinkBag
  public static TASK_LINK_BAG_LEVELS = 10; // Levels of TaskLinkBag
  public static TERM_LINK_BAG_SIZE = 100; // Size of TermLinkBag
  public static TERM_LINK_BAG_LEVELS = 10; // Levels of TermLinkBag
  public static TERM_LINK_MAX_MATCHED = 10; // Max TermLinks checked for novelty per TaskLink
  public static GLOBAL_BUFFER_SIZE = 30; // Size of Novel Task Buffer
  public static GLOBAL_BUFFER_LEVELS = 10; // Levels of Global Buffer
  public static INTERNAL_BUFFER_SIZE = 30; // Size of Internal Buffer
  public static INTERNAL_BUFFER_LEVELS = 10; // Levels of Internal Buffer
  public static SEQUENCE_BAG_SIZE = 30; // Size of derived sequence and input event bag
  public static SEQUENCE_BAG_LEVELS = 10; // Levels of Sequence Bag
  public static OPERATION_BAG_SIZE = 10; // Size of remembered last operation tasks
  public static OPERATION_BAG_LEVELS = 10; // Levels of Operation Bag
  public static OPERATION_SAMPLES = 6; // At least 2 to avoid only last decision consideration
  public static PROJECTION_DECAY = 0.1; // How fast events decay in confidence
  public static MAXIMUM_EVIDENTIAL_BASE_LENGTH = 20000; // Maximum length of the evidential base of the Stamp
  public static TERMLINK_MAX_REASONED = 3; // Max TermLinks used for reasoning per Task
  public static TERM_LINK_RECORD_LENGTH = 10; // Record-length for new TermLinks
  public static CONCEPT_BELIEFS_MAX = 28; // Max beliefs per Concept
  public static CONCEPT_QUESTIONS_MAX = 5; // Max questions per Concept
  public static CONCEPT_GOALS_MAX = 7; // Max goals per Concept
  public static reliance = 0.9; // Empirical confidence of analytical truth
  public static DISCOUNT_RATE = 0.5; // Rate of confidence decrease in Doubt/Hesitate
  public static IMMEDIATE_ETERNALIZATION = true; // Whether eternalization happens on every derivation
  public static SEQUENCE_BAG_ATTEMPTS = 10; // Attempts for sequence bag
  public static CONDITION_BAG_ATTEMPTS = 10; // Attempts for condition bag
  public static DERIVATION_PRIORITY_LEAK = 0.4; // Priority leak on derivation
  public static DERIVATION_DURABILITY_LEAK = 0.4; // Durability leak on derivation
  public static CURIOSITY_DESIRE_CONFIDENCE_MUL = 0.1; // Confidence multiplier for curiosity
  public static CURIOSITY_DESIRE_PRIORITY_MUL = 0.1; // Priority multiplier for curiosity
  public static CURIOSITY_DESIRE_DURABILITY_MUL = 0.3; // Durability multiplier for curiosity
  public static CURIOSITY_FOR_OPERATOR_ONLY = false; // Restrict curiosity to operators
  public static BREAK_NAL_HOL_BOUNDARY = false; // Allow breaking NAL higher-order logic boundary
  public static QUESTION_GENERATION_ON_DECISION_MAKING = false; // Enable question generation on decision making
  public static HOW_QUESTION_GENERATION_ON_DECISION_MAKING = false; // Enable how-question generation
  public static ANTICIPATION_CONFIDENCE = 0.1; // Induction confidence to revise anticipations
  public static ANTICIPATION_TOLERANCE = 100.0; // Tolerance on anticipation
  public static RETROSPECTIVE_ANTICIPATIONS = false; // Check memory on anticipation
  public static SATISFACTION_THRESHOLD = 0.0; // Satisfaction threshold
  public static COMPLEXITY_UNIT = 1.0; // Base complexity unit
  public static INTERVAL_ADAPT_SPEED = 4.0; // Adapt speed for intervals
  public static TASKLINK_PER_CONTENT = 4; // Extra eternal/event also seen
  public static DEFAULT_FEEDBACK_PRIORITY = 0.9; // Default priority of execution feedback
  public static DEFAULT_FEEDBACK_DURABILITY = 0.5; // Default durability of execution feedback
  public static CONCEPT_FORGET_DURATIONS = 2.0; // Decay duration for ConceptBag
  public static GLOBAL_BUFFER_FORGET_DURATIONS = 1.0; // Forget duration for global buffer
  public static INTERNAL_BUFFER_FORGET_DURATIONS = 1.0; // Forget duration for internal buffer
  public static TERMLINK_FORGET_DURATIONS = 10.0; // Decay rate in TermLinkBag
  public static TASKLINK_FORGET_DURATIONS = 4.0; // Decay rate in TaskLinkBag
  public static EVENT_FORGET_DURATIONS = 4.0; // Sequence bag forget durations
  public static VARIABLE_INTRODUCTION_COMBINATIONS_MAX = 8; // Max attempted combinations in var introduction
  public static VARIABLE_INTRODUCTION_CONFIDENCE_MUL = 0.9; // Confidence penalty per var introduced
  public static ANTICIPATIONS_PER_CONCEPT_MAX = 8; // Max anticipations stored in a concept
  public static MOTOR_BABBLING_CONFIDENCE_THRESHOLD = 0.8; // Confidence threshold to avoid babbling
  public static THREADS_AMOUNT = 1; // Default thread amount at startup
  public static VOLUME = 0; // Default volume at startup
  public static MILLISECONDS_PER_STEP = 0; // Milliseconds per step at startup
  public static STEPS_CLOCK = true; // Timing mode, steps or real time
  public static BUFFER_MAX_DURATION = 100; // Buffer max duration
  public static ALLOW_LEGACY_EVENT_BAG_HANDLING_TOO = false; // Allow legacy event bag-like comparison 
}
