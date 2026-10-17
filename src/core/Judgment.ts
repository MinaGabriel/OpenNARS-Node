// Judgment.ts
// A sentence that claims something, with a truth value saying how strongly.
//
// Narsese examples:
//   <robin --> bird>. %1.00;0.90%    "robins are birds" (sure, strong evidence)
//   <animal --> cute>. %0.70;0.90%   "animals are mostly cute"
//   <robin --> animal>. %1.00;0.81%  derived by deduction from the two above
//
// Frequency (first number) is how often the statement held in the evidence;
// confidence (second) is how much evidence there is.

import { Sentence, Punctuation } from "./Sentence";
import { Statement } from "./Statement";
import { Truth } from "./Truth";
import { EvidentialBase } from "./EvidentialBase";

export class Judgment extends Sentence {
  readonly punctuation: Punctuation = ".";

  constructor(statement: Statement, readonly truth: Truth, base: EvidentialBase) {
    super(statement, base);
    if (statement.hasVariable()) {
      throw new Error(`Judgment ${statement} contains a variable; variables are only allowed in questions`);
    }
  }

  getExpectation(): number {
    return this.truth.getExpectation();
  }

  toString(): string {
    return `${this.statement}. ${this.truth}`;
  }
}
