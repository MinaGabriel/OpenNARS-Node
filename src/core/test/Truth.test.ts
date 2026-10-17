// truth.test.ts
// Run: npx tsx --test src/core/test/truth.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { Truth, TruthFunctions as TF } from "../Truth";

const TOL = 1e-4;

function assertTruth(actual: Truth | null, f: number, c: number, label: string): void {
  assert.ok(actual, `${label}: expected a truth value, got null`);
  assert.ok(Math.abs(actual.getFrequency() - f) < TOL, `${label}: f = ${actual.getFrequency()}, expected ${f}`);
  assert.ok(Math.abs(actual.getConfidence() - c) < TOL, `${label}: c = ${actual.getConfidence()}, expected ${c}`);
}

const w2c = (w: number) => w / (w + 1);
const yes = new Truth(1.0, 0.9);
const no = new Truth(0.0, 0.9);

test("deduction: book §4.6 sample (robin → bird, bird → animal ⊢ robin → animal)", () => {
  const birdAnimal = new Truth(1.0, 0.9);   // J1: M → P
  const robinBird = new Truth(1.0, 0.9);    // J2: S → M
  const result = TF.deduction(birdAnimal, robinBird);
  assertTruth(result, 1.0, 0.81, "deduction");
  assert.equal(result!.toString(), "%1.00;0.81%");
});

test("deduction: dogs-are-cute example", () => {
  const animalCute = new Truth(0.7, 0.9);   // J1: animal → cute
  const dogAnimal = new Truth(1.0, 0.9);    // J2: dog → animal
  assertTruth(TF.deduction(animalCute, dogAnimal), 0.7, 0.567, "deduction");
});

test("deduction: no evidence gives null", () => {
  assert.equal(TF.deduction(no, yes), null);
});

test("abduction: frequency comes from J2, weight from f1", () => {
  // J1: P → M, J2: S → M ⊢ S → P
  assertTruth(TF.abduction(yes, yes), 1.0, w2c(0.81), "abd(yes, yes)");
  assertTruth(TF.abduction(yes, no), 0.0, w2c(0.81), "abd(yes, no)");
  assert.equal(TF.abduction(no, yes), null, "abd(no, yes) has no evidence");
});

test("induction: frequency comes from J1, weight from f2", () => {
  // J1: M → P, J2: M → S ⊢ S → P
  assertTruth(TF.induction(yes, yes), 1.0, w2c(0.81), "ind(yes, yes)");
  assertTruth(TF.induction(no, yes), 0.0, w2c(0.81), "ind(no, yes)");
  assert.equal(TF.induction(yes, no), null, "ind(yes, no) has no evidence");
});

test("induction is abduction with the premises switched", () => {
  const a = new Truth(0.8, 0.9);
  const b = new Truth(0.6, 0.7);
  assert.ok(TF.induction(a, b)!.equals(TF.abduction(b, a)));
});

test("exemplification: f = 1, c = w2c(f1 f2 c1 c2)", () => {
  assertTruth(TF.exemplification(yes, yes), 1.0, w2c(0.81), "exe(yes, yes)");
  const a = new Truth(0.8, 0.9);
  const b = new Truth(0.5, 0.9);
  assertTruth(TF.exemplification(a, b), 1.0, w2c(0.8 * 0.5 * 0.81), "exe(a, b)");
});

test("weak syllogisms are always less confident than deduction", () => {
  const ded = TF.deduction(yes, yes)!.getConfidence();
  for (const fn of [TF.abduction, TF.induction, TF.exemplification]) {
    assert.ok(fn(yes, yes)!.getConfidence() < ded);
  }
});

test("revision: agreeing and conflicting evidence", () => {
  assertTruth(TF.revision(yes, yes), 1.0, 18 / 19, "rev(yes, yes)");
  assertTruth(TF.revision(yes, no), 0.5, 18 / 19, "rev(yes, no)");
});

test("revision: confidence never reaches 1", () => {
  let t = new Truth(1.0, 0.99);
  for (let i = 0; i < 50; i++) t = TF.revision(t, new Truth(1.0, 0.99));
  assert.ok(t.getConfidence() < 1);
  assert.ok(Number.isFinite(TF.c2w(t.getConfidence())));
});

test("expectation: e = c(f − 0.5) + 0.5", () => {
  assert.ok(Math.abs(new Truth(1.0, 0.9).getExpectation() - 0.95) < TOL);
  assert.ok(Math.abs(new Truth(0.0, 0.9).getExpectation() - 0.05) < TOL);
});