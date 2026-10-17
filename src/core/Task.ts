// Task.ts
// A sentence the system is working on, plus a priority saying how much
// attention it deserves. Tasks are what move through the buffer and sit in
// a concept's taskBag.
//
// Narsese examples (priority in $...$):
//   $0.80$ <robin --> bird>. %1.00;0.90%    input judgment, from the user
//   $0.90$ <robin --> animal>?              input question, from the user
//   $0.45$ <bird --> animal>?               derived question (backward inference)
//
// Every task records where it came from:
//   source      "user" or "llm" for input, "derived" for inference results
//   derivation  for derived tasks: the rule and the premises that produced it,
//               which is what lets an answer be traced back to its inputs.

import { Item } from "./Item";
import { Judgment } from "./Judgment";
import { Question } from "./Question";
import { Statement } from "./Statement";

export type TaskSource = "user" | "llm" | "derived";

export interface Derivation {
  /** Inference rule name, e.g. "deduction", "revision", "backward". */
  readonly rule: string;
  /** The task that was being processed. */
  readonly task: Task;
  /** The task whose judgment served as the belief premise, if any. */
  readonly belief: Task | null;
}

export class Task extends Item {
  constructor(
    readonly sentence: Judgment | Question,
    priority: number,
    readonly source: TaskSource,
    readonly derivation: Derivation | null = null
  ) {
    super(Task.makeKey(sentence), priority);
    if ((source === "derived") !== (derivation !== null)) {
      throw new Error(`Task ${sentence}: derived tasks need a derivation, input tasks must not have one`);
    }
  }

  /**
   * Bag key (book §4.2): the content, plus the evidential base for judgments,
   * so two judgments on the same statement from different evidence stay separate.
   */
  private static makeKey(sentence: Judgment | Question): string {
    return sentence instanceof Judgment
      ? `${sentence.statement.name()}. ${sentence.base}`
      : `${sentence.statement.name()}?`;
  }

  get statement(): Statement {
    return this.sentence.statement;
  }

  isJudgment(): this is Task & { sentence: Judgment } {
    return this.sentence instanceof Judgment;
  }

  isQuestion(): this is Task & { sentence: Question } {
    return this.sentence instanceof Question;
  }

  isInput(): boolean {
    return this.source !== "derived";
  }

  override toString(): string {
    return `$${this.priority.toFixed(2)}$ ${this.sentence}`;
  }
}
