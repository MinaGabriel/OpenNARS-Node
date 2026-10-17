// narsese_grammar.d.ts
// Types for the parser that peggy generates from narsese_grammar.pegjs.

export interface ParsedTruth {
  frequency: number;
  /** null when the input gave only a frequency, e.g. %0.8% */
  confidence: number | null;
}

export interface ParsedTask {
  kind: "judgment" | "question";
  subject: string;
  predicate: string;
  /** null for questions, and for judgments written without a truth value */
  truth: ParsedTruth | null;
  /** null when the input gave no $...$ priority */
  priority: number | null;
}

export function parse(input: string): ParsedTask;

export class SyntaxError extends Error {
  location: { start: { offset: number; line: number; column: number } };
}
