// Term.ts
// The smallest unit of meaning: a single word, or a query variable.
//
// Narsese examples:
//   robin, bird, animal, cute     constant terms (words)
//   ?x, ?                         query variables, used only in questions:
//                                 <robin --> ?x>?  "what is a robin?"
//
// In Mini-NARS a term has no internal structure (no compound terms), so it
// is identified by its text alone.

const WORD = /^[\p{L}\p{N}_-]+$/u;
const VARIABLE = /^\?[\p{L}\p{N}_]*$/u;

export class Term {
  constructor(readonly word: string) {
    if (!WORD.test(word) && !VARIABLE.test(word)) {
      throw new Error(`Invalid term "${word}": use a single word, or ? / ?x for a query variable`);
    }
  }

  /** A query variable term, e.g. Term.variable("x") is ?x. */
  static variable(name: string = ""): Term {
    return new Term(`?${name}`);
  }

  isVariable(): boolean {
    return this.word.startsWith("?");
  }

  equals(other: Term): boolean {
    return this.word === other.word;
  }

  name(): string {
    return this.word;
  }

  toString(): string {
    return this.word;
  }
}
