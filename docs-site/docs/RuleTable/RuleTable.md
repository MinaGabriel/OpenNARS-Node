### Rules Combinations

This table summarizes the combinations of TaskLink and TermLink types in the NARS inference engine, based on `RuleTables.ts`. It lists link types, inference rules, and NARS examples.

| TaskLink | TermLink      | Inference Rule and Example                                                                               |
|----------|---------------|----------------------------------------------------------------------------------------------------------|
| SELF     | COMPONENT     | `compoundAndSelf` (decompose or structural compound) \| Task: `<(&&, bird, flyer) --> animal>` \| Belief: `<bird --> animal>` \| Result: `<flyer --> animal>` |
| SELF     | COMPOUND      | `compoundAndSelf` (reverse, compound as belief) \| Task: `<bird --> animal>` \| Belief: `<(&&, bird, flyer) --> animal>` \| Result: `<flyer --> animal>` |
| SELF     | COMP_STMT     | `SyllogisticRules.detachment` \| Task: `<bird --> animal>` \| Belief: `<bird --> flyer>` \| Result: None (detachment requires implication) |
| SELF     | COMPOUND_STMT | `SyllogisticRules.detachment` (belief as statement) \| Task: `<bird --> animal>` \| Belief: `<flyer --> animal>` \| Result: None (detachment requires implication) |
| SELF     | COMP_COND     | `SyllogisticRules.conditionalDedInd` \| Task: `<(&&, bird, flyer) ==> animal>` \| Belief: `<bird --> flyer>` \| Result: `<flyer ==> animal>` |
| SELF     | COMPOUND_COND | `SyllogisticRules.conditionalDedInd` (belief as implication) \| Task: `<bird --> flyer>` \| Belief: `<(&&, bird, swimmer) ==> flyer>` \| Result: `<swimmer ==> flyer>` |
| COMPOUND | COMPOUND      | `compoundAndCompound` (compare sizes, call `compoundAndSelf`) \| Task: `<(&&, bird, flyer) --> animal>` \| Belief: `<(&&, bird) --> animal>` \| Result: `<flyer --> animal>` |
| COMPOUND | COMPOUND_STMT | `compoundAndStatement` (structural or compositional rules) \| Task: `<(&&, bird, flyer) --> animal>` \| Belief: `<bird --> flyer>` \| Result: `<flyer --> animal>` |
| COMPOUND | COMPOUND_COND | `SyllogisticRules.conditionalDedInd` or `conditionalAna` (with variable unification) \| Task: `<bird --> flyer>` \| Belief: `<(&&, bird, swimmer) ==> flyer>` \| Result: `<swimmer ==> flyer>` |
| COMP_STMT | COMPONENT     | `componentAndStatement` (structural decomposition) \| Task: `<bird --> animal>` \| Belief: `<(&&, bird, flyer) --> animal>` \| Result: `<flyer --> animal>` |
| COMP_STMT | COMPOUND      | `compoundAndStatement` (reverse, belief as compound) \| Task: `<bird --> animal>` \| Belief: `<(&&, bird, flyer) --> animal>` \| Result: `<flyer --> animal>` |
| COMP_STMT | COMPOUND_STMT | `syllogisms` (asymmetric, symmetric, or detachment) \| Task: `<bird --> animal>` \| Belief: `<flyer --> animal>` \| Result: `<bird --> flyer>` |
| COMP_STMT | COMPOUND_COND | `conditionalDedIndWithVar` (conditional with variables) \| Task: `<bird --> animal>` \| Belief: `<(&&, bird, flyer) ==> animal>` \| Result: `<flyer ==> animal>` |
| COMP_COND | COMPOUND      | `detachmentWithVar` (implication detachment) \| Task: `<(&&, bird, flyer) ==> animal>` \| Belief: `<bird --> flyer>` \| Result: `<flyer ==> animal>` |
| COMP_COND | COMPOUND_STMT | `conditionalDedIndWithVar` or `componentAndStatement` (conditional or negation handling) \| Task: `<(&&, bird, flyer) ==> animal>` \| Belief: `<bird --> flyer>` \| Result: `<flyer ==> animal>` |

### Explanation

- **Purpose**: Shows how NARS dispatches inference rules based on TaskLink and TermLink types for reasoning from tasks and beliefs.
- **TaskLink Types**: Task term structure (e.g., `SELF` for single terms, `COMP_STMT` for `<bird --> animal>`).
- **TermLink Types**: Belief term or relation (e.g., `COMPONENT` for part of a compound).
- **Inference Rules and Examples**: Methods like `syllogisms` (abduction, deduction) or `compoundAndSelf` (decomposition). Examples show task, belief, result (e.g., `COMP_STMT` with `COMPOUND_STMT` yields `<bird --> flyer>` via abduction).
- **Code Basis**: From `RuleTables.reason`’s switch-case, mapping links to rules like `SyllogisticRules.detachment`.