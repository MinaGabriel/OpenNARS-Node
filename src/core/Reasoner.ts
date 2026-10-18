// Reasoner.ts
// Mini-NARS as a whole (book §4.3): a memory and a buffer exchanging tasks.
//
// Each working cycle:
//   1. memory fires one concept; derived tasks go into the buffer
//   2. the buffer sends its top tasks into memory
//
// Example session (book §4.6):
//   <bird --> animal>. %1.0;0.9%
//   <robin --> bird>. %1.0;0.9%
//   2                                 ← run 2 cycles
//   <robin --> animal>?
//   OUT: <robin --> animal>. %1.00;0.81%

import { Memory } from "./Memory";
import { Buffer } from "./Buffer";
import { Task, TaskSource } from "./Task";
import { NarseseParser } from "./NarseseParser";
import { Answer } from "./InferenceEngine";

export interface AnswerEvent extends Answer {
  /** The cycle in which the answer was found. */
  readonly cycle: number;
}

export interface CycleReport {
  /** Answers to input questions that improved during the cycles. */
  readonly answers: AnswerEvent[];
  /** Every task derived during the cycles. */
  readonly derived: Task[];
}

export class Reasoner {
  readonly memory = new Memory();
  readonly buffer = new Buffer();
  readonly parser = new NarseseParser();
  private _clock = 0;

  /** Number of cycles run so far. */
  get clock(): number { return this._clock; }

  /** Adds an input task directly to memory and returns true. */
  input(task: Task): boolean {
    // User input goes straight to memory: in the buffer it could be dropped when the buffer is
    // full of derived tasks, or merged into a derived task with the same key and lose its source.
    this.memory.addTask(task);
    return true;
  }

  /** Parses a Narsese line and adds it. Throws NarseseError on invalid input. */
  inputNarsese(text: string, source: Exclude<TaskSource, "derived"> = "user"): Task {
    const task = this.parser.parse(text, source);
    this.input(task);
    return task;
  }

  /** Runs n working cycles. */
  run(n: number = 1): CycleReport {
    const report: CycleReport = { answers: [], derived: [] };
    for (let i = 0; i < n; i++) {
      this._clock++;
      const result = this.memory.cycle();
      for (const task of result.derived) {
        this.buffer.add(task);
        report.derived.push(task);
      }
      for (const a of result.answers) {
        if (a.question.isInput()) report.answers.push({ ...a, cycle: this._clock });
      }
      for (const task of this.buffer.takeTop()) this.memory.addTask(task);
    }
    return report;
  }
}
