import { OrderedSet } from 'immutable';

describe('OrderedSet for OpenNARS', () => {
    test('handles simple statement <A --> B>', () => {
        const components = OrderedSet(['A', 'B']);
        expect(components.toArray()).toEqual(['A', 'B']);
        expect(components.size).toBe(2);
    });

    test('removes duplicates in <A --> A>', () => {
        const components = OrderedSet(['A', 'A']);
        expect(components.toArray()).toEqual(['A']);
        expect(components.size).toBe(1);
    });

    test('processes compound terms in <{A, B} --> {B, C}>', () => {
        const components = OrderedSet(['A', 'B', 'B', 'C']);
        expect(components.toArray()).toEqual(['A', 'B', 'C']);
        expect(components.size).toBe(3);
    });

    test('manages nested statements in <<A --> B> --> <C --> D>>', () => {
        const components = OrderedSet(['A', 'B', 'C', 'D']);
        expect(components.toArray()).toEqual(['A', 'B', 'C', 'D']);
        expect(components.size).toBe(4);
    });

    test('supports variables in <A --> ?X>', () => {
        const components = OrderedSet(['A', '?X']);
        expect(components.toArray()).toEqual(['A', '?X']);
        expect(components.size).toBe(2);
    });

    test('handles larger set in <{A, B, C} --> {D, E}>', () => {
        const components = OrderedSet(['A', 'B', 'C', 'D', 'E']);
        expect(components.toArray()).toEqual(['A', 'B', 'C', 'D', 'E']);
        expect(components.size).toBe(5);
    });

    test('preserves order in <{C, B, A} --> {D, E}>', () => {
        const components = OrderedSet(['C', 'B', 'A', 'D', 'E']);
        expect(components.toArray()).toEqual(['C', 'B', 'A', 'D', 'E']);
        expect(components.size).toBe(5);
    });

    test('handles all duplicates in <{A, A} --> {A, A}>', () => {
        const components = OrderedSet(['A', 'A', 'A', 'A']);
        expect(components.toArray()).toEqual(['A']);
        expect(components.size).toBe(1);
    });

    test('processes mixed terms in <A --> {B, C}>', () => {
        const components = OrderedSet(['A', 'B', 'C']);
        expect(components.toArray()).toEqual(['A', 'B', 'C']);
        expect(components.size).toBe(3);
    });

    test('accesses term by index in <{A, B, C} --> {D, E}>', () => {
        const components = OrderedSet(['A', 'B', 'C', 'D', 'E']);
        expect(components.toArray()[0]).toBe('A');
        expect(components.toArray()[4]).toBe('E');
        expect(() => {
            if (components.toArray()[5] === undefined) {
                throw new Error('Term position 5 out of range');
            }
        }).toThrow('Term position 5 out of range');
    });

    test('finds term index in <A --> B>', () => {
        const components = OrderedSet(['A', 'B']);
        const indexB = components.toArray().indexOf('B');
        const indexC = components.toArray().indexOf('C');
        expect(indexB).toBe(1);
        expect(indexC).toBe(-1);
    });
});
