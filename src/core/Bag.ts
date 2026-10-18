// Bag.ts
// A collection where the chance of picking an item grows with its priority
// (book §3.2, §4.2). It is how NARS divides limited attention: high-priority
// items are picked often, low-priority ones rarely, and when the bag is full
// the lowest ones are forgotten.
//
// Example: a concept's taskBag holding
//   $0.95$ <robin --> animal>?      level 9, picked most often
//   $0.40$ <robin --> bird>. ...    level 3, picked now and then
//
// Structure: a map key → item, plus L levels (buckets) of capacity B.
// An item's level is ceil(priority × L) − 1. Each bucket is a queue: items
// join at the back and are selected from the front, so items on the same
// level take turns. When a bucket overflows, the item at the front (the one
// that has waited longest) drops to the level below; below level 0 it is
// forgotten.
//
// Life cycle of an item:
//   put(item)      add a new item (or merge into the existing one with the same key)
//   select()       pick an item by priority; it leaves its level but stays in the bag
//   take(key)      the same, but for a specific key
//   putBack(item)  decay its priority and return it to a level

import { Item } from "./Item";
import { Distributor } from "./Distributor";
import { PriorityFunc } from "./PriorityFunc";

export class Bag<T extends Item> {
  private readonly items = new Map<string, T>();
  private readonly levelOf = new Map<string, number>(); // only for items currently in a level
  private readonly levels: T[][];
  private readonly distributor: Distributor;
  private pointer = 0;

  constructor(readonly levelCount: number, readonly bucketCapacity: number) {
    this.levels = Array.from({ length: levelCount }, () => []);
    this.distributor = Distributor.new(levelCount);
  }

  get capacity(): number { return this.levelCount * this.bucketCapacity; }
  get size(): number { return this.items.size; }

  has(key: string): boolean { return this.items.has(key); }
  peek(key: string): T | undefined { return this.items.get(key); }

  /**
   * Adds an item. If one with the same key is already here, that one stays
   * and absorbs the new one (priorities combine, beliefs pool their truth
   * values). Returns the item now stored under the key.
   */
  put(item: T): T {
    const existing = this.items.get(item.key);
    if (existing) {
      const wasInLevel = this.removeFromLevel(existing.key);
      existing.merge(item);
      if (wasInLevel) this.enterLevel(existing, this.priorityToLevel(existing.priority));
      return existing;
    }
    this.items.set(item.key, item);
    this.enterLevel(item, this.priorityToLevel(item.priority));
    return item;
  }

  /** Picks an item, with probability roughly proportional to priority. Null if none is available. */
  select(): T | null {
    for (let tries = 0; tries < this.distributor.length; tries++) {
      const level = this.distributor.pick(this.pointer);
      this.pointer = this.distributor.next(this.pointer);
      const item = this.levels[level][0];
      if (item) {
        this.removeFromLevel(item.key);
        return item;
      }
    }
    return null;
  }

  /** Takes out a specific item (book: get). Null if absent or already taken out. */
  take(key: string): T | null {
    return this.removeFromLevel(key) ? this.items.get(key)! : null;
  }

  /** Removes an item from the bag for good (it will not be put back). */
  remove(key: string): T | null {
    const item = this.items.get(key);
    if (!item) return null;
    this.removeFromLevel(key);
    this.items.delete(key);
    return item;
  }

  /** Returns a taken-out item after decaying its priority. */
  putBack(item: T): void {
    if (this.items.get(item.key) !== item) throw new Error(`putBack: ${item.key} was not taken from this bag`);
    if (this.levelOf.has(item.key)) throw new Error(`putBack: ${item.key} was never taken out`);
    PriorityFunc.decay(item);
    this.enterLevel(item, this.priorityToLevel(item.priority));
  }

  /** All items, highest level first (for display and tests). */
  toArray(): T[] {
    return [...this.levels].reverse().flat();
  }

  private priorityToLevel(priority: number): number {
    return Math.max(0, Math.ceil(priority * this.levelCount) - 1);
  }

  private enterLevel(item: T, level: number): void {
    if (level < 0) {
      // absolute forgetting
      this.items.delete(item.key);
      this.levelOf.delete(item.key);
      return;
    }
    this.levels[level].push(item);
    this.levelOf.set(item.key, level);
    if (this.levels[level].length > this.bucketCapacity) {
      const overflow = this.levels[level].shift()!;
      this.levelOf.delete(overflow.key);
      this.enterLevel(overflow, level - 1);
    }
  }

  /** Re-files an item whose priority changed while it stayed in the bag. It keeps its
 *  place in the queue unless its level changed; otherwise busy concepts would starve. */
  refresh(item: T): void {
    const level = this.levelOf.get(item.key);
    const target = this.priorityToLevel(item.priority);
    if (level === undefined || level === target) return;
    this.removeFromLevel(item.key);
    this.enterLevel(item, target);
  }

  /** Removes an item from its level (not from the bag). Returns false if it wasn't in a level. */
  private removeFromLevel(key: string): boolean {
    const level = this.levelOf.get(key);
    if (level === undefined) return false;
    const bucket = this.levels[level];
    bucket.splice(bucket.findIndex(i => i.key === key), 1);
    this.levelOf.delete(key);
    return true;
  }
}
