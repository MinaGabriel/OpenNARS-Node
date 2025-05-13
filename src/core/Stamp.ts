/* MIT License (c) 2019 The OpenNARS authors */

import { Parameters } from "./Parameters";
import { Symbols } from "./Symbols";

export class Stamp {
    private static current_serial: number = 0;
    private evidential_base: number[];
    private base_length: number;
    private creation_time: number;

    constructor(time: number);
    constructor(old: Stamp);
    constructor(first: Stamp, second: Stamp, time: number);
    constructor(...args: any[]) {
        if (typeof args[0] === 'number' && args.length === 1) {
            // new Stamp(time)
            Stamp.current_serial++;
            this.base_length = 1;
            this.evidential_base = [Stamp.current_serial];
            this.creation_time = args[0];
        } else if (args[0] instanceof Stamp && args.length === 1) {
            // clone Stamp(old)
            const old: Stamp = args[0];
            this.base_length = old.length();
            this.evidential_base = [...old.get_base()];
            this.creation_time = old.get_creation_time();
        } else if (args[0] instanceof Stamp && args[1] instanceof Stamp && typeof args[2] === 'number') {
            // merge Stamp(first, second, time)
            const [first, second, time] = args;
            this.base_length = Math.min(first.length() + second.length(), Parameters.MAXIMUM_STAMP_LENGTH);
            this.evidential_base = [];
            let i1 = 0, i2 = 0;
            while (i2 < second.length() && this.evidential_base.length < this.base_length) {
                this.evidential_base.push(first.get(i1++));
                this.evidential_base.push(second.get(i2++));
            }
            while (i1 < first.length() && this.evidential_base.length < this.base_length) {
                this.evidential_base.push(first.get(i1++));
            }
            this.creation_time = time;
        } else {
            throw new Error('Invalid constructor arguments');
        }
    }

    static make(first: Stamp, second: Stamp, time: number): Stamp | null {
        for (let i = 0; i < first.length(); i++) {
            for (let j = 0; j < second.length(); j++) {
                if (first.get(i) === second.get(j)) {
                    return null;
                }
            }
        }
        return first.length() > second.length()
            ? new Stamp(first, second, time)
            : new Stamp(second, first, time);
    }

    static init(): void {
        Stamp.current_serial = 0;
    }

    length(): number {
        return this.base_length;
    }

    get(index: number): number {
        return this.evidential_base[index];
    }

    get_base(): number[] {
        return this.evidential_base;
    }

    to_set(): Set<number> {
        return new Set(this.evidential_base);
    }

    equals(other: any): boolean {
        if (!(other instanceof Stamp)) {
            return false;
        }
        const set1 = this.to_set();
        const set2 = other.to_set();
        if (set1.size !== set2.size) return false;
        for (let val of set1) {
            if (!set2.has(val)) return false;
        }
        return true;
    }

    hashCode(): number {
        return this.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    }

    get_creation_time(): number {
        return this.creation_time;
    }

    toString(): string {
        const base_str = this.evidential_base.join(Symbols.STAMP_SEPARATOR);
        return `${Symbols.STAMP_OPENER}${this.creation_time} ${Symbols.STAMP_STARTER} ${base_str}${Symbols.STAMP_CLOSER}`;
    }
}
