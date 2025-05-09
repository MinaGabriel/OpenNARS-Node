/*
It stores a floating-point number between 0 and 1, but instead of using a float internally, it stores it as a short integer (short = 16-bit integer).

Example:
Instead of storing 0.5678, it stores the integer 5678 and interprets it as 0.5678 when needed.

It ensures:
* 4-digit accuracy (values are rounded to 0.0001 resolution)
* validity check: only values between 0 and 1 are accepted
* custom string formatting (e.g., "0.5678" or rounded "0.56")
*/

export class ShortFloat {
    // ! mean: "I promise that this property will definitely be assigned before it's accessed"
    private readonly value!: number; // stores integer 0–10000

    constructor(v: number) {
        this.setValue(v);
    }

    public getValue(): number {
        return this.value * 0.0001;
    }

    public getShortValue(): number {
        return this.value;
    }

    public setValue(v: number): void {
        if (v < 0 || v > 1) {
            throw new Error(`Invalid value: ${v}. Value must be between 0 and 1`);
        }
        Object.defineProperty(this, 'value', {
            value: Math.round(v * 10000),
            writable: false
        });
    }

    public equals(that: unknown): boolean {
        if (!(that instanceof ShortFloat)) {
            return false;
        }
        return this.value === that.getShortValue();
    }

    public toString(): string {
        if (this.value === 10000) {
            return "1.0000";
        }
        const paddedValue = this.value.toString().padStart(4, "0");
        return `0.${paddedValue}`;
    }

    public toStringTwoDigits(): string {
        const fullString = this.toString();
        return fullString.substring(0, 4);
    }
}
