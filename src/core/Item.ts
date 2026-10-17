// Item.ts
// Leaf module. Base class for anything stored in a Bag (tasks, beliefs,
// concepts). Mini-NARS keeps a single priority value instead of a full
// budget (priority, durability, quality); see book §4.5.

const MIN_PRIORITY = 0.0001; // priority stays in (0, 1]

export const or = (...xs: number[]): number => 1 - xs.reduce((acc, x) => acc * (1 - x), 1);
export const and = (...xs: number[]): number => xs.reduce((acc, x) => acc * x, 1);
export const not = (x: number): number => 1 - x;

export abstract class Item {
  private _priority: number;

  protected constructor(readonly key: string, priority: number) {
    this._priority = Item.clamp(priority);
  }

  get priority(): number { return this._priority; }
  set priority(p: number) { this._priority = Item.clamp(p); }

  /**
   * Called by the bag when an item with the same key arrives while this one
   * is already stored. This item stays in the bag and absorbs the other.
   * Default: priorities combine with `or`, so a repeatedly generated item
   * gains attention (book §4.5, "Bag"). Subclasses merge their own content
   * and call super.merge().
   */
  merge(other: Item): void {
    this.priority = or(this.priority, other.priority);
  }

  /** Subclasses override this to print themselves in Narsese. */
  toString(): string {
    return this.key;
  }

  private static clamp(p: number): number {
    if (!Number.isFinite(p)) throw new Error(`Invalid priority: ${p}`);
    return Math.min(1, Math.max(MIN_PRIORITY, p));
  }
}