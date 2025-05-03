import { Tense } from './Tense';
import { Global } from './Global';
import { Config } from './Config';
import { Base } from './Base';

class Stamp {
    t_creation: number;
    t_occurrence: number | null;
    t_put: number | null;
    evidential_base: Base | null;

    /**
     * Create a new Stamp instance
     * @param t_creation - The creation time
     * @param t_occurrence - The occurrence time (optional)
     * @param t_put - The put time (optional)
     * @param evidential_base - The evidential base (optional)
     */
    constructor(
        t_creation: number,
        t_occurrence: number | null = null,
        t_put: number | null = null,
        evidential_base: Base | null = null
    ) {
        this.t_creation = t_creation;
        this.t_occurrence = t_occurrence;
        this.t_put = t_put;
        this.evidential_base = evidential_base;
    }

    /**
     * Get the tense of the stamp
     * @returns The tense (Eternal, Future, Past, or Present)
     */
    get tense(): Tense {
        if (this.t_occurrence === null) return Tense.Eternal;
        if (this.t_occurrence >= Global.time + Config.temporal_duration) return Tense.Future;
        if (this.t_occurrence <= Global.time - Config.temporal_duration) return Tense.Past;
        return Tense.Present;
    }

    /**
     * Check if the stamp is eternal
     * @returns True if eternal, otherwise false
     */
    get is_eternal(): boolean {
        return this.t_occurrence === null;
    }

    /**
     * Make the stamp eternal by setting the occurrence time to null
     */
    eternalize(): void {
        this.t_occurrence = null;
    }

    /**
     * Extend the evidential base with another base
     * @param base - The base to extend with
     */
    extend_evidential_base(base: Base | null): void {
        if (!base) return;
        if (!this.evidential_base) {
            this.evidential_base = new Base([]);
        }
        this.evidential_base.extend(base);
    }

    /**
     * String representation of the stamp
     * @returns A string representation of the stamp
     */
    toString(): string {
        const evidence = this.evidential_base ? this.evidential_base.toString() : '';
        return `{${this.t_occurrence}: ${evidence}}`;
    }

    /**
     * Debug representation of the stamp
     * @returns A formatted string representation of the stamp
     */
    repr(): string {
        return `<Stamp: ${this.toString()}>`;
    }
}

export { Stamp };
