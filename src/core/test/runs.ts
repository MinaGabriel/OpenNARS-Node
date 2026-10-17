import { strict as assert } from "node:assert";
import colors from "ansi-colors";
import { Distributor } from "../Distributor";

const distributor = Distributor.new(3);

// 1. Check one complete schedule.
const order = Array.from(
  { length: distributor.length },
  (_, index) => distributor.pick(index)
);

assert.equal(distributor.length, 6);
assert.deepEqual(order, [2, 1, 2, 1, 2, 0]);

console.log(colors.green(`Schedule: ${order.join(", ")}`));

// 2. Walk through two cycles, just like the Bag does.
let pointer = 0;

for (let turn = 1; turn <= 12; turn++) {
  const level = distributor.pick(pointer);

  console.log(
    colors.cyan(
      `Turn ${turn}: position ${pointer} → level ${level}`
    )
  );

  pointer = distributor.next(pointer);
}

assert.equal(pointer, 0);
assert.equal(distributor.next(5), 0);

// 3. Check how often each level appears.
const counts = [0, 0, 0];

for (const level of order) {
  counts[level]++;
}

assert.deepEqual(counts, [1, 2, 3]);
console.table(
  counts.map((count, level) => ({ level, visitsPerCycle: count }))
);

// 4. Same range reuses the same cached object.
assert.strictEqual(Distributor.new(3), distributor);
assert.notStrictEqual(Distributor.new(4), distributor);

console.log(colors.bold.green("All Distributor tests passed!"));