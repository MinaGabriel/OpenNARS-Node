// Statement.ts
// A relation between two terms, connected by the inheritance copula -->.
//
// Narsese examples:
//   <robin --> bird>      "robin is a kind of bird"
//   <dog --> cute>        "dogs are cute"
//   <robin --> ?x>        "robin is a kind of what?" (only inside a question)
//
// Mini-NARS has only one copula, so the statement is just the pair
// (subject, predicate). A statement says nothing about how true it is;
// that's the job of a Judgment, which adds a truth value.

import { Term } from "./Term";

export const COPULA = "-->";

export class Statement {
  constructor(readonly subject: Term, readonly predicate: Term) {
    if (subject.isVariable() && predicate.isVariable()) {
      throw new Error(`Statement ${this.name()} has two variables; at most one is allowed`);
    }
    if (subject.equals(predicate)) {
      throw new Error(`Statement ${this.name()} relates a term to itself`);
    }
  }

  /** Convenience constructor: Statement.of("robin", "bird") is <robin --> bird>. */
  static of(subject: string, predicate: string): Statement {
    return new Statement(new Term(subject), new Term(predicate));
  }

  hasVariable(): boolean {
    return this.subject.isVariable() || this.predicate.isVariable();
  }

  equals(other: Statement): boolean {
    return this.subject.equals(other.subject) && this.predicate.equals(other.predicate);
  }

  name(): string {
    return `<${this.subject} ${COPULA} ${this.predicate}>`;
  }

  toString(): string {
    return this.name();
  }
}
