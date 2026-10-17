// Truth.ts
// Leaf module: imports nothing from the rest of src/core, so it can be
// tested on its own and can't be pulled into a circular import.
//
// Reference: Wang, "Designing a Mind — The Implementations of NARS",
// Appendix B, Tables B.1 and B.13.

export const EVIDENTIAL_HORIZON = 1;   // k
const MAX_CONFIDENCE = 0.9999;         // keeps c < 1 so c2w never divides by zero

/* ────────────────────────────── ShortFloat ────────────────────────────── */

/** A number in [0, 1] stored with 4-digit precision (as an integer 0..10000). */
export class ShortFloat {
  private value: number;

  constructor(v: number) {
    this.value = ShortFloat.toShort(v);
  }

  private static toShort(v: number): number {
    if (!Number.isFinite(v) || v < 0 || v > 1) {
      throw new Error(`Invalid value: ${v}. Value must be a finite number in [0, 1]`);
    }
    return Math.round(v * 10000);
  }

  getValue(): number { return this.value / 10000; }
  toNumber(): number { return this.getValue(); }
  getShortValue(): number { return this.value; }
  setValue(v: number): void { this.value = ShortFloat.toShort(v); }
  equals(that: unknown): boolean {
    return that instanceof ShortFloat && this.value === that.getShortValue();
  }
  toString(): string { return this.getValue().toFixed(4); }
  toStringTwoDigits(): string { return this.getValue().toFixed(2); }
}

/* ──────────────────────────────── Truth ───────────────────────────────── */

export class Truth {
  readonly frequency: ShortFloat;
  readonly confidence: ShortFloat;

  constructor(
    f: number | ShortFloat,
    c: number | ShortFloat,
    readonly k: number = EVIDENTIAL_HORIZON
  ) {
    const fNum = typeof f === "number" ? f : f.getValue();
    const cNum = typeof c === "number" ? c : c.getValue();
    this.frequency = new ShortFloat(fNum);
    this.confidence = new ShortFloat(Math.min(cNum, MAX_CONFIDENCE));
  }

  getFrequency(): number { return this.frequency.getValue(); }
  getConfidence(): number { return this.confidence.getValue(); }

  /** e = c(f − 0.5) + 0.5 */
  getExpectation(): number {
    return this.getConfidence() * (this.getFrequency() - 0.5) + 0.5;
  }

  getExpDifAbs(e: number): number { return Math.abs(e - this.getExpectation()); }
  getExpDifAbsFromTruth(t: Truth): number { return this.getExpDifAbs(t.getExpectation()); }

  equals(that: unknown): boolean {
    return that instanceof Truth
      && this.frequency.equals(that.frequency)
      && this.confidence.equals(that.confidence);
  }

  name(): string { return this.toString(); }

  /** Same format as the book's output, e.g. %1.00;0.81% */
  toString(): string {
    return `%${this.getFrequency().toFixed(2)};${this.getConfidence().toFixed(2)}%`;
  }
}

/* ─────────────────────────── Truth functions ──────────────────────────── */

const and = (...xs: number[]): number => xs.reduce((acc, x) => acc * x, 1);

/**
 * NAL truth-value functions (Table B.13).
 *
 * Two-premise functions take (J1, J2) in the order of Table B.1, where J1 is
 * the column premise and J2 the row premise. Each returns the truth of the
 * conclusion S → P:
 *
 *   deduction       J1: M → P   J2: S → M   ⊢ S → P
 *   abduction       J1: P → M   J2: S → M   ⊢ S → P
 *   induction       J1: M → P   J2: M → S   ⊢ S → P
 *   exemplification J1: P → M   J2: M → S   ⊢ S → P
 *
 * A primed function F′ is F with the premises switched: F′(J1, J2) = F(J2, J1).
 * It gives the truth of the reversed conclusion P → S.
 *
 * The syllogistic functions return null when the premises provide no
 * evidence (confidence 0). The inference engine should drop such conclusions.
 */
export class TruthFunctions {
  static c2w(c: number, k: number = EVIDENTIAL_HORIZON): number {
    return (k * c) / (1 - c);
  }

  static w2c(w: number, k: number = EVIDENTIAL_HORIZON): number {
    return w / (w + k);
  }

  /** Builds a truth value from evidence weights; null if there is no evidence. */
  static fromWeights(wPlus: number, w: number, k: number = EVIDENTIAL_HORIZON): Truth | null {
    if (w <= 0) return null;
    return new Truth(wPlus / w, TruthFunctions.w2c(w, k), k);
  }

  /** Revision: w+ = w1+ + w2+, w− = w1− + w2− */
  static revision(t1: Truth, t2: Truth): Truth {
    const k = t1.k;
    const w1 = TruthFunctions.c2w(t1.getConfidence(), k);
    const w2 = TruthFunctions.c2w(t2.getConfidence(), k);
    const wPlus = t1.getFrequency() * w1 + t2.getFrequency() * w2;
    return TruthFunctions.fromWeights(wPlus, w1 + w2, k)!;
  }

  /** Deduction: f = and(f1, f2), c = and(f1, f2, c1, c2) */
  static deduction(t1: Truth, t2: Truth): Truth | null {
    const f = and(t1.getFrequency(), t2.getFrequency());
    const c = and(f, t1.getConfidence(), t2.getConfidence());
    return c > 0 ? new Truth(f, c, t1.k) : null;
  }

  /** Abduction: w+ = and(f1, f2, c1, c2), w = and(f1, c1, c2) */
  static abduction(t1: Truth, t2: Truth): Truth | null {
    const [f1, c1, f2, c2] = TruthFunctions.unpack(t1, t2);
    return TruthFunctions.fromWeights(and(f1, f2, c1, c2), and(f1, c1, c2), t1.k);
  }

  /** Induction: w+ = and(f1, f2, c1, c2), w = and(f2, c1, c2) */
  static induction(t1: Truth, t2: Truth): Truth | null {
    const [f1, c1, f2, c2] = TruthFunctions.unpack(t1, t2);
    return TruthFunctions.fromWeights(and(f1, f2, c1, c2), and(f2, c1, c2), t1.k);
  }

  /** Exemplification: w+ = w = and(f1, f2, c1, c2) */
  static exemplification(t1: Truth, t2: Truth): Truth | null {
    const [f1, c1, f2, c2] = TruthFunctions.unpack(t1, t2);
    const w = and(f1, f2, c1, c2);
    return TruthFunctions.fromWeights(w, w, t1.k);
  }

  private static unpack(t1: Truth, t2: Truth): [number, number, number, number] {
    return [t1.getFrequency(), t1.getConfidence(), t2.getFrequency(), t2.getConfidence()];
  }
}