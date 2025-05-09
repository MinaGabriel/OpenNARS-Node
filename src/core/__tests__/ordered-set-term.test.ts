import { ImmutableOrderedSet } from '../ImmutableOrderedSet';
import { Term, TermType } from '../Term';

describe('ImmutableOrderedSet for OpenNARS', () => {
    test('adds Term objects, ignores duplicates, and preserves order', () => {
        const term1 = new Term({ word: 'A', term_type: TermType.ATOM });
        let components = new ImmutableOrderedSet([term1], []);

        // Check initial state
        expect(components.toArray().map(term => term.word)).toEqual(['A']);
        expect(components.size).toBe(1);

        // Add a new term
        const term2 = new Term({ word: 'B', term_type: TermType.ATOM });
        components = components.add(term2);

        // Verify the new term is added
        expect(components.toArray().map(term => term.word)).toEqual(['A', 'B']);
        expect(components.size).toBe(2);

        // Add a duplicate term
        const term3 = new Term({ word: 'A', term_type: TermType.ATOM });
        components = components.add(term3);

        // Verify the duplicate term is ignored
        expect(components.toArray().map(term => term.word)).toEqual(['A', 'B']);
        expect(components.size).toBe(2);
    });

    test('computes correct set hash code', () => {
        const termA = new Term({ word: 'A', term_type: TermType.ATOM });
        const termB = new Term({ word: 'B', term_type: TermType.ATOM });
        const set = new ImmutableOrderedSet([termA, termB], []);

        // Compute hash code
        const hashCode = set.hashCode();

        // Verify the hash code is a number
        expect(typeof hashCode).toBe('number');
        expect(hashCode).toBeDefined();
    });

    test('handles empty sets correctly', () => {
        const emptySet = new ImmutableOrderedSet([], []);

        // Verify the set is empty
        expect(emptySet.size).toBe(0);
        expect(emptySet.toArray()).toEqual([]);
    });

    test('preserves order of terms', () => {
        const termA = new Term({ word: 'A', term_type: TermType.ATOM });
        const termB = new Term({ word: 'B', term_type: TermType.ATOM });
        const termC = new Term({ word: 'C', term_type: TermType.ATOM });

        const set = new ImmutableOrderedSet([termA, termB, termC], []);

        // Verify the order of terms
        expect(set.toArray().map(term => term.word)).toEqual(['A', 'B', 'C']);
    });
});
