/**
 * Enum representing different types of term links in NARS.
 * Each link type defines how a term points to another term or structure.
 */
enum LinkType {
    /**
     * Points to itself (C → C). Used in TaskLink only.
     */
    SELF = 0,
  
    /**
     * At a compound (&&, A, C), points to component C.
     */
    COMPONENT = 1,
  
    /**
     * At component C, points to its compound (&&, A, C).
     */
    COMPOUND = 2,
  
    /**
     * At statement <C --> A>, points to term C.
     */
    COMPONENT_STATEMENT = 3,
  
    /**
     * At term C, points to statement <C --> A>.
     */
    COMPOUND_STATEMENT = 4,
  
    /**
     * At condition C, points to implication <(&&, C, B) ==> A>.
     */
    COMPONENT_CONDITION = 5,
  
    /**
     * At term C, points to implication <(&&, C, B) ==> A>.
     */
    COMPOUND_CONDITION = 6,
  
    /**
     * At term C, points to transformation <(*, C, B) --> A>. Used in TaskLink only.
     */
    TRANSFORM = 8,
  }
  
 