import { Concept } from './Concept';
import { LinkType } from './Enums';
import { MemoryStore } from './MemoryStore';
import { TaskLink } from './TaskLink';
import { Term } from './Term';
import { TermLink } from './TermLink';

class RuleTables {
    constructor() {}

    public static reason(taskLink: TaskLink, termLink: TermLink): void {
        const memory = MemoryStore.getState().memory;

        const originalTask = memory.task;
        const originalSentence = originalTask.sentence;
        const originalTerm = originalSentence.term;

        const beliefTerm: Term = termLink.target.term.clone();  // Clone belief term
        const beliefConcept = memory.conceptsBag.get(beliefTerm.name); // Get concept by name

        // You could retrieve the belief like this:
        // const belief = beliefConcept?.getBelief(originalTask);

        switch (taskLink.type) {
            case LinkType.SELF:
                switch (termLink.type) {
                    case LinkType.COMPONENT:
                        // Example: <A & B> @ A  --> process component of conjunction
                        RuleTables.handleComponentSelf(originalTerm, beliefTerm);
                        break;

                    case LinkType.COMPOUND:
                        // Example: A @ <A & B> --> process compound
                        RuleTables.handleCompoundSelf(beliefTerm, originalTerm);
                        break;

                    case LinkType.COMPONENT_STATEMENT:
                        // Example: <A --> B> @ A --> deduce B
                        RuleTables.handleComponentStatement(originalTerm, beliefTerm);
                        break;

                    case LinkType.COMPOUND_STATEMENT:
                        // Example: A @ <A --> B> --> deduce B from compound
                        RuleTables.handleCompoundStatement(beliefTerm, originalTerm);
                        break;

                    case LinkType.COMPONENT_CONDITION:
                        // Example: if <(&&, A, B) ==> C> and A then deduce C
                        RuleTables.handleComponentCondition(originalTerm, beliefTerm);
                        break;

                    case LinkType.COMPOUND_CONDITION:
                        // Example: if A and <(&&, A, B) ==> C> then deduce C
                        RuleTables.handleCompoundCondition(beliefTerm, originalTerm);
                        break;
                }
                break;

            case LinkType.COMPOUND:
                switch (termLink.type) {
                    case LinkType.COMPOUND:
                        // Example: <A & B> @ <B & A> --> structural equality
                        RuleTables.handleCompoundCompound(originalTerm, beliefTerm);
                        break;

                    case LinkType.COMPOUND_STATEMENT:
                        // Example: <(&&, A, B)> @ <(&&, A, B) --> C>
                        RuleTables.handleCompoundWithStatement(originalTerm, beliefTerm);
                        break;

                    case LinkType.COMPOUND_CONDITION:
                        // Example: <(&&, A, B)> and <(&&, A, B) ==> C>
                        RuleTables.handleCompoundWithCondition(originalTerm, beliefTerm);
                        break;
                }
                break;

            case LinkType.COMPOUND_STATEMENT:
                switch (termLink.type) {
                    case LinkType.COMPONENT:
                        // Example: B @ <A --> B>
                        RuleTables.handleComponentWithStatement(beliefTerm, originalTerm);
                        break;

                    case LinkType.COMPOUND:
                        // Example: <A & B> @ <A & B --> C>
                        RuleTables.handleCompoundWithStatement(beliefTerm, originalTerm);
                        break;

                    case LinkType.COMPOUND_STATEMENT:
                        // Example: chaining: <A --> B> and <B --> C>
                        RuleTables.handleChainedStatements(originalTerm, beliefTerm);
                        break;

                    case LinkType.COMPOUND_CONDITION:
                        // Example: <A --> B> and <(&&, A, C) ==> D>
                        RuleTables.handleStatementWithCondition(originalTerm, beliefTerm);
                        break;
                }
                break;

            case LinkType.COMPOUND_CONDITION:
                switch (termLink.type) {
                    case LinkType.COMPOUND:
                        // Example: detachment with variable match
                        RuleTables.handleConditionWithCompound(originalTerm, beliefTerm);
                        break;

                    case LinkType.COMPOUND_STATEMENT:
                        // Example: conditional deduction with negation or inner statements
                        RuleTables.handleConditionWithStatement(originalTerm, beliefTerm);
                        break;
                }
                break;

            default:
                console.warn("Unknown taskLink type:", taskLink.type);
        }
    }

    // ---------- Placeholders Below: You will implement logic here ----------

    private static handleComponentSelf(task: Term, belief: Term) {
        // TODO: implement inference logic
        console.log("handleComponentSelf");
    }

    private static handleCompoundSelf(compound: Term, component: Term) {
        // TODO: implement inference logic
        console.log("handleCompoundSelf");
    }

    private static handleComponentStatement(task: Term, belief: Term) {
        // TODO: implement deduction
        console.log("handleComponentStatement");
    }

    private static handleCompoundStatement(belief: Term, task: Term) {
        // TODO: implement detachment from compound statement
        console.log("handleCompoundStatement");
    }

    private static handleComponentCondition(task: Term, belief: Term) {
        // TODO: implement conditional deduction (task is Implication)
        console.log("handleComponentCondition");
    }

    private static handleCompoundCondition(belief: Term, task: Term) {
        // TODO: implement conditional deduction (belief is Implication)
        console.log("handleCompoundCondition");
    }

    private static handleCompoundCompound(task: Term, belief: Term) {
        // TODO: structural equality between compounds
        console.log("handleCompoundCompound");
    }

    private static handleCompoundWithStatement(compound: Term, statement: Term) {
        // TODO: inference between compound and statement
        console.log("handleCompoundWithStatement");
    }

    private static handleCompoundWithCondition(compound: Term, conditional: Term) {
        // TODO: implication from a compound
        console.log("handleCompoundWithCondition");
    }

    private static handleComponentWithStatement(component: Term, statement: Term) {
        // TODO: component implies something in statement
        console.log("handleComponentWithStatement");
    }

    private static handleChainedStatements(first: Term, second: Term) {
        // TODO: chain A --> B and B --> C to get A --> C
        console.log("handleChainedStatements");
    }

    private static handleStatementWithCondition(statement: Term, condition: Term) {
        // TODO: derive based on conditional + statement
        console.log("handleStatementWithCondition");
    }

    private static handleConditionWithCompound(condition: Term, compound: Term) {
        // TODO: detachment using implication and matching compound
        console.log("handleConditionWithCompound");
    }

    private static handleConditionWithStatement(condition: Term, statement: Term) {
        // TODO: conditional logic when task is implication
        console.log("handleConditionWithStatement");
    }
}

export { RuleTables };
