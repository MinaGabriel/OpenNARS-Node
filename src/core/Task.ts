import { Item } from "./Item";
import { Sentence } from "./Sentence";
import { Memory } from "./storage/Memory";
import { Budget } from "./Budget";
import { Term } from "./Term";
import { TaskType } from "./enums/Enums";
import { Identifiable } from "./interface/Identifiable";
import { setEngine } from "crypto";
/**
 * Task class representing a NARS task
 * Extends the base Item class
 */
export class Task extends Item implements Identifiable {
  private _sentence: Sentence;
  //best Goal or Question answer found for this task.
  private _bestSolution: Sentence | null = null;
  private _achievement: number | null = null;

   _budget: Budget;

  taskType: TaskType = TaskType.INPUT;

  constructor(sentence: Sentence, budget: Budget) {
    super(sentence.toString(), budget);
    this._sentence = sentence;
    this._budget = budget ?? new Budget();
  }
  name(): string {
    return this._sentence.toString();
  }
  toString(): string {
    return `${this._budget.toString()} ${this._sentence.toString()}`;
  }
  isInput(): boolean {
    return this.taskType === TaskType.INPUT;
  }
  get sentence(): Sentence {
    return this._sentence;
  }
  get term(): Term {
    return this._sentence.term;
  }

  public get bestSolution(): Sentence | null {
    return this._bestSolution;
  }
  public set bestSolution(value: Sentence) {
    this._bestSolution = value;
  }

  public get achievement(): number | null {
    return this._achievement;
  }
  public set achievement(value: number | null) {
    this._achievement = value;
  }
 
}
