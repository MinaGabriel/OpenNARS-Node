import { ShortFloat } from "./ShortFloat";
import { Symbols } from "./enums/Symbols";
import { BudgetFunctions } from "./inference/BudgetFunctions";
import { MathFunctions } from "./utils/MathFunctions";

class Budget {
  private mark: string = Symbols.BUDGET_VALUE_MARK;
  private separator: string = Symbols.VALUE_SEPARATOR;
  private _priority: ShortFloat;
  private _durability: ShortFloat;
  private _quality: ShortFloat;

  constructor(budget?: Budget, p?: number, d?: number, q?: number) {
    if (budget) {
      this._priority = new ShortFloat(budget.priority);
      this._durability = new ShortFloat(budget.durability);
      this._quality = new ShortFloat(budget.quality);
    } else {
      this._priority = new ShortFloat(p ?? 0.01);
      this._durability = new ShortFloat(d ?? 0.01);
      this._quality = new ShortFloat(q ?? 0.01);
    }
  }

  get priority(): number {
    return this._priority.getValue();
  }
  set priority(value: number) {
    this._priority.setValue(value);
  }

  get durability(): number {
    return this._durability.getValue();
  }
  set durability(value: number) {
    this._durability.setValue(value);
  }

  get quality(): number {
    return this._quality.getValue();
  }
  set quality(value: number) {
    this._quality.setValue(value);
  }

  // Increase priority using probabilistic OR (noisy-OR)
  increasePriority(newValue: number): void {
    this.priority = MathFunctions.or(this.priority, newValue);
  }

  // Decrease priority using probabilistic AND (noisy-AND)
  decreasePriority(newValue: number): void {
    this.priority = MathFunctions.and(this.priority, newValue);
  }

  increaseQuality(newValue: number): void {
    this.quality = MathFunctions.or(this.quality, newValue);
  }

  decreaseQuality(newValue: number): void {
    this.quality = MathFunctions.and(this.quality, newValue);
  }

  increaseDurability(newValue: number): void {
    this.durability = MathFunctions.or(this.durability, newValue);
  }

  decreaseDurability(newValue: number): void {
    this.durability = MathFunctions.and(this.durability, newValue);
  }

  merge(that: Budget): void {
    BudgetFunctions.merge(this, that);
  }

  singleValue(): number {
    return MathFunctions.average(this.priority, this.durability, this.quality);
  }

  aboveThreshold(): boolean {
    return this.singleValue() > 0.001;
  }

  reducePriorityByAchievingLevel(h: number): void {
    this.priority = this.priority * (1 - h);
  }

  toString(): string {
    return (
      this.mark +
      this._priority.toString() +
      this.separator +
      this._durability.toString() +
      this.separator +
      this._quality.toString() +
      this.mark
    );
  }

  toStringTwo(): string {
    return (
      this.mark +
      this._priority.toStringTwoDigits() +
      this.separator +
      this._durability.toStringTwoDigits() +
      this.separator +
      this._quality.toStringTwoDigits() +
      this.mark
    );
  }

  reduceByAchievingLevel(h: number): void {
    this.priority = this.priority * (1 - h);
  }
}

export { Budget };
