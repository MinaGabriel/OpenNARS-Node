// InferenceEngine.ts
// One inference step: a task meets a belief, and new tasks come out
// (book §4.4). Which rule applies depends on two things:
//
//                         same statement        different statements (one shared term)
//   task is a judgment    revision              forward syllogism
//   task is a question    choice (answering)    backward syllogism
//
// Examples:
//   revision   <robin --> bird>. %1;0.9% {1}  +  <robin --> bird>. %0;0.9% {2}
//              ⊢ <robin --> bird>. %0.50;0.95% {1,2}
//   choice     <robin --> animal>?  +  <robin --> animal>. %1;0.81%   → answer
//   forward    <bird --> animal>. + <robin --> bird>.  ⊢ <robin --> animal>. (deduction)
//   backward   <robin --> animal>? + <robin --> bird>. ⊢ <bird --> animal>?
//              ("to answer the question, find out whether birds are animals")
//
// The engine is a set of pure functions: it reads the premises, adjusts
// their priorities (feedback), and returns the derived tasks and answers.
// It stores nothing.

import { Task } from "./Task";
import { Term } from "./Term";
import { Statement } from "./Statement";
import { Judgment } from "./Judgment";
import { Question } from "./Question";
import { Belief, TruthEntry } from "./Belief";
import { Truth, TruthFunctions as TF } from "./Truth";
import { EvidentialBase } from "./EvidentialBase";
import { PriorityFunc } from "./PriorityFunc";

export interface Answer {
  /** The question that got a better answer. */
  readonly question: Task;
  readonly answer: Judgment;
  /** The task the answer's truth value came from, for tracing. */
  readonly from: Task | null;
}

export interface InferenceResult {
  readonly derived: Task[];
  readonly answers: Answer[];
}

export const emptyResult = (): InferenceResult => ({ derived: [], answers: [] });

/** Where the shared term sits (book §4.4, getFigure). */
export type Figure = 1 | 2 | 3 | 4;

/** Entry point: one step with a task, one truth value of a belief, and the belief itself. */
export function inference(task: Task, entry: TruthEntry, belief: Belief): InferenceResult {
  const premises: Premises = {
    task,
    belief,
    judgment: new Judgment(belief.statement, entry.truth, entry.base),
    beliefTask: entry.origin ?? null,
  };

  if (match(task.statement, belief.statement)) {
    return task.isQuestion() ? choice(premises) : revise(premises);
  }
  return task.isQuestion() ? backward(premises) : forward(premises);
}

/* ─────────────────────────────── Matching ─────────────────────────────── */

/** Two terms match if they are equal, or the task's term is a variable. */
export function termMatch(taskTerm: Term, beliefTerm: Term): boolean {
  return taskTerm.isVariable() || taskTerm.equals(beliefTerm);
}

/** Same statement, allowing a variable in the task: <robin --> ?x> matches <robin --> bird>. */
export function match(sT: Statement, sB: Statement): boolean {
  return termMatch(sT.subject, sB.subject) && termMatch(sT.predicate, sB.predicate);
}

/**
 * Figure of a task–belief pair, by the position of the shared term M:
 *   1: T = <M --> P>, B = <S --> M>      3: T = <M --> P>, B = <M --> S>
 *   2: T = <S --> M>, B = <P --> M>      4: T = <S --> M>, B = <M --> P>
 * The shared term must be a real term, not a variable. Null if no figure applies.
 */
export function getFigure(sT: Statement, sB: Statement): Figure | null {
  if (sT.subject.equals(sB.predicate) && !termMatch(sT.predicate, sB.subject)) return 1;
  if (sT.predicate.equals(sB.predicate) && !termMatch(sT.subject, sB.subject)) return 2;
  if (sT.subject.equals(sB.subject) && !termMatch(sT.predicate, sB.predicate)) return 3;
  if (sT.predicate.equals(sB.subject) && !termMatch(sT.subject, sB.predicate)) return 4;
  return null;
}

/* ──────────────────────────── Local inference ─────────────────────────── */

interface Premises {
  readonly task: Task;
  readonly belief: Belief;
  readonly judgment: Judgment;
  readonly beliefTask: Task | null;
}

/** Revision: two judgments on the same statement with independent evidence. */
function revise({ task, belief, judgment, beliefTask }: Premises): InferenceResult {
  const taskJudgment = task.sentence as Judgment;
  const truth = TF.revision(taskJudgment.truth, judgment.truth);
  const novelty = Math.abs(taskJudgment.getExpectation() - judgment.getExpectation());
  const priority = PriorityFunc.revision(task, belief, novelty, truth.getConfidence());
  const base = EvidentialBase.merge(taskJudgment.base, judgment.base);

  const derived = new Task(new Judgment(judgment.statement, truth, base), priority, "derived",
    { rule: "revision", task, belief: beliefTask });
  return { derived: [derived], answers: [] };
}

/** Choice: a judgment that may answer the question better than its current answer. */
function choice({ task, belief, judgment, beliefTask }: Premises): InferenceResult {
  const question = task.sentence as Question;
  const quality = betterSolution(question, judgment);
  if (quality <= 0) return emptyResult();

  PriorityFunc.choice(task, belief, quality);
  return { derived: [], answers: [{ question: task, answer: judgment, from: beliefTask }] };
}

/**
 * Updates the question's solution if the judgment is better, and returns the
 * judgment's quality (0 if it is not better). Yes/no questions prefer higher
 * confidence; what-questions prefer higher expectation (book §4.4).
 */
export function betterSolution(question: Question, judgment: Judgment): number {
  const rank = (j: Judgment) => (question.hasVariable() ? j.getExpectation() : j.truth.getConfidence());
  if (question.solution !== null && rank(judgment) <= rank(question.solution)) return 0;
  question.solution = judgment;
  return rank(judgment);
}

/* ──────────────────────────── Syllogistic rules ───────────────────────── */

type TruthFn = (j1: Truth, j2: Truth) => Truth | null;

interface Conclusion {
  readonly statement: Statement;
  readonly rule: string;
  /** Forward: how to compute the truth value. Backward: the fixed quality. */
  readonly truth?: Truth | null;
  readonly quality?: number;
}

/**
 * Forward inference: the task is a judgment. Each figure gives two
 * conclusions, with truth functions from Table B.1 (J1, J2 in that table's
 * order). Note: the book's §4.4 pseudocode lists ded/exe the other way round
 * for figure 4; Table B.1 gives deduction for <S --> P> there, used below.
 */
function forward({ task, belief, judgment, beliefTask }: Premises): InferenceResult {
  const sT = task.statement, sB = judgment.statement;
  const tT = (task.sentence as Judgment).truth, tB = judgment.truth;
  const conclude = (subject: Term, predicate: Term, rule: string, fn: TruthFn, j1: Truth, j2: Truth): Conclusion =>
    ({ statement: new Statement(subject, predicate), rule, truth: fn(j1, j2) });

  let conclusions: Conclusion[];
  switch (getFigure(sT, sB)) {
    case 1: conclusions = [  // T = <M --> P>, B = <S --> M>
      conclude(sB.subject, sT.predicate, "deduction", TF.deduction, tT, tB),
      conclude(sT.predicate, sB.subject, "exemplification", TF.exemplification, tB, tT)];
      break;
    case 2: conclusions = [  // T = <S --> M>, B = <P --> M>
      conclude(sB.subject, sT.subject, "abduction", TF.abduction, tT, tB),
      conclude(sT.subject, sB.subject, "abduction", TF.abduction, tB, tT)];
      break;
    case 3: conclusions = [  // T = <M --> P>, B = <M --> S>
      conclude(sB.predicate, sT.predicate, "induction", TF.induction, tT, tB),
      conclude(sT.predicate, sB.predicate, "induction", TF.induction, tB, tT)];
      break;
    case 4: conclusions = [  // T = <S --> M>, B = <M --> P>
      conclude(sT.subject, sB.predicate, "deduction", TF.deduction, tB, tT),
      conclude(sB.predicate, sT.subject, "exemplification", TF.exemplification, tT, tB)];
      break;
    default: return emptyResult();
  }

  const base = EvidentialBase.merge(task.sentence.base, judgment.base);
  const derived: Task[] = [];
  for (const c of conclusions) {
    if (!c.truth) continue; // no evidence, no conclusion
    const priority = PriorityFunc.syl(task, belief, c.truth.getConfidence());
    derived.push(new Task(new Judgment(c.statement, c.truth, base), priority, "derived",
      { rule: c.rule, task, belief: beliefTask }));
  }
  return { derived, answers: [] };
}

/**
 * Backward inference: the task is a question. The same figures produce
 * questions whose answers, combined with the belief, would answer the task.
 * Qualities are the book's constants (§4.4).
 */
function backward({ task, belief, judgment, beliefTask }: Premises): InferenceResult {
  const sT = task.statement, sB = judgment.statement;
  const ask = (subject: Term, predicate: Term, quality: number): Conclusion =>
    ({ statement: new Statement(subject, predicate), rule: "backward", quality });

  let questions: Conclusion[];
  switch (getFigure(sT, sB)) {
    case 1: questions = [ask(sB.subject, sT.predicate, 0.5), ask(sT.predicate, sB.subject, 0.5)]; break;
    case 2: questions = [ask(sB.subject, sT.subject, 0.5), ask(sT.subject, sB.subject, 1.0)]; break;
    case 3: questions = [ask(sB.predicate, sT.predicate, 1.0), ask(sT.predicate, sB.predicate, 0.5)]; break;
    case 4: questions = [ask(sT.subject, sB.predicate, 0.5), ask(sB.predicate, sT.subject, 0.5)]; break;
    default: return emptyResult();
  }

  const base = EvidentialBase.merge(task.sentence.base, judgment.base);
  const derived = questions.map(q => new Task(
    new Question(q.statement, base),
    PriorityFunc.backward(task, belief, q.quality!),
    "derived",
    { rule: q.rule, task, belief: beliefTask }));
  return { derived, answers: [] };
}
