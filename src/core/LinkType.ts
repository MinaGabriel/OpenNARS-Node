/**
 * Enum representing different types of term links in NARS.
 * Each link type defines how a term points to another term or structure.
 * 
 * Example notation: source → target
 */
enum LinkType {
  /**
   * Points to itself (C → C). Example: C → C
   * Used in TaskLink only.
   */
  SELF = 0,

  /**
   * Points from a compound to one of its components. Example: (&&, A, C) → C
   */
  COMPONENT = 1,

  /**
   * Points from a component to its compound. Example: C → (&&, A, C)
   */
  COMPOUND = 2,

  /**
   * Points from a statement to one of its terms. Example: <C --> A> → C
   */
  COMPONENT_STATEMENT = 3,

  /**
   * Points from a term to the statement it participates in. Example: C → <C --> A>
   */
  COMPOUND_STATEMENT = 4,

  /**
   * Points from a higher-order statement to a condition component. Example: <(&&, C, B) ==> A> → C
   */
  COMPONENT_CONDITION = 5,

  /**
   * Points from a condition component to the higher-order statement. Example: C → <(&&, C, B) ==> A>
   */
  COMPOUND_CONDITION = 6,

  /**
   * Points from a term to a transformation statement. Example: C → <(*, C, B) --> A>
   * Used in TaskLink only.
   */
  TRANSFORM = 8,
}

export { LinkType }