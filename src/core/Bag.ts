import { Item } from "./nalCorePrimitives";
import { Distributor } from "./Distributor";
import { BudgetFunctions } from "./RuleFunctions";
import { Task } from "./nalCorePrimitives";
import { Concept } from "./Concept";
import { Parameters } from "./Symbols";
import { TaskLink } from "./Link";
import { TermLink } from "./Link";

abstract class Bag<T extends Item> {
    protected static readonly TOTAL_LEVEL: number = 100;
    protected static readonly THRESHOLD: number = 10;
    protected static readonly RELATIVE_THRESHOLD: number = Bag.THRESHOLD / Bag.TOTAL_LEVEL;
    protected static readonly LOAD_FACTOR: number = 0.5;
    protected static readonly DISTRIBUTOR: Distributor = new Distributor(Bag.TOTAL_LEVEL);

    protected name_table: Map<string, T>;
    protected _item_table: Array<Array<T>>;
    protected capacity: number;
    protected forget_rate: number;
    protected mass: number;
    protected level_index: number;
    protected current_level: number;
    protected current_counter: number;
    protected show_level: number;

    constructor(capacity: number = 1000, forget_rate: number = 10) {
        this.capacity = capacity;
        this.forget_rate = forget_rate;
        this.name_table = new Map<string, T>();
        this._item_table = Array.from({ length: Bag.TOTAL_LEVEL }, () => []);
        this.mass = 0;
        this.level_index = capacity % Bag.TOTAL_LEVEL;
        this.current_level = Bag.TOTAL_LEVEL - 1;
        this.current_counter = 0;
        this.show_level = Bag.THRESHOLD;
    }

    public init(): void {
        this._item_table = Array.from({ length: Bag.TOTAL_LEVEL }, () => []);
        this.name_table.clear();
        this.current_level = Bag.TOTAL_LEVEL - 1;
        this.level_index = this.capacity % Bag.TOTAL_LEVEL;
        this.mass = 0;
        this.current_counter = 0;
    }

    get item_table(): Array<Array<T>> {
        return this._item_table;
    }

    public size(): number {
        return this.name_table.size;
    }

    public average_priority(): number {
        if (this.size() === 0) return 0.01;
        const f = this.mass / (this.size() * Bag.TOTAL_LEVEL);
        return f > 1 ? 1.0 : f;
    }

    public contains(it: T): boolean {
        return Array.from(this.name_table.values()).includes(it);
    }

    public get(key: string): T | undefined {
        return this.name_table.get(key);
    }

    public toArray(): T[] {
        return this._item_table.flat();
    }

    public putIn(newItem: T): boolean {
        const newKey = newItem.key; // The key is the name of the item
        const oldItem = this.name_table.get(newKey);

        if (oldItem) {
            this.outOfBase(oldItem);
            newItem.merge(oldItem);
        }

        const overflowItem = this.intoBase(newItem);
        this.name_table.set(newKey, newItem);

        if (overflowItem) {
            this.name_table.delete(overflowItem.key);
            return overflowItem !== newItem;
        }

        return true;
    }

    public putBack(oldItem: T): boolean {
        // Apply forgetting (decay the priority of the item's budget)
        BudgetFunctions.forget(oldItem.budget, this.forget_rate, Bag.RELATIVE_THRESHOLD);

        // Reinsert the item into the bag with its updated (lower) priority
        return this.putIn(oldItem);
    }

    /*
    | **If `current_level < THRESHOLD`** | **If `current_level ≥ THRESHOLD`**                         |
    | ---------------------------------- | ---------------------------------------------------------- |
    | It's a **low-priority** level      | It's a **normal/high-priority** level                      |
    | You take **only 1 item**           | You take **all items (one per call)** until level is empty |
    | Counter is set to `1`              | Counter is set to the full length of that level            |
    */
    // IMPORTANT:
    public takeOut(): T | null {
        if (this.name_table.size === 0) return null;

        if (this.emptyLevel(this.current_level) || this.current_counter === 0) {
            this.current_level = Bag.DISTRIBUTOR.pick(this.level_index);
            this.level_index = Bag.DISTRIBUTOR.next(this.level_index);
            while (this.emptyLevel(this.current_level)) {
                this.current_level = Bag.DISTRIBUTOR.pick(this.level_index);
                this.level_index = Bag.DISTRIBUTOR.next(this.level_index);
            }

            this.current_counter = this.current_level < Bag.THRESHOLD
                ? 1
                : this.item_table[this.current_level].length;
        }

        const selected = this.takeOutFirst(this.current_level);
        this.name_table.delete(selected.key);
        this.current_counter--;
        return selected;
    }

    public pickOut(key: string): T | null {
        const picked = this.name_table.get(key);
        if (picked) {
            this.outOfBase(picked);
            this.name_table.delete(key);
        }
        return picked || null;
    }

    public peek(key: string): T | null {
        return this.name_table.get(key) || null;
    }

    protected emptyLevel(n: number): boolean {
        return !this.item_table[n] || this.item_table[n].length === 0;
    }

    private getLevel(item: T): number {
        const level = Math.ceil(item.priority * Bag.TOTAL_LEVEL) - 1;
        return level < 0 ? 0 : level;
    }

    private intoBase(newItem: T): T | null {
        let oldItem: T | null = null;
        const inLevel = this.getLevel(newItem);

        if (this.size() > this.capacity) {
            let outLevel = 0;
            while (outLevel < Bag.TOTAL_LEVEL && this.emptyLevel(outLevel)) {
                outLevel++;
            }

            if (outLevel > inLevel) {
                return newItem;
            } else {
                oldItem = this.takeOutFirst(outLevel);
            }
        }

        if (!this.item_table[inLevel]) {
            this.item_table[inLevel] = [];
        }

        this.item_table[inLevel].push(newItem);
        this.mass += inLevel + 1;
        return oldItem;
    }

    private takeOutFirst(level: number): T {
        const selected = this.item_table[level][0];
        this.item_table[level].splice(0, 1);
        this.mass -= level + 1;
        return selected;
    }

    protected outOfBase(oldItem: T): void {
        const level = this.getLevel(oldItem);
        const index = this.item_table[level].indexOf(oldItem);
        if (index !== -1) {
            this.item_table[level].splice(index, 1);
            this.mass -= level + 1;
        }
    }

    public toString(): string {
        let buf = " ";
        for (let i = Bag.TOTAL_LEVEL; i >= this.show_level; i--) {
            if (!this.emptyLevel(i - 1)) {
                buf += `\n --- Level ${i}:\n `;
                this.item_table[i - 1].forEach(item => {
                    buf += `${item}\n `;
                });
            }
        }
        return buf;
    }

    public toStringLong(): string {
        let buf = ` BAG ${this.constructor.name} ${this.showSizes()}`;
        for (let i = Bag.TOTAL_LEVEL; i >= this.show_level; i--) {
            if (!this.emptyLevel(i - 1)) {
                buf += `\n --- LEVEL ${i}:\n `;
                this.item_table[i - 1].forEach(item => {
                    buf += `${item}\n `;
                });
            }
        }
        buf += `>>>> end of Bag ${this.constructor.name}`;
        return buf;
    }

    private showSizes(): string {
        let levels = 0;
        let sizes = " ";
        this.item_table.forEach(items => {
            if (items && items.length > 0) {
                levels++;
                sizes += `${items.length} `;
            }
        });
        return `Levels: ${levels}, sizes: ${sizes}`;
    }

    public setShowLevel(level: number): void {
        this.show_level = level;
    }
}

export { Bag };

class NovelTaskBag extends Bag<Task> {
    constructor() {
        super();
    }
}

export { NovelTaskBag };

export class ConceptBag extends Bag<Concept> {
    // ConceptBag specific implementations
    constructor() {
        super(Parameters.CONCEPT_BAG_SIZE);
    }
}

export class GlobalTaskBag extends Bag<Task> {
    // ConceptBag specific implementations
    constructor() {
        super(Parameters.GLOBAL_BUFFER_SIZE);
    }
}

class TaskLinkBag extends Bag<TaskLink> {
    constructor() {
        super();
    }
}

export { TaskLinkBag };

class TermLinkBag extends Bag<TermLink> {
    constructor() {
        super();
    }
}

export { TermLinkBag };
