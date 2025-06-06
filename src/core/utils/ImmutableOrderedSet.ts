import { OrderedSet, hash } from 'immutable';

class ImmutableOrderedSet<T> {
    private set: OrderedSet<T>;

    constructor(subjectTerms: T[] = [], predicateTerms: T[] = []) {
        this.set = OrderedSet<T>([...subjectTerms, ...predicateTerms]);
    }

    get size(): number {
        return this.set.size;
    }

    get(index: number): T {
        if (index < 0 || index >= this.set.size) {
            throw new Error(`Index ${index} is out of range`);
        }
        return this.toArray()[index];
    }

    indexOf(item: T): number {
        return this.toArray().findIndex(term => term === item || (term as any).equals?.(item));
    }

    hashCode(): number {
        const combined = this.toArray()
            .map(term => (term as any).hashCode?.() ?? hash(term))
            .reduce((acc, h) => acc ^ h, 0);
        return hash(combined);
    }

    toArray(): T[] {
        return this.set.toArray();
    }

    add(value: T): ImmutableOrderedSet<T> {
        const newSet = this.set.add(value);
        const clone = new ImmutableOrderedSet<T>();
        clone.set = newSet;
        return clone;
    }

    has(value: T): boolean {
        return this.set.has(value);
    }
}

export { ImmutableOrderedSet };
