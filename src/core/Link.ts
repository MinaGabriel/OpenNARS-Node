import { Budget } from "./nalCorePrimitives";
import { Concept } from "./Concept";
import { Item } from "./nalCorePrimitives";
import { Task } from "./nalCorePrimitives";
import { Term } from "./nalCorePrimitives";
import { LinkType } from "./Symbols";
import { Statement } from "./nalCorePrimitives";
import { Compound } from "./nalCorePrimitives";
import { Parameters } from "./Symbols";
import { MemoryStore } from "./Memory";
import { nanoid } from "nanoid";
import colors from "ansi-colors";
import _ from "lodash";

/**
 * Abstract Link class representing a relationship between terms/concepts/tasks.
 */
abstract class Link extends Item {
  protected _type?: LinkType;
  protected _index: number[] | null = null;
  protected terms: Term[] = [];

  constructor(
    public readonly source: Concept | Task,
    public readonly target: Task | Concept,
    budget: Budget,
    protected readonly copyBudget: boolean = true,
    protected readonly enableTransform: boolean = false
  ) {
    super(nanoid(8), budget);
    this.setType(this.enableTransform);
  }

  // Backward-compat convenience: some callers expect .key
  public get key(): string {
    // Item likely exposes a protected id; since Link extends Item we can forward it
    // If Item uses a different property name, adapt this getter accordingly.
    // @ts-ignore - assuming Item defines `id`
    return this.id as string;
  }

  get type(): LinkType | undefined {
    return this._type;
  }
  set type(value: LinkType | undefined) {
    this._type = value;
  }

  get index(): number[] | null {
    return this._index;
  }
  set index(value: number[] | null) {
    this._index = value;
  }

  /**
   * Determines the type of link based on the relationship between source and target terms.
   * Sets this.type and computes the path (terms, index) from target to source if nested.
   */
  protected setType(enableTransform: boolean = false): void {
    const termSource: Term =
      this.source instanceof Concept ? this.source.term : this.source.sentence.term;
    const termTarget: Term =
      this.target instanceof Concept ? this.target.term : this.target.sentence.term;

    const nestedResult = this.isTermNested(termSource, termTarget, []);

    if (nestedResult) {
      [this.terms, this.index] = nestedResult;
    } else {
      this.terms = [];
      this.index = null;
    }

    if (nestedResult) {
      // source is nested in target
      if (termTarget.identical(termSource)) {
        this.type = LinkType.SELF;
      }

      if (termTarget.isStatement()) {
        const statementTarget: Statement = termTarget as Statement;

        // If source and target are identical, it's a self-link
        if (termTarget.identical(termSource)) {
          this.type = LinkType.SELF;
          return;
        }

        // Check for transform links: parent of parent is statement, parent is compound, and connector is product or image
        if (this.terms.length >= 3 && enableTransform) {
          const parentParent: Term = this.terms[this.terms.length - 3];
          const parent: Term = this.terms[this.terms.length - 2];
          if (parentParent.isStatement() && parent.isCompound()) {
            if ((parent as Compound).connector.is_product_or_image) {
              this.type = LinkType.TRANSFORM;
              return;
            }
          }
        }

        // Higher-order copula: check if source is subject or predicate
        if (statementTarget.copula.isHigherOrder()) {
          if (
            termSource.equals(statementTarget.subject) ||
            termSource.equals(statementTarget.predicate)
          ) {
            this.type = LinkType.COMPONENT_CONDITION;
          } else {
            this.type = LinkType.COMPONENT_STATEMENT;
          }
        } else if (statementTarget.copula.isInheritanceOrSimilarity()) {
          this.type = LinkType.COMPONENT_STATEMENT;
        }
      } else if (termTarget.isCompound()) {
        this.type = LinkType.COMPOUND;
      }
    } else {
      // source is not nested in target
      // 1. if source is statement :
      //      1.1 copula is higher order :   "==>", "<=>", "=/>", "=|>", "=
      //          1.1.1 source and target are identical --> COMPOUND_STATEMENT
      //          1.1.2 source and target are not identical --> COMPOUND_CONDITION
      //      1.2 copula is inheritance or similarity --> COMPONENT_STATEMENT
      // 2. if source is compound --> COMPOUND
      // 3. none.

      if (termSource.isStatement()) {
        const statementSource: Statement = termSource as Statement;
        if (statementSource.copula.isHigherOrder()) {
          if (termTarget.identical(termSource)) {
            this.type = LinkType.COMPOUND_STATEMENT;
          } else {
            this.type = LinkType.COMPOUND_CONDITION;
          }
        } else if (statementSource.copula.isInheritanceOrSimilarity()) {
          this.type = LinkType.COMPONENT_STATEMENT;
        }
      } else if (termSource.isCompound()) {
        this.type = LinkType.COMPOUND;
      }
    }
  }

  /**
   * Finds the path (terms and indices) from target to source if source is nested in target.
   * Returns [termsOnPath, indexPath] or null if not found.
   */
  protected isTermNested(
    source: Term,
    target: Term,
    terms: Term[] = [],
    path: number[] = []
  ): [Term[], number[]] | null {
    // If target is the source, return the path and terms
    if (target.identical(source)) return [[...terms, target], path];

    const children: Term[] = Array.from(target.terms);

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      // Recursively search for the source in child
      const result = this.isTermNested(source, child, [...terms, target], [...path, i]);
      if (result) return result;
    }
    return null; // not found in any path
  }
}

export { Link };

/* ----------------------------- TermLink ---------------------------------- */

class TermLink extends Link {
  constructor(source: Concept, target: Concept, budget: Budget) {
    super(source, target, budget, true, false);
  }

  toString(): string {
    const typeName =
      this.type !== undefined ? LinkType[this.type] : "";
    return `Term Link: ${colors.magenta(this.budget.toString())}  ${colors.magenta(
      this.source.name() + " --- " + this.target.name()
    )} ${colors.yellow(
      _.isArray(this.index) && this.index.length > 0 ? JSON.stringify(this.index) : ""
    )} ${typeName}`;
  }
}

export { TermLink };

/* ----------------------------- TaskLink ---------------------------------- */

// source: A and target: is the task <A --> (/, A, L)> .
class TaskLink extends Link {
  private lastSeenMap: Map<string, number> = new Map<string, number>();

  constructor(source: Concept, target: Task, budget: Budget) {
    super(source, target, budget, true, true);
    // console.log(`Task Link: ${colors.green(this.target.toString())} ${colors.yellow(_.isArray(this.index) && this.index.length > 0 ? JSON.stringify(this.index) : "")} ${LinkType[this.type as number] ?? ""}`);
  }

  toString(): string {
    const typeName =
      this.type !== undefined ? LinkType[this.type] : "";
    return `Task Link: ${colors.green(this.budget.toString())}  ${colors.green(
      this.source.name() + " --- " + this.target.name()
    )} ${colors.yellow(
      _.isArray(this.index) && this.index.length > 0 ? JSON.stringify(this.index) : ""
    )} ${typeName}`;
  }

  get task(): Task {
    return this.target as Task;
  }

  // If this term was used recently, it is not novel.
  // Cycle	    Input Task	    Link Seen Before?	    Novel?	            Action
  // 1	        <B --> C>.	    No	                    ✅ Yes	            Deduce <A --> C>, store
  // 2	        <B --> C>.	    Yes (too soon)	        ❌ No	            Skip — already processed
  // 10	        <B --> C>.	    Yes,but old now	        ✅ Yes	            Allow again, re-derive maybe
  public isNovel(termLink: TermLink): boolean {
    // TODO:: Need to have a set size of the map to remove the oldest seen term links

    const termLinkTargetTerm = (termLink.target as Concept).term;
    const taskLinkTargetTerm = (this.target as Task).term;

    // Use the Link.key (backed by Item id) as uniqueness token for the TermLink
    const key = termLink.key;

    const currentNarsClock = MemoryStore.getState().time.narsClock();
    const horizon = Parameters.TERM_LINK_RECORD_LENGTH;

    // Skip if the TermLink is the same as the TaskLink
    // Example: Task Link: <Task <<A-->B>==><B-->C>> .> [0,0] COMPONENT_STATEMENT
    // Example: Term Link: <Concept <<A-->B>==><B-->C>>> COMPONENT_STATEMENT
    if (termLinkTargetTerm.equals(taskLinkTargetTerm)) return false;

    const lastSeenTime = this.lastSeenMap.get(key);

    // Too recent, not novel (need to wait)
    if (lastSeenTime !== undefined && currentNarsClock < lastSeenTime + horizon) {
      return false;
    }

    // Novel, record it
    this.lastSeenMap.set(key, currentNarsClock);
    return true;
  }
}

export { TaskLink };
