// Belief.ts
// Narsese example: the belief on <dog --> cute> might hold
//   %0.80;0.95%  {3,4,5}   revised from the two below
//   %0.90;0.90%  {5}       the user said so directly
//   %0.70;0.57%  {3,4}     derived: <dog --> animal>, <animal --> cute>
//
// A belief is a bundle of judgments on the same statement whose truth values
// come from different fragments of experience (book §4.2). It keeps a small
// priority queue of truth values, where each entry's priority is its
// confidence. The belief itself is an Item with a priority, stored in a
// concept's beliefBag under the statement's name.

import { Item } from "./Item";
import { Truth } from "./Truth";
import { EvidentialBase } from "./EvidentialBase";
import type { Statement } from "./Statement";
import type { Task } from "./Task";

export const BELIEF_CAPACITY = 4; // m in the book

/** One truth value in a belief, with the evidence it was derived from. */
export interface TruthEntry {
  readonly truth: Truth;
  readonly base: EvidentialBase;
  /** The task this truth value came from; used for tracing answers. */
  readonly origin?: Task;
}

export class Belief extends Item {
  private entries: TruthEntry[] = [];

  constructor(readonly statement: Statement, first: TruthEntry, priority: number) {
    super(statement.name(), priority);
    this.add(first);
  }

  /** Book §4.3: a judgment task entering a concept also creates a belief with its priority. */
  static fromTask(task: Task): Belief {
    if (!task.isJudgment()) throw new Error(`Only a judgment can become a belief: ${task.sentence}`);
    const { statement, truth, base } = task.sentence;
    return new Belief(statement, { truth, base, origin: task }, task.priority);
  }

  /** Entries ordered by confidence, highest first. */
  get truthEntries(): readonly TruthEntry[] {
    return this.entries;
  }

  /** The most confident entry; used when reporting the belief. */
  best(): TruthEntry {
    return this.entries[0];
  }

  /**
   * Adds a truth value. An entry with the same evidence replaces the existing
   * one only if it is more confident. When the queue is over capacity, the
   * least confident entry is dropped. Returns true if the entry was kept.
   */
  add(entry: TruthEntry): boolean {
    const sameEvidence = this.entries.findIndex(e => e.base.equals(entry.base));
    if (sameEvidence >= 0) {
      if (this.entries[sameEvidence].truth.getConfidence() >= entry.truth.getConfidence()) return false;
      this.entries.splice(sameEvidence, 1);
    }

    const at = this.entries.findIndex(e => e.truth.getConfidence() < entry.truth.getConfidence());
    this.entries.splice(at < 0 ? this.entries.length : at, 0, entry);

    if (this.entries.length > BELIEF_CAPACITY) this.entries.pop();
    return this.entries.includes(entry);
  }

  /**
   * The most confident entry whose evidence is independent of the task's
   * (book §4.3, selectTruth). Returns null if every entry overlaps, which
   * means this belief can't be combined with the task without double counting.
   */
  selectTruth(taskBase: EvidentialBase): TruthEntry | null {
    return this.entries.find(e => !EvidentialBase.overlaps(e.base, taskBase)) ?? null;
  }

  /** Bag merge: absorb the other belief's truth values, then combine priorities. */
  override merge(other: Item): void {
    if (other instanceof Belief) {
      for (const entry of other.entries) this.add(entry);
    }
    super.merge(other);
  }

  override toString(): string {
    return `${this.statement.name()}. ${this.best().truth}`;
  }
}
