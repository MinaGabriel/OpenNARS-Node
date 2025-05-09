import { ShortFloat } from '../utils/ShortFloat';
import { Symbols } from './Symbols';
class Truth {
    delimiter: string = Symbols.TRUTH_VALUE_MARK;
    separator: string = Symbols.VALUE_SEPARATOR;

    frequency: ShortFloat;
    confidence: ShortFloat;

    constructor(f: number, c: number) {
        this.frequency = new ShortFloat(f);
        this.confidence = new ShortFloat(c);
    }

    public getFrequency(): number {
        return this.frequency.getValue();
    }

    public getConfidence(): number {
        return this.confidence.getValue();
    }

    public getExpectation(): number {
        return this.confidence.getValue() * (this.frequency.getValue() - 0.5) + 0.5;
    }

    public getExpDifAbs(e: number): number {
        return Math.abs(e - this.getExpectation());
    }

    public getExpDifAbsFromTruth(t: Truth): number {
        return this.getExpDifAbs(t.getExpectation());
    }

    public equals(that: unknown): boolean {
        return (
            that instanceof Truth &&
            this.getFrequency() === that.getFrequency() &&
            this.getConfidence() === that.getConfidence()
        );
    }

    public toString(): string {
        return (
            this.delimiter +
            this.frequency.toString() +
            this.separator +
            this.confidence.toString() +
            this.delimiter
        );
    }

}

export { Truth };
