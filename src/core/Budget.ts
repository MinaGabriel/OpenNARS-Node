import { utility } from "../utils/Utility";
import { BudgetFunctions } from "./BudgetFunctions";
import { Memory } from "./Memory";
import { ShortFloat } from "../utils/ShortFloat";
import { Symbols } from "./Symbols";

class Budget extends BudgetFunctions {
    private mark: string = Symbols.BUDGET_VALUE_MARK;
    private separator: string = Symbols.VALUE_SEPARATOR;
    private priority: ShortFloat;
    private durability: ShortFloat;
    private quality: ShortFloat; 
    private budgetFunctions: BudgetFunctions;

    constructor(budget?: Budget, p?: number, d?: number, q?: number) { 
        super();
        if (budget) {
            this.priority = new ShortFloat(budget.getPriority());
            this.durability = new ShortFloat(budget.getDurability());
            this.quality = new ShortFloat(budget.getQuality());
        }
        else {
            this.priority = new ShortFloat(p ?? 0.01);
            this.durability = new ShortFloat(d ?? 0.01);
            this.quality = new ShortFloat(q ?? 0.01);

        }
        this.budgetFunctions = new BudgetFunctions();
    }

    public getPriority(): number {
        return this.priority.getValue();
    }

    public getDurability(): number {
        return this.durability.getValue();
    }

    public getQuality(): number {
        return this.quality.getValue();
    }

    public setPriority(value: number): void {
        this.priority.setValue(value);
    }

    public setDurability(value: number): void {
        this.durability.setValue(value);
    }

    public setQuality(value: number): void {
        this.quality.setValue(value);
    }

    //increase priority, new value = 0.5 and old value = 0.3
    //returned value 1 - (1 - 0.3)(1 - 0.5) = 1 - 0.7 * 0.5 = 1 - 0.35 = 0.65
    // Insure value between 0 and 1
    // Formula: 1 - ∏(1 - xᵢ)  → 1 minus the product over (1 - xᵢ)
    // using probabilistic OR AKA noisy-OR
    public increasePriority(newValue: number): void {
        this.priority.setValue(utility.or(this.priority.getValue(), newValue));
    }

    // decrease priority, new value = 0.5 and old value = 0.3
    // returned value 0.3 * 0.5 = 0.15
    // Insure value between 0 and 1
    // Formula: ∏(xᵢ)  → product over xᵢ
    // using probabilistic AND AKA noisy-AND
    public decreasePriority(newValue: number): void {
        this.priority.setValue(utility.and(this.priority.getValue(), newValue));
    }

    public increaseQuality(newValue: number): void {
        this.quality.setValue(utility.or(this.quality.getValue(), newValue));
    }

    public decreaseQuality(newValue: number): void {
        this.quality.setValue(utility.and(this.quality.getValue(), newValue));
    }

    public increaseDurability(newValue: number): void {
        this.durability.setValue(utility.or(this.durability.getValue(), newValue));
    }

    public decreaseDurability(newValue: number): void {
        this.durability.setValue(utility.and(this.durability.getValue(), newValue));
    }

    public merge(that: Budget): void {
        BudgetFunctions.merge(this, that);
    }

    public singleValue(): number {
        return utility.average(this.priority.getValue(), this.durability.getValue(), this.quality.getValue());
    }

    public aboveThreshold(): boolean {
        return this.singleValue() > 0.001;
    }

    public toString(): string {
        return this.mark +
            this.priority.toString() +
            this.separator +
            this.durability.toString() +
            this.separator +
            this.quality.toString() +
            this.mark;
    }

    public toStringTwo(): string {
        return this.mark +
            this.priority.toStringTwoDigits() +
            this.separator +
            this.durability.toStringTwoDigits() +
            this.separator +
            this.quality.toStringTwoDigits() +
            this.mark;
    }
 
}

export { Budget };
