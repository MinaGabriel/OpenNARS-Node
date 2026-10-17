// belief.test.ts
// Run: npx tsx --test src/core/test/belief.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { Belief, BELIEF_CAPACITY } from "../Belief";
import { EvidentialBase as EB } from "../EvidentialBase";
import { Truth } from "../Truth";

import { Statement } from "../Statement";

const robinBird = Statement.of("robin", "bird");

test("evidential base: merge interleaves, dedupes and truncates", () => {
  const a = EB.merge(EB.fromInput(1), EB.fromInput(2));
  const b = EB.merge(EB.fromInput(3), EB.fromInput(4));
  assert.deepEqual(EB.merge(a, b).toArray(), [1, 3, 2, 4]);
  assert.deepEqual(EB.merge(a, a).toArray(), [1, 2]);

  let long = EB.fromInput(0);
  for (let i = 1; i < 20; i++) long = EB.merge(long, EB.fromInput(i));
  assert.equal(long.toArray().length, 8);
});

test("evidential base: overlap and input detection", () => {
  const derived = EB.merge(EB.fromInput(1), EB.fromInput(2));
  assert.ok(EB.overlaps(derived, EB.fromInput(2)));
  assert.ok(!EB.overlaps(derived, EB.fromInput(3)));
  assert.ok(EB.fromInput(5).isInput());
  assert.ok(!derived.isInput());
});

test("entries are kept in descending confidence order", () => {
  const b = new Belief(robinBird, { truth: new Truth(1, 0.5), base: EB.fromInput(1) }, 0.8);
  b.add({ truth: new Truth(1, 0.9), base: EB.fromInput(2) });
  b.add({ truth: new Truth(1, 0.7), base: EB.fromInput(3) });
  assert.deepEqual(b.truthEntries.map(e => e.truth.getConfidence()), [0.9, 0.7, 0.5]);
  assert.equal(b.best().truth.getConfidence(), 0.9);
});

test("capacity: least confident entry is dropped", () => {
  const b = new Belief(robinBird, { truth: new Truth(1, 0.5), base: EB.fromInput(1) }, 0.8);
  for (let i = 0; i < BELIEF_CAPACITY; i++) {
    b.add({ truth: new Truth(1, 0.6 + i * 0.05), base: EB.fromInput(10 + i) });
  }
  assert.equal(b.truthEntries.length, BELIEF_CAPACITY);
  assert.ok(b.truthEntries.every(e => e.truth.getConfidence() > 0.5));
  assert.equal(b.add({ truth: new Truth(1, 0.1), base: EB.fromInput(99) }), false);
});

test("same evidence: only a more confident entry replaces it", () => {
  const b = new Belief(robinBird, { truth: new Truth(1, 0.8), base: EB.fromInput(1) }, 0.8);
  assert.equal(b.add({ truth: new Truth(0, 0.5), base: EB.fromInput(1) }), false);
  assert.equal(b.add({ truth: new Truth(0, 0.85), base: EB.fromInput(1) }), true);
  assert.equal(b.truthEntries.length, 1);
  assert.equal(b.best().truth.getFrequency(), 0);
});

test("selectTruth skips entries whose evidence overlaps the task", () => {
  const b = new Belief(robinBird, { truth: new Truth(1, 0.9), base: EB.merge(EB.fromInput(1), EB.fromInput(2)) }, 0.8);
  b.add({ truth: new Truth(1, 0.6), base: EB.fromInput(3) });

  assert.equal(b.selectTruth(EB.fromInput(2))!.truth.getConfidence(), 0.6);
  assert.equal(b.selectTruth(EB.fromInput(7))!.truth.getConfidence(), 0.9);
  assert.equal(b.selectTruth(EB.merge(EB.fromInput(1), EB.fromInput(3))), null);
});

test("merge: absorbs the older belief's entries and ors priorities", () => {
  const older = new Belief(robinBird, { truth: new Truth(1, 0.9), base: EB.fromInput(1) }, 0.5);
  const newer = new Belief(robinBird, { truth: new Truth(0, 0.7), base: EB.fromInput(2) }, 0.5);
  newer.merge(older);
  assert.equal(newer.truthEntries.length, 2);
  assert.equal(newer.best().truth.getFrequency(), 1);
  assert.ok(Math.abs(newer.priority - 0.75) < 1e-9);
});

test("key is the statement name and toString matches book format", () => {
  const b = new Belief(robinBird, { truth: new Truth(1, 0.81), base: EB.fromInput(1) }, 0.8);
  assert.equal(b.key, "<robin --> bird>");
  assert.equal(b.toString(), "<robin --> bird>. %1.00;0.81%");
});
