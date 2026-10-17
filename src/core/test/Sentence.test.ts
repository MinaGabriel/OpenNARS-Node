// sentence.test.ts
// Run: npx tsx --test src/core/test/sentence.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { Term } from "../Term";
import { Statement } from "../Statement";
import { Judgment } from "../Judgment";
import { Question } from "../Question";
import { Task } from "../Task";
import { Belief } from "../Belief";
import { Truth } from "../Truth";
import { EvidentialBase as EB } from "../EvidentialBase";

test("terms: words and query variables", () => {
  assert.ok(!new Term("robin").isVariable());
  assert.ok(Term.variable("x").isVariable());
  assert.equal(Term.variable("x").name(), "?x");
  assert.throws(() => new Term("two words"));
  assert.throws(() => new Term("<robin"));
});

test("statements print in Narsese and reject bad forms", () => {
  assert.equal(Statement.of("robin", "bird").name(), "<robin --> bird>");
  assert.ok(Statement.of("robin", "?x").hasVariable());
  assert.ok(Statement.of("robin", "bird").equals(Statement.of("robin", "bird")));
  assert.throws(() => Statement.of("robin", "robin"));
  assert.throws(() => Statement.of("?x", "?y"));
});

test("judgment and question print like the book", () => {
  const j = new Judgment(Statement.of("robin", "bird"), new Truth(1, 0.9), EB.fromInput(1));
  assert.equal(j.toString(), "<robin --> bird>. %1.00;0.90%");
  assert.equal(new Question(Statement.of("robin", "?x"), EB.fromInput(2)).toString(), "<robin --> ?x>?");
  assert.throws(() => new Judgment(Statement.of("robin", "?x"), new Truth(1, 0.9), EB.fromInput(3)));
});

test("task keys: judgments keep their evidence, questions don't", () => {
  const s = Statement.of("robin", "bird");
  const t1 = new Task(new Judgment(s, new Truth(1, 0.9), EB.fromInput(1)), 0.8, "user");
  const t2 = new Task(new Judgment(s, new Truth(1, 0.9), EB.fromInput(2)), 0.8, "llm");
  assert.notEqual(t1.key, t2.key);
  assert.equal(new Task(new Question(s, EB.fromInput(3)), 0.9, "user").key, "<robin --> bird>?");
  assert.equal(t1.toString(), "$0.80$ <robin --> bird>. %1.00;0.90%");
});

test("tasks record where they came from", () => {
  const s = Statement.of("robin", "bird");
  const input = new Task(new Judgment(s, new Truth(1, 0.9), EB.fromInput(1)), 0.8, "user");
  assert.ok(input.isInput() && input.isJudgment());

  const derivedQ = new Task(new Question(Statement.of("bird", "animal"), EB.fromInput(1)), 0.45, "derived",
    { rule: "backward", task: input, belief: null });
  assert.ok(!derivedQ.isInput() && derivedQ.isQuestion());
  assert.equal(derivedQ.derivation!.task, input);

  assert.throws(() => new Task(new Question(s, EB.fromInput(2)), 0.5, "derived"));
  assert.throws(() => new Task(new Question(s, EB.fromInput(2)), 0.5, "user", { rule: "x", task: input, belief: null }));
});


test("a judgment task becomes a belief that remembers its origin", () => {
  const task = new Task(new Judgment(Statement.of("dog", "cute"), new Truth(0.9, 0.9), EB.fromInput(5)), 0.8, "user");
  const belief = Belief.fromTask(task);
  assert.equal(belief.key, "<dog --> cute>");
  assert.equal(belief.priority, 0.8);
  assert.equal(belief.best().origin, task);
  assert.throws(() => Belief.fromTask(new Task(new Question(Statement.of("dog", "cute"), EB.fromInput(6)), 0.9, "user")));
});