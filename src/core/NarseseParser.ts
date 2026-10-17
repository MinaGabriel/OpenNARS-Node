// NarseseParser.ts
// Turns a line of Narsese text into a Task, ready to go into the buffer.
//
//   parser.parse("<robin --> bird>. %1.0;0.9%")
//     → $0.80$ <robin --> bird>. %1.00;0.90%     (serial 1, source "user")
//   parser.parse("<robin --> ?x>?")
//     → $0.90$ <robin --> ?x>?                     (serial 2, source "user")
//
// It also gives every input its serial number, which becomes its evidential
// base. Serials count up from 1 per parser, so a run is reproducible.
// (This replaces NarseseChannel.ts.)

import { parse, SyntaxError as GrammarError, ParsedTask } from "./narsese_grammar";
import { Term } from "./Term";
import { Statement } from "./Statement";
import { Judgment } from "./Judgment";
import { Question } from "./Question";
import { Task, TaskSource } from "./Task";
import { Truth } from "./Truth";
import { EvidentialBase } from "./EvidentialBase";

/** Defaults for omitted values (book §4.6). */
export const DEFAULTS = {
  frequency: 1.0,
  confidence: 0.9,
  judgmentPriority: 0.8,
  questionPriority: 0.9,
} as const;

export class NarseseError extends Error {
  constructor(readonly input: string, message: string, readonly column?: number) {
    super(column === undefined ? message : `${message} (column ${column})`);
  }
}

export class NarseseParser {
  private serial = 0;

  /** Parses one input line. Throws NarseseError if the line isn't valid Narsese. */
  parse(input: string, source: Exclude<TaskSource, "derived"> = "user"): Task {
    const parsed = this.parseText(input);
    const statement = new Statement(new Term(parsed.subject), new Term(parsed.predicate));
    const base = EvidentialBase.fromInput(++this.serial);

    if (parsed.kind === "question") {
      return new Task(new Question(statement, base), parsed.priority ?? DEFAULTS.questionPriority, source);
    }

    const truth = new Truth(
      parsed.truth?.frequency ?? DEFAULTS.frequency,
      parsed.truth?.confidence ?? DEFAULTS.confidence
    );
    return new Task(new Judgment(statement, truth, base), parsed.priority ?? DEFAULTS.judgmentPriority, source);
  }

  /** Serial number of the most recent input (0 if nothing has been parsed). */
  get lastSerial(): number {
    return this.serial;
  }

  private parseText(input: string): ParsedTask {
    try {
      return parse(input);
    } catch (error) {
      if (error instanceof GrammarError) {
        throw new NarseseError(input, error.message, error.location.start.column);
      }
      throw new NarseseError(input, error instanceof Error ? error.message : String(error));
    }
  }
}
