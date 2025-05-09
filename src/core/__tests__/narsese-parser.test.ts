import { NarseseParser } from '../NarseseParser'; // Fixed relative import path
import chalk from 'chalk';

describe('NarseseParser', () => {
    let parser: NarseseParser; // Added type annotation for better TypeScript support

    beforeEach(() => {
        parser = new NarseseParser();
    });

    test('parses valid Narsese statement', () => {
        const input = "< M --> animal>.";
        const result = parser.parse(input);
        expect(result).toBeDefined(); // Ensure the result is defined
    });

    test('throws error for invalid Narsese statement', () => {
        const input = "Invalid Narsese";
        expect(() => parser.parse(input)).toThrow(); // Ensure an error is thrown for invalid input
    });
});