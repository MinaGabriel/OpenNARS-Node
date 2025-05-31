import { Symbols } from "./Symbols";
import { Tense } from "./Enums";
import { Identifiable } from "./interfaces/Identifiable";
import { Sentence } from "./Sentence";

// Represents a single evidence entry with NAR and input identifiers
export class BaseEntry {
    constructor(
        public narId: number,
        public inputId: number // Task-specific evidence ID
    ) {}

    toString(): string {
        return `(${this.narId},${this.inputId})`;
    }

    equals(other?: BaseEntry): boolean {
        return !!other && this.narId === other.narId && this.inputId === other.inputId;
    }
}

export class Stamp implements Identifiable {
    private _evidentialBase: BaseEntry[] = [];
    private _creationTime: number = -1;
    public static readonly ETERNAL: number = -2147483648;
    private _occurrenceTime: number = 0;
    private _tense: Tense | null;
    private _name: string | null = null;
    private _evidentialHash: number | null = null;

    constructor(time: number, tense: Tense, serial: BaseEntry, duration: number) {
        this._evidentialBase.push(serial);
        this._tense = tense;
        this.setCreationTime(time, duration);
    }

    get evidentialBase(): BaseEntry[] {
        return [...this._evidentialBase];
    }

    set evidentialBase(entries: BaseEntry[]) {
        //empty the current base
        this._evidentialBase.length = 0;
        this._evidentialBase = [...entries];
    }

    get creationTime(): number {
        return this._creationTime;
    }

    set creationTime(time: number) {
        this._creationTime = time;
        this._name = null;
    }

    get occurrenceTime(): number {
        return this._occurrenceTime;
    }

    set occurrenceTime(time: number) {
        this.setOccurrenceTime(time);
    }

    get tense(): Tense | null {
        return this._tense;
    }

    set tense(t: Tense | null) {
        this._tense = t;
        this._name = null;
    }

    name(): string {
        if (this._name === null) {
            const base = this._evidentialBase.map(e => e.toString()).join(Symbols.STAMP_SEPARATOR);
            const timePart = this.isEternal() ? '' : `|${this._occurrenceTime}`;
            this._name = `${Symbols.STAMP_OPENER}${this._creationTime}${timePart} ${Symbols.STAMP_STARTER} ${base}${Symbols.STAMP_CLOSER} `;
        }
        return this._name;
    }

    toString(): string {
        return this.name();
    }

    public setCreationTime(time: number, duration: number): void {
        this._creationTime = this._occurrenceTime = time;

        if (this._tense == null) this._occurrenceTime = Stamp.ETERNAL;
        if (this._tense === Tense.Past) this._occurrenceTime = time - duration;
        if (this._tense === Tense.Future) this._occurrenceTime = time + duration;
        if (this._tense === Tense.Present) this._occurrenceTime = time;

        this._name = null;
    }

    public setOccurrenceTime(time: number): void {
        if (this._occurrenceTime !== time) {
            this._occurrenceTime = time;
            if (time === Stamp.ETERNAL) this._tense = Tense.Eternal;
            this._name = null;
        }
    }

    public evidentialHash(): number {
        if (this._evidentialHash === null) {
            const baseStrings = this._evidentialBase.map(e => e.toString()).sort();
            this._evidentialHash = this.hashStrings(baseStrings);
        }
        return this._evidentialHash;
    }

    private hashStrings(arr: string[]): number {
        let hash = 0;
        for (const str of arr) {
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0;
            }
        }
        return hash;
    }

    public isEternal(): boolean {
        return this._occurrenceTime === Stamp.ETERNAL;
    }

    public equals(
        other: Stamp,
        creationTimeCheck: boolean,
        occurrenceTimeCheck: boolean,
        evidentialBaseCheck: boolean
    ): boolean {
        if (this === other) return true;

        if (creationTimeCheck && this.creationTime !== other.creationTime) {
            return false;
        }

        if (occurrenceTimeCheck && this.occurrenceTime !== other.occurrenceTime) {
            return false;
        }

        if (evidentialBaseCheck) {
            if (this.evidentialHash() !== other.evidentialHash()) {
                return false;
            }

            const setA = this.evidentialBase.map(e => e.toString()).sort();
            const setB = other.evidentialBase.map(e => e.toString()).sort();

            if (setA.length !== setB.length) return false;

            for (let i = 0; i < setA.length; i++) {
                if (setA[i] !== setB[i]) return false;
            }
        }

        return true;
    }

    public static baseOverlap(a: Stamp, b: Stamp): boolean {
        const base1 = a.evidentialBase;
        const base2 = b.evidentialBase;

        if (base1.length === 0 || base2.length === 0) return false;

        const taskBase: { [key: string]: boolean } = {};
        const [smallerBase, largerBase] = base1.length <= base2.length ? [base1, base2] : [base2, base1];

        for (const entry of smallerBase) {
            const key = entry.toString();
            if (taskBase[key]) return true;
            taskBase[key] = true;
        }

        for (const entry of largerBase) {
            if (taskBase[entry.toString()]) return true;
        }

        return false;
    }
}
