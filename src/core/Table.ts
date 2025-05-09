
/**
 * Table<T> Sorted Double-Ended Priority Queue.
 *
 * A bounded priority table that stores items (like tasks or beliefs) with associated priorities.
 * 
 * Features:
 * - Add items with a priority (highest priority comes first)
 * - Automatically removes duplicates when adding (keeps the latest priority)
 * - Automatically trims the list to the specified capacity (drops lowest-priority items)
 * - Access the highest (first) and lowest (last) priority items
 * - Retrieve all items, priorities, or (item, priority) pairs
 * - Iterable: can use for...of or spread to loop through values
 * - Provides length, empty check, and string summary
 * 
 * Example:
 * 
 * interface Task {
 *     id: string;
 * }
 * 
 * const table = new Table<Task>(3);  // capacity 3
 * 
 * table.add({ id: 'task1' }, 10);
 * table.add({ id: 'task2' }, 5);
 * table.add({ id: 'task3' }, 8);
 * table.add({ id: 'task1' }, 15); // replaces old task1 with new priority
 * 
 * console.log(table.first()); // { id: 'task1' } (priority 15)
 * console.log(table.last());  // { id: 'task2' } (priority 5)
 * console.log([...table]);    // [{id: 'task1'}, {id: 'task3'}, {id: 'task2'}]
 * console.log(table.length);  // 3
 * 
 * console.log(table.toString()); // <Table: #items=3, capacity=3>
 */

export interface TableItem<T> {
    value: T;
    priority: number;
}


export class Table<T> {
    private _table: TableItem<T>[] = [];
    private capacity: number;

    constructor(capacity: number) {
        this.capacity = capacity;
    }

    /** Add item with priority; if duplicate, remove old before adding new */
    add(item: T, priority: number): void {
        const index = this._table.findIndex(entry => this._isEqual(entry.value, item));
        if (index !== -1) {
            this._table.splice(index, 1);
        }
        this._table.push({ value: item, priority });
        this._table.sort((a, b) => b.priority - a.priority); // highest first

        if (this._table.length > this.capacity) {
            this._table.pop(); // remove lowest
        }
    }

    /** Check if table is empty */
    get empty(): boolean {
        return this._table.length === 0;
    }

    /** Get highest priority item */
    first(): T | undefined {
        return this._table.length > 0 ? this._table[0].value : undefined;
    }

    /** Get lowest priority item */
    last(): T | undefined {
        return this._table.length > 0 ? this._table[this._table.length - 1].value : undefined;
    }

    /** Get all values */
    values(): T[] {
        return this._table.map(entry => entry.value);
    }

    /** Get all (value, priority) pairs */
    items(): TableItem<T>[] {
        return [...this._table];
    }

    /** Get all priorities */
    keys(): number[] {
        return this._table.map(entry => entry.priority);
    }

    /** Access by index */
    get(idx: number): T | undefined {
        return this._table[idx]?.value;
    }

    /** Get current length */
    get length(): number {
        return this._table.length;
    }

    /** Iterator over values */
    [Symbol.iterator](): Iterator<T> {
        let index = 0;
        const data = this._table;
        return {
            next(): IteratorResult<T> {
                if (index < data.length) {
                    return { value: data[index++].value, done: false };
                } else {
                    return { value: undefined as any, done: true };
                }
            }
        };
    }

    /** String representation */
    toString(): string {
        return `<Table: #items=${this.length}, capacity=${this.capacity}>`;
    }

    /** Helper for equality check */
    private _isEqual(a: any, b: any): boolean {
        try {
            return JSON.stringify(a) === JSON.stringify(b);
        } catch {
            return a === b;
        }
    }
}
