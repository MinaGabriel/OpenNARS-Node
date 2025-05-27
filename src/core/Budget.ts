import { utility } from "../utils/Utility";
import { BudgetFunctions } from "./BudgetFunctions";
import { Memory } from "./Memory";
import { ShortFloat } from "../utils/ShortFloat";
import { Symbols } from "./Symbols";

class Budget extends BudgetFunctions {
    private mark: string = Symbols.BUDGET_VALUE_MARK;
    private separator: string = Symbols.VALUE_SEPARATOR;
    private _priority: ShortFloat;
    private _durability: ShortFloat;
    private _quality: ShortFloat;
    private budgetFunctions: BudgetFunctions;

    constructor(budget?: Budget, p?: number, d?: number, q?: number) {
        super();
        if (budget) {
            this._priority = new ShortFloat(budget.priority);
            this._durability = new ShortFloat(budget.durability);
            this._quality = new ShortFloat(budget.quality);
        } else {
            this._priority = new ShortFloat(p ?? 0.01);
            this._durability = new ShortFloat(d ?? 0.01);
            this._quality = new ShortFloat(q ?? 0.01);
        }
        this.budgetFunctions = new BudgetFunctions();
    }

    get priority(): number { return this._priority.getValue(); }
    set priority(value: number) { this._priority.setValue(value); }

    get durability(): number { return this._durability.getValue(); }
    set durability(value: number) { this._durability.setValue(value); }

    get quality(): number { return this._quality.getValue(); }
    set quality(value: number) { this._quality.setValue(value); }

    // Increase priority using probabilistic OR (noisy-OR)
    public increasePriority(newValue: number): void {
        this.priority = utility.or(this.priority, newValue);
    }

    // Decrease priority using probabilistic AND (noisy-AND)
    public decreasePriority(newValue: number): void {
        this.priority = utility.and(this.priority, newValue);
    }

    public increaseQuality(newValue: number): void {
        this.quality = utility.or(this.quality, newValue);
    }

    public decreaseQuality(newValue: number): void {
        this.quality = utility.and(this.quality, newValue);
    }

    public increaseDurability(newValue: number): void {
        this.durability = utility.or(this.durability, newValue);
    }

    public decreaseDurability(newValue: number): void {
        this.durability = utility.and(this.durability, newValue);
    }

    public merge(that: Budget): void {
        BudgetFunctions.merge(this, that);
    }

    public singleValue(): number {
        return utility.average(this.priority, this.durability, this.quality);
    }

    public aboveThreshold(): boolean {
        return this.singleValue() > 0.001;
    }

    toString(): string {
        return this.mark +
            this._priority.toString() +
            this.separator +
            this._durability.toString() +
            this.separator +
            this._quality.toString() +
            this.mark;
    }

    public toStringTwo(): string {
        return this.mark +
            this._priority.toStringTwoDigits() +
            this.separator +
            this._durability.toStringTwoDigits() +
            this.separator +
            this._quality.toStringTwoDigits() +
            this.mark;
    }
}

export { Budget };
