import { Budget } from './Budget';

/**
 * Base Item class for NARS system
 * Provides budget management and comparison functionality
 */
class Item {

    protected key: string;
    protected  budget: Budget;

    constructor(key?: string, budget?: Budget) {
        this.key = key ?? '';
        this.budget = budget ? new Budget(budget) : new Budget();
    }

    public getKey():string{
        return this.key;
    }

    public getBudget() : Budget{
        return this.budget;
    }

    public getPriority(): number{
        return this.budget.getPriority();
    }

    public getDurability(): number{
        return this.budget.getDurability();
    }

    public getQuality(): number{
        return this.budget.getQuality();
    } 

    setPriority(priority: number) {
        this.budget.setPriority(priority);
    }
    setDurability(durability: number) {
        this.budget.setDurability(durability);
    }
    setQuality(quality: number) {
        this.budget.setQuality(quality);
    }

    public merge(that : Item): void{
        this.budget.merge(that.getBudget()); 
    }

}

export { Item };