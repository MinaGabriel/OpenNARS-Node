// Buffer.ts
// The waiting room for tasks (book §4.2–4.3). Input tasks and derived tasks
// both land here first. It is a small priority queue: when it is full, the
// lowest-priority task is dropped.
//
// Each cycle, the top few tasks leave the buffer and are sent to memory,
// once to the concept of the subject and once to the concept of the predicate:
//   <robin --> bird>. goes to concept "robin" and concept "bird".

import { Task } from "./Task";

export const BUFFER_CAPACITY = 10;
export const TASKS_PER_CYCLE = 2;

export class Buffer {
  private tasks: Task[] = [];

  constructor(readonly capacity: number = BUFFER_CAPACITY) {}

  get size(): number { return this.tasks.length; }

  /** Adds a task, merging with a waiting task that has the same key. Returns false if it was dropped. */
  add(task: Task): boolean {
    const same = this.tasks.findIndex(t => t.key === task.key);
    if (same >= 0) {
      const [existing] = this.tasks.splice(same, 1);
      existing.merge(task);
      task = existing;
    }
    const at = this.tasks.findIndex(t => t.priority < task.priority);
    this.tasks.splice(at < 0 ? this.tasks.length : at, 0, task);
    if (this.tasks.length > this.capacity) this.tasks.pop();
    return this.tasks.includes(task);
  }

  /** Removes and returns up to n of the highest-priority tasks. */
  takeTop(n: number = TASKS_PER_CYCLE): Task[] {
    return this.tasks.splice(0, n);
  }

  toArray(): readonly Task[] {
    return this.tasks;
  }
  /** Prints the buffer as a colored table, highest priority first. */
  print(): void {
    const c = { reset: "\x1b[0m", dim: "\x1b[2m", bold: "\x1b[1m", cyan: "\x1b[36m", green: "\x1b[32m",
      yellow: "\x1b[33m", magenta: "\x1b[35m", blue: "\x1b[34m", gray: "\x1b[90m" };
    const bar = (p: number) => { const n = Math.round(p * 10); return c.green + "█".repeat(n) + c.gray + "░".repeat(10 - n) + c.reset; };
    const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - s.length));
    const sourceColor = { user: c.cyan, llm: c.magenta, derived: c.yellow };

    console.log(`${c.bold}BUFFER${c.reset} ${c.dim}${this.tasks.length}/${this.capacity} waiting${c.reset}`);
    if (this.tasks.length === 0) return console.log(`  ${c.dim}(empty)${c.reset}`);

    const width = Math.max(...this.tasks.map(t => t.statement.name().length));
    this.tasks.forEach((t, i) => {
      const kind = t.isJudgment() ? `${c.blue}J${c.reset}` : `${c.magenta}Q${c.reset}`;
      const truth = t.isJudgment() ? `${c.green}${t.sentence.truth}${c.reset}` : `${c.dim}${pad("—", 11)}${c.reset}`;
      const rule = t.derivation ? ` ${c.dim}${t.derivation.rule}${c.reset}` : "";
      console.log(`  ${c.dim}${String(i + 1).padStart(2)}${c.reset}  ${bar(t.priority)} ${t.priority.toFixed(2)}  ${kind}  ` +
        `${pad(t.statement.name(), width)}  ${truth}  ${c.gray}${pad(t.sentence.base.toString(), 9)}${c.reset}  ` +
        `${sourceColor[t.source]}${t.source}${c.reset}${rule}`);
    });
  }
}
