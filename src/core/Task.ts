import { Item } from "./Item";
import { Sentence } from "./Sentence";
import { Memory } from "./storage/Memory";
import { Budget } from "./Budget";
import { Term } from "./Term";
import { TaskType } from "./enums/Enums";
import { Identifiable } from "./interface/Identifiable";
/**
 * Task class representing a NARS task
 * Extends the base Item class
 */
export class Task extends Item implements Identifiable {
  private _sentence: Sentence;
  protected _budget: Budget;
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
    return `${this._sentence.toString()}`;
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


}
