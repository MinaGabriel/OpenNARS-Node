// Sentence.ts
// What the system says or is told: a statement plus punctuation and the
// evidence it rests on. Two kinds exist in Mini-NARS:
//
//   <robin --> bird>. %1.00;0.90%    Judgment  (claims something, has a truth value)
//   <robin --> bird>?                Question  (asks something, no truth value)
//
// Every sentence carries an evidential base: the serial numbers of the input
// sentences it comes from. Input sentences have one serial; derived ones
// have the merged serials of their premises.

import { Statement } from "./Statement";
import { EvidentialBase } from "./EvidentialBase";

export type Punctuation = "." | "?";

export abstract class Sentence {
  protected constructor(readonly statement: Statement, readonly base: EvidentialBase) {}

  abstract readonly punctuation: Punctuation;

  /** An input sentence came directly from outside (one serial in its base). */
  isInput(): boolean {
    return this.base.isInput();
  }

  abstract toString(): string;
}
