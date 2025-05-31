import { Identifiable } from './interfaces/Identifiable';
import { ShortFloat } from './ShortFloat';
import { Symbols } from './Symbols';
import numeral from 'numeral';

/**
 * Represents a truth value with frequency and confidence.
 * Implements NARS truth value logic.
 */
export class Truth implements Identifiable {
    delimiter: string = Symbols.TRUTH_VALUE_MARK;
    separator: string = Symbols.VALUE_SEPARATOR;

    frequency: ShortFloat;
    confidence: ShortFloat;
    // k is a constant used in the expectation calculation, defaulting to 1
    k: number = 1;

    constructor(f: number, c: number) {
        this.frequency = new ShortFloat(f);
        this.confidence = new ShortFloat(c);
    }

    /**
     * Returns a formatted string representation of the truth value.
     */
    name(): string {
        return `${this.delimiter}${numeral(this.frequency).format('0.00')}${this.separator}${numeral(this.confidence).format('0.00')}${this.delimiter}`;
    }

    /**
     * Returns the string representation of the truth value.
     */
    toString(): string {
        return this.name();
    }

    /**
     * Gets the frequency as a number.
     */
    public getFrequency(): number {
        return this.frequency.getValue();
    }

    /**
     * Gets the confidence as a number.
     */
    public getConfidence(): number {
        return this.confidence.getValue();
    }

    /**
     * Calculates the expectation value.
     */
    public getExpectation(): number {
        return this.getConfidence() * (this.getFrequency() - 0.5) + 0.5;
    }

    /**
     * Returns the absolute difference between a given expectation and this truth's expectation.
     */
    public getExpDifAbs(e: number): number {
        return Math.abs(e - this.getExpectation());
    }

    /**
     * Returns the absolute difference between this and another truth's expectation.
     */
    public getExpDifAbsFromTruth(t: Truth): number {
        return this.getExpDifAbs(t.getExpectation());
    }

    /**
     * Checks if another object is a Truth and has the same frequency and confidence.
     */
    public equals(that: unknown): boolean {
        return (
            that instanceof Truth &&
            this.getFrequency() === that.getFrequency() &&
            this.getConfidence() === that.getConfidence()
        );
    }
}

