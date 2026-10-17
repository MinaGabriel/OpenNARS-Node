// PriorityFunc.ts
// How attention moves around (book §4.5). Every value here is a priority in
// (0, 1], combined with the extended-Boolean functions and / or / not.
//
// The pattern: an inference step that produces something useful (high
// "quality") lowers the priority of the task that was worked on (it has
// done its job), raises the priority of the belief that helped (it proved
// useful), and gives the new task a priority from both parents and the quality.
//
// Example: task <robin --> bird> (0.8) and belief <bird --> animal> (0.8)
// derive <robin --> animal> %1.00;0.81%, so quality is 0.81:
//   task      0.8 → and(0.8, not(0.81)) ≈ 0.15
//   belief    0.8 → or(0.8, 0.81)       ≈ 0.96
//   new task  and(or(0.8, 0.8), 0.81)   ≈ 0.78
//
// The book calls its functions "highly simplified" and meant to be tuned.
// Two changes from the §4.5 versions, both found by running the §4.6 sample:
//   1. A derived task gets and(or(pT, pB), quality) instead of or(pT, pB, quality).
//      With the triple `or`, every derived task ends up near 1.0, so
//      priority stops telling tasks apart.
//   2. Backward inference does not lower the question's priority. With
//      quality 1.0, and(pT, not(1.0)) drops the question to zero after one
//      step, and it is never selected again to receive its answer.
//      A question's priority drops when it is answered (choice) instead.

import { and, or, not, Item } from "./Item";

export const DUR = 0.99; // durability: fraction of priority kept each time an item is put back

export class PriorityFunc {
  /** Relative forgetting: applied every time an item goes back into its bag. */
  static decay(item: Item): void {
    item.priority = item.priority * DUR;
  }

  /** A concept gets attention whenever a task is added to it. */
  static activate(concept: Item, taskPriority: number): void {
    concept.priority = or(concept.priority, taskPriority);
  }

  /**
   * Revision rewards novelty: a revised value whose expectation differs from
   * the task's. Novelty raises the task; agreement raises the belief.
   * Returns the priority of the revised task.
   */
  static revision(task: Item, belief: Item, novelty: number, quality: number): number {
    const derived = PriorityFunc.derived(task, belief, quality);
    task.priority = or(task.priority, novelty);
    belief.priority = or(belief.priority, not(novelty));
    return derived;
  }

  /** Choice: an answered question loses priority; the belief that answered it gains. */
  static choice(task: Item, belief: Item, quality: number): void {
    task.priority = and(task.priority, not(quality));
    belief.priority = or(belief.priority, quality);
  }

  /** Forward syllogism. Returns the priority of the derived judgment. */
  static syl(task: Item, belief: Item, quality: number): number {
    const derived = PriorityFunc.derived(task, belief, quality);
    task.priority = and(task.priority, not(quality));
    belief.priority = or(belief.priority, quality);
    return derived;
  }

  /** Backward syllogism. The question keeps its priority. Returns the derived question's priority. */
  static backward(task: Item, belief: Item, quality: number): number {
    const derived = PriorityFunc.derived(task, belief, quality);
    belief.priority = or(belief.priority, quality);
    return derived;
  }

  private static derived(task: Item, belief: Item, quality: number): number {
    return and(or(task.priority, belief.priority), quality);
  }
}