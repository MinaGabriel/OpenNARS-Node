// EvidentialBase.ts
// Leaf module. Replaces Stamp for Mini-NARS: no tense, no occurrence time,
// no creation time, just the serial numbers of the input tasks a sentence's
// evidence comes from (book §4.2, "eBase").

export const MAX_BASE_LENGTH = 8; // b in the book

export class EvidentialBase {
  private readonly serials: readonly number[];

  private constructor(serials: number[]) {
    this.serials = serials.slice(0, MAX_BASE_LENGTH);
  }

  /** Base of an input task: a single serial number. */
  static fromInput(serial: number): EvidentialBase {
    return new EvidentialBase([serial]);
  }

  /**
   * Base of a derived sentence: the two premise bases interleaved
   * (a1, b1, a2, b2, ...), truncated to MAX_BASE_LENGTH so the most
   * recent evidence from both premises is kept.
   */
  static merge(a: EvidentialBase, b: EvidentialBase): EvidentialBase {
    const merged: number[] = [];
    const longest = Math.max(a.serials.length, b.serials.length);
    for (let i = 0; i < longest; i++) {
      if (i < a.serials.length) merged.push(a.serials[i]);
      if (i < b.serials.length) merged.push(b.serials[i]);
    }
    return new EvidentialBase([...new Set(merged)]);
  }

  /** True if the two bases share any evidence (the premises aren't independent). */
  static overlaps(a: EvidentialBase, b: EvidentialBase): boolean {
    const set = new Set(a.serials);
    return b.serials.some(s => set.has(s));
  }

  /** An input task has exactly one serial; derived tasks have more. */
  isInput(): boolean { return this.serials.length === 1; }

  toArray(): number[] { return [...this.serials]; }

  /** Same evidence, regardless of order. */
  equals(other: EvidentialBase): boolean {
    if (this.serials.length !== other.serials.length) return false;
    const set = new Set(this.serials);
    return other.serials.every(s => set.has(s));
  }

  /** Order-independent identity of the evidence: {2,1} and {1,2} give the same key. */
  key(): string { return [...this.serials].sort((a, b) => a - b).join(","); }

  toString(): string { return `{${this.serials.join(",")}}`; }
}
