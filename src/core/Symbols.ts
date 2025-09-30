export class Symbols {
    /* sentence type and delimiters */
    public static readonly JUDGMENT_MARK = '.';
    public static readonly QUESTION_MARK = '?';

    /* variable type */
    public static readonly VAR_INDEPENDENT = '$';
    public static readonly VAR_DEPENDENT = '#';
    public static readonly VAR_QUERY = '?';

    /* numerical value delimiters */
    public static readonly BUDGET_VALUE_MARK = '$';
    public static readonly TRUTH_VALUE_MARK = '%';
    public static readonly VALUE_SEPARATOR = ';';

    /* CompoundTerm delimiters */
    public static readonly COMPOUND_TERM_OPENER = '(';
    public static readonly COMPOUND_TERM_CLOSER = ')';
    public static readonly STATEMENT_OPENER = '<';
    public static readonly STATEMENT_CLOSER = '>';
    public static readonly SET_EXT_OPENER = '{';
    public static readonly SET_EXT_CLOSER = '}';
    public static readonly SET_INT_OPENER = '[';
    public static readonly SET_INT_CLOSER = ']';

    /* special characters in argument list */
    public static readonly ARGUMENT_SEPARATOR = ',';
    public static readonly IMAGE_PLACE_HOLDER = '_';

    /* CompoundTerm operators */
    public static readonly INTERSECTION_EXT_OPERATOR = "&";
    public static readonly INTERSECTION_INT_OPERATOR = "|";
    public static readonly DIFFERENCE_EXT_OPERATOR = "-";
    public static readonly DIFFERENCE_INT_OPERATOR = "~";
    public static readonly PRODUCT_OPERATOR = "*";
    public static readonly IMAGE_EXT_OPERATOR = "/";
    public static readonly IMAGE_INT_OPERATOR = "\\";

    /* CompoundStatement operators */
    public static readonly NEGATION_OPERATOR = "--";
    public static readonly DISJUNCTION_OPERATOR = "||";
    public static readonly CONJUNCTION_OPERATOR = "&&";

    /* built-in relations */
    public static readonly INHERITANCE_RELATION = "-->";
    public static readonly SIMILARITY_RELATION = "<->";
    public static readonly INSTANCE_RELATION = "{--";
    public static readonly PROPERTY_RELATION = "--]";
    public static readonly INSTANCE_PROPERTY_RELATION = "{-]";
    public static readonly IMPLICATION_RELATION = "==>";
    public static readonly EQUIVALENCE_RELATION = "<=>";

    /* experience line prefix */
    public static readonly INPUT_LINE = "IN";
    public static readonly OUTPUT_LINE = "OUT";
    public static readonly PREFIX_MARK = ':';
    public static readonly RESET_MARK = '*';
    public static readonly COMMENT_MARK = '/';

    /* Stamp display only */
    public static readonly STAMP_OPENER = '{';
    public static readonly STAMP_CLOSER = '}';
    public static readonly STAMP_SEPARATOR = ';';
    public static readonly STAMP_STARTER = ':';

    /* TermLink type display only */
    public static readonly TO_COMPONENT_1 = " @(";
    public static readonly TO_COMPONENT_2 = ")_ ";
    public static readonly TO_COMPOUND_1 = " _@(";
    public static readonly TO_COMPOUND_2 = ") ";
}


/**
 * =============================
 * Core Enum Definitions for NARS
 * =============================
 * 
 * This file contains core enumerations and constant mappings used throughout the NARS system:
 * - LinkType: Structural relationships between terms.
 * - Punctuation: Sentence intent indicators.
 * - Tense: Temporal context of statements.
 * - TermType: Classification of terms.
 * - ConnectorType: Operators that connect terms within compounds.
 * - CopulaSymbols: Mapping of copula symbols to their logical meaning.
 */

/**
 * Describes the direction and nature of structural relationships between terms.
 */
export enum LinkType {
  SELF = 0,                  // Self-link: C → C (used in TaskLink only)
  COMPONENT = 1,            // Compound → component. E.g., (&&, A, B) → B
  COMPOUND = 2,             // Component → compound. E.g., B → (&&, A, B)
  COMPONENT_STATEMENT = 3,  // Statement → term. E.g., <B --> A> → B
  COMPOUND_STATEMENT = 4,   // Term → statement. E.g., B → <B --> A>
  COMPONENT_CONDITION = 5,  // HO statement → condition. E.g., <(&&, B, C) ==> A> → C
  COMPOUND_CONDITION = 6,   // Condition → HO statement. E.g., C → <(&&, B, C) ==> A>
  TRANSFORM = 8             // Term → transformation statement. E.g., C → <(*, B, C) --> A>
}

export enum TaskType {
  INPUT, 
  DERIVED
}
/**
 * End punctuation in Narsese indicating the sentence type.
 */
export enum Punctuation {
  JUDGMENT = ".",    // Assertion: <bird --> animal>.
  QUESTION = "?",    // Inquiry: <bird --> animal>?
  GOAL = "!",        // Desired outcome: <bird --> animal>!
  QUEST = "@"        // Execution request: <bird --> animal>@
}

/**
 * Temporal markers in Narsese for time-based reasoning.
 */
export enum Tense {
  Past = ":\\:",      // Past event
  Present = ":|:",    // Present event
  Future = ":/:",     // Future event
  Eternal = ":-:"     // Time-independent truth
}

/**
 * Classifies terms by their structural role in NAL.
 */
export enum TermType {
  ATOM = 0,           // Basic term
  STATEMENT = 1,      // Statement used as a term
  COMPOUND = 2        // Composite term (e.g., conjunction, product)
}

/**
 * Connectors used to form compound terms and statements in Narsese.
 */
export enum ConnectorType {
  CONJUNCTION = "&&",                 // Logical AND
  DISJUNCTION = "||",                 // Logical OR
  PRODUCT = "*",                      // Ordered product
  PARALLEL_EVENTS = "&|",             // Events happening simultaneously
  SEQUENTIAL_EVENTS = "&/",           // Events in sequence
  INTENSIONAL_INTERSECTION = "|",     // Shared properties
  EXTENSIONAL_INTERSECTION = "&",     // Shared instances
  EXTENSIONAL_DIFFERENCE = "-",       // Set subtraction by extension
  INTENSIONAL_DIFFERENCE = "~",       // Set subtraction by intension
  NEGATION = "--",                    // Logical negation
  INTENSIONAL_SET = "[",              // Set of common properties
  EXTENSIONAL_SET = "{",              // Set of common members
  INTENSIONAL_IMAGE = "\\",           // Image in intension
  EXTENSIONAL_IMAGE = "/",            // Image in extension
  LIST = "#"                          // Unordered list
}

/**
 * A mapping of copula symbols to their corresponding logical relationship in Narsese.
 */
export const CopulaSymbols = {
  "-->": "Inheritance",                 // Basic "is-a" relationship
  "<->": "Similarity",                  // Terms share similar meaning
  "{--": "Instance",                    // Term is an instance of a concept
  "--]": "Property",                    // Term is a property of something
  "{-]": "InstanceProperty",            // Instance-property relationship
  "==>": "Implication",                 // If-then relationship
  "=/>": "PredictiveImplication",       // Cause precedes effect
  "=|>": "ConcurrentImplication",       // Cause and effect happen together
  "=\\>": "RetrospectiveImplication",   // Effect precedes cause
  "<=>": "Equivalence",                 // Bi-conditional logical equivalence
  "</>": "PredictiveEquivalence",       // Predictive if-and-only-if
  "<|>": "ConcurrentEquivalence"        // Concurrent if-and-only-if
} as const;

/**
 * Type representing all valid copula symbols used in the Narsese grammar.
 */
export type CopulaSymbol = keyof typeof CopulaSymbols;

// Enum for truth function types (mirrors OpenNARS EnumType)
export enum TruthFunctionType {
    DESIREDED = 'DESIREDED',
    DESIREIND = 'DESIREIND',
    DESIREWEAK = 'DESIREWEAK',
    DESIRESTRONG = 'DESIRESTRONG',
    COMPARISON = 'COMPARISON',
    ANALOGY = 'ANALOGY',
    ANONYMOUSANALOGY = 'ANONYMOUSANALOGY',
    DEDUCTION = 'DEDUCTION',
    EXEMPLIFICATION = 'EXEMPLIFICATION',
    ABDUCTION = 'ABDUCTION',
    RESEMBLENCE = 'RESEMBLENCE',
    REDUCECONJUNCTION = 'REDUCECONJUNCTION',
    REDUCEDISJUNCTION = 'REDUCEDISJUNCTION',
    REDUCEDISJUNCTIONREV = 'REDUCEDISJUNCTIONREV',
    REDUCECONJUNCTIONNEG = 'REDUCECONJUNCTIONNEG',
}




/**
 * Temporal order constants for reasoning about event sequences in NAL-7.
 * Matches the original Java `TemporalRules` definitions.
 */
export enum TemporalTypes {
  ORDER_INVALID = -2,       // Invalid or unknown temporal relation
  ORDER_BACKWARD = -1,     // Consequence happens before the condition (retrospective)
  ORDER_CONCURRENT = 0,    // Events occur simultaneously (concurrent)
  ORDER_FORWARD = 1,       // Condition happens before the consequence (predictive)
  ORDER_NONE = 2          // No specific temporal order
  
}
export type TemporalType = keyof typeof TemporalTypes;


//INTERFACES

export interface Identifiable {
  name(): string;
  toString(): string; 
}


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
