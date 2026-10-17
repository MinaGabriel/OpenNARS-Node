// Concept.ts
// Everything the system knows and is working on about one term (book §1.2, §4.2).
// A concept is a node in the memory graph: its tasks and beliefs are the
// edges to other concepts.
//
// Example: concept "bird" after two inputs
//   taskBag:    <robin --> bird>.  <bird --> animal>.
//   beliefBag:  <robin --> bird> %1.00;0.90%   <bird --> animal> %1.00;0.90%
// Firing it can pair <bird --> animal> with <robin --> bird> and derive
// <robin --> animal> by deduction: "bird" is the shared term.

import { Item } from "./Item";
import { Bag } from "./Bag";
import { Task } from "./Task";
import { Term } from "./Term";
import { Belief } from "./Belief";
import { Judgment } from "./Judgment";
import { Question } from "./Question";
import { PriorityFunc } from "./PriorityFunc";
import { inference, InferenceResult, emptyResult } from "./InferenceEngine";
import { c, bar, pad, visible, sourceColor } from "./Colors";

// Bag sizes as levels × bucket capacity (book §4.2)
export const TASK_BAG = { levels: 10, bucket: 3 };
export const BELIEF_BAG = { levels: 100, bucket: 5 };

const NEW_CONCEPT_PRIORITY = 0.01;

/** Highest priority first, without changing the original array. */
const byPriority = <T extends Item>(items: readonly T[]): T[] => [...items].sort((a, b) => b.priority - a.priority);

export class Concept extends Item {
  readonly taskBag = new Bag<Task>(TASK_BAG.levels, TASK_BAG.bucket);
  readonly beliefBag = new Bag<Belief>(BELIEF_BAG.levels, BELIEF_BAG.bucket);

  constructor(readonly term: Term) {
    super(term.name(), NEW_CONCEPT_PRIORITY);
  }

  /** Book §4.3, newTask: store the task, turn a judgment into a belief, and activate. */
  addTask(task: Task): void {
    this.taskBag.put(task);
    if (task.isJudgment()) this.beliefBag.put(Belief.fromTask(task));
    PriorityFunc.activate(this, task.priority);
  }

  /** Book §4.3, fire: one inference step between a selected task and a selected belief. */
  fire(): InferenceResult {
    const task = this.taskBag.select();
    if (!task) return emptyResult();

    let result = emptyResult();
    const belief = this.beliefBag.select();
    if (belief) {
      const entry = belief.selectTruth(task.sentence.base);
      if (entry) result = inference(task, entry, belief);
      this.beliefBag.putBack(belief);
    }
    this.taskBag.putBack(task);
    return result;
  }

  /** Prints this concept in the same table layout as printAll. */
  print(): void {
    Concept.printAll([this]);
  }

  /**
   * Prints concepts as one table: each concept is a group of rows, its tasks
   * first, then its beliefs. A belief with several truth values gets one row
   * per value, best first.
   *
   *  #  concept           bag     priority         statement            truth / answer  evidence  source
   *  1  animal ████ 0.92  task    ██████████ 0.96  <robin --> animal>.  %1.00;0.81%     {1,2}     derived deduction
   *                       task    ██░░░░░░░░ 0.16  <robin --> animal>?  → %1.00;0.81%   {3}       user
   *                       belief  ██████████ 0.98  <bird --> animal>    %1.00;0.90%     {1}
   */
  static printAll(concepts: readonly Concept[]): void {
    if (concepts.length === 0) {
      console.log(`  ${c.dim}(no concepts)${c.reset}`);
      return;
    }

    const header = ["#", "concept", "bag", "priority", "statement", "truth / answer", "evidence", "source"];
    const groups = byPriority(concepts).map((concept, i) => concept.rows(i + 1));
    const all = [header, ...groups.flat()];
    const widths = header.map((_, col) => Math.max(...all.map(row => visible(row[col] ?? ""))));
    const line = (cells: string[]) => "  " + cells.map((cell, col) => pad(cell, widths[col])).join("  ");
    const rule = c.gray + "  " + widths.map(w => "─".repeat(w)).join("──") + c.reset;

    console.log(`${c.bold}MEMORY${c.reset} ${c.dim}${concepts.length} concepts${c.reset}`);
    console.log(c.dim + line(header) + c.reset);
    for (const group of groups) {
      console.log(rule);
      for (const row of group) console.log(line(row));
    }
    console.log(rule);
  }

  /** Table rows for this concept: tasks, then beliefs. Only the first row names the concept. */
  private rows(index: number): string[][] {
    const rows: string[][] = [];
    const first = [`${c.dim}${index}${c.reset}`, `${c.bold}${c.cyan}${this.term}${c.reset} ${bar(this.priority)} ${this.priority.toFixed(2)}`];
    const lead = () => (rows.length === 0 ? first : ["", ""]);

    for (const t of byPriority(this.taskBag.toArray())) {
      const kind = t.isJudgment() ? `${c.blue}task J${c.reset}` : `${c.magenta}task Q${c.reset}`;
      rows.push([...lead(), kind, `${bar(t.priority)} ${t.priority.toFixed(2)}`,
      `${t.statement.name()}${t.isJudgment() ? "." : "?"}`, Concept.truthOrAnswer(t),
      `${c.gray}${t.sentence.base}${c.reset}`,
      `${sourceColor[t.source]}${t.source}${c.reset}${t.derivation ? ` ${c.dim}${t.derivation.rule}${c.reset}` : ""}`]);
    }

    for (const b of byPriority(this.beliefBag.toArray())) {
      b.truthEntries.forEach((e, i) => {
        const best = i === 0;
        const origin = e.origin ? `${sourceColor[e.origin.source]}${e.origin.source}${c.reset}` +
          (e.origin.derivation ? ` ${c.dim}${e.origin.derivation.rule}${c.reset}` : "") : "";
        rows.push([...lead(),
        best ? `${c.green}belief${c.reset}` : "",
        best ? `${bar(b.priority)} ${b.priority.toFixed(2)}` : "",
        best ? b.statement.name() : `${c.dim}  also${c.reset}`,
        `${best ? c.green : c.dim}${e.truth}${c.reset}`,
        `${c.gray}${e.base}${c.reset}`, origin]);
      });
    }

    if (rows.length === 0) rows.push([...first, `${c.dim}(empty)${c.reset}`, "", "", "", "", ""]);
    return rows;
  }

  private static truthOrAnswer(t: Task): string {
    if (t.sentence instanceof Judgment) return `${c.green}${t.sentence.truth}${c.reset}`;
    const solution = (t.sentence as Question).solution;
    return solution ? `${c.green}→ ${solution.truth}${c.reset}` : `${c.dim}unanswered${c.reset}`;
  }

  override toString(): string {
    return `${this.term} $${this.priority.toFixed(2)}$`;
  }
}