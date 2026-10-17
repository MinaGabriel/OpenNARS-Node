// Question.ts
// A sentence that asks something. It has no truth value; instead it keeps
// the best answer found so far.
//
// Narsese examples:
//   <robin --> animal>?   yes/no question: "is a robin an animal?"
//                         answer: <robin --> animal>. %1.00;0.81%
//   <robin --> ?x>?       what-question: "what is a robin?"
//                         answers: <robin --> bird>, <robin --> animal>, ...
//
// For a yes/no question the better answer is the more confident one; for a
// what-question it is the one with higher expectation (book §4.4, choice).
// That comparison lives in the inference engine; this class just stores it.

import { Sentence, Punctuation } from "./Sentence";
import { Statement } from "./Statement";
import { Judgment } from "./Judgment";
import { EvidentialBase } from "./EvidentialBase";

export class Question extends Sentence {
  readonly punctuation: Punctuation = "?";

  /** Best answer found so far, or null. */
  solution: Judgment | null = null;

  constructor(statement: Statement, base: EvidentialBase) {
    super(statement, base);
  }

  hasVariable(): boolean {
    return this.statement.hasVariable();
  }

  toString(): string {
    return `${this.statement}?`;
  }
}
