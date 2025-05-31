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

/**
 * Temporal order constants for reasoning about event sequences in NAL-7.
 * Matches the original Java `TemporalRules` definitions.
 */
export enum TemporalTypes {
  ORDER_BACKWARD = -1,     // Consequence happens before the condition (retrospective)
  ORDER_CONCURRENT = 0,    // Events occur simultaneously (concurrent)
  ORDER_FORWARD = 1,       // Condition happens before the consequence (predictive)
  ORDER_NONE = 2,          // No specific temporal order
  ORDER_INVALID = -2       // Invalid or unknown temporal relation
}
export type TemporalType = keyof typeof TemporalTypes;