/**
 * Represents a single evidence entry with NAR and input identifiers.
 */
export class BaseEntry {
    constructor(
        public readonly narId: number,
        public readonly inputId: number
    ) { }

    toString(): string {
        return `(${this.narId},${this.inputId})`;
    }

    equals(other?: BaseEntry): boolean {
        return !!other && this.narId === other.narId && this.inputId === other.inputId;
    }
}

/**
 * Represents a stamp in NARS, containing evidential base and temporal information.
 * Implements identifiable interface for Non-Axiomatic Logic (NAL).
 */
import { Symbols } from "./enums/Symbols";
import { Tense } from "./enums/Enums";
import { Identifiable } from "./interface/Identifiable";
import { Connector } from "./Connector";
import { Copula } from "./Copula";
import { MemoryStore } from "./storage/MemoryStore";
import { Parameters } from "./Parameters";
import cloneDeep from "clone-deep";
import _ from "lodash";

export class Stamp implements Identifiable {
    private readonly _evidentialBase: BaseEntry[];
    private _creationTime: number;
    private _occurrenceTime: number;
    private readonly _tense: Tense | null;
    private _name: string | null;
    private _evidentialHash: number | null;
    public static readonly ETERNAL: number = -2147483648;

    constructor(time: number, tense: Tense | null, serial: BaseEntry, duration: number) {
        this._evidentialBase = [serial];
        this._tense = tense;
        this._name = null;
        this._evidentialHash = null;
        this._creationTime = time;
        this._occurrenceTime = this.calculateOccurrenceTime(time, tense, duration);
    }

    get evidentialBase(): BaseEntry[] {
        return [...this._evidentialBase];
    }

    set evidentialBase(entries: BaseEntry[]) {
        this._evidentialBase.length = 0;
        this._evidentialBase.push(...entries);
        this._evidentialHash = null;
        this._name = null;
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
        if (this._occurrenceTime !== time) {
            this._occurrenceTime = time;
            this._name = null;
        }
    }

    get tense(): Tense | null {
        return this._tense;
    }

    name(): string {
        if (!this._name) {
            const base = this._evidentialBase.map(e => e.toString()).join(Symbols.STAMP_SEPARATOR);
            const timePart = this.isEternal() ? '' : `|${this._occurrenceTime}`;
            this._name = `${Symbols.STAMP_OPENER}${this._creationTime}${timePart} ${Symbols.STAMP_STARTER} ${base}${Symbols.STAMP_CLOSER}`;
        }
        return this._name;
    }

    toString(): string {
        return this.name();
    }

    private calculateOccurrenceTime(time: number, tense: Tense | null, duration: number): number {
        if (tense === null || tense === Tense.Eternal) return Stamp.ETERNAL;
        if (tense === Tense.Past) return time - duration;
        if (tense === Tense.Future) return time + duration;
        return time; // Tense.Present
    }

    evidentialHash(): number {
        if (this._evidentialHash === null) {
            const baseStrings = this._evidentialBase.map(e => e.toString()).sort();
            let hash = 0;
            for (const str of baseStrings) {
                for (let i = 0; i < str.length; i++) {
                    hash = (hash * 31 + str.charCodeAt(i)) | 0;
                }
            }
            this._evidentialHash = hash;
        }
        return this._evidentialHash;
    }

    isEternal(): boolean {
        return this._occurrenceTime === Stamp.ETERNAL;
    }

    equals(other: Stamp, creationTimeCheck: boolean, occurrenceTimeCheck: boolean, evidentialBaseCheck: boolean): boolean {
        if (this === other) return true;
        if (creationTimeCheck && this._creationTime !== other._creationTime) return false;
        if (occurrenceTimeCheck && this._occurrenceTime !== other._occurrenceTime) return false;
        if (evidentialBaseCheck && this.evidentialHash() !== other.evidentialHash()) return false;
        return true;
    }

    static baseOverlap(a: Stamp, b: Stamp): boolean {
        const base1 = a.evidentialBase;
        const base2 = b.evidentialBase;
        if (!base1.length || !base2.length) return false;
        const set = new Set(base1.map(e => e.toString()));
        return base2.some(e => set.has(e.toString()));
    }
}