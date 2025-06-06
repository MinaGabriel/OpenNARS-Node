// ───── Imports ─────
import { Budget } from "../Budget";
import { Concept } from "../Concept";
import { Sentence } from "../Sentence";
import { Truth } from "../Truth";
import { Term } from '../Term';
import { table } from "table"; //  npm install table
import _ from 'lodash';
import colors from 'ansi-colors';
import { MemoryStore } from '../storage/MemoryStore';
import { Task } from '../Task';
import { Judgement } from '../Judgement';
import { Goal } from '../Goal';
import { Question } from '../Question';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import stringify from 'json-stringify-pretty-compact';
import { Parameters } from "../Parameters";
import { TemporalTypes } from "../enums/Enums";
import { Stamp } from "../Stamp";
export class MathFunctions {

    /**
     * Computes the arithmetic mean of multiple truth value components (frequencies or confidences).
     * Implements the average function for budget calculations in Non-Axiomatic Logic (NAL).
     * 
     * Reference:
     *   - Section 6.2: Budget Functions, p. 143
     *     - General principles for budget management (priority, durability, quality)
     *   - Section 4.1: Belief Revision, pp. 45–50
     *     - Budget adjustments during belief revision
     *   - PyNARS Budget_revision (pynars.NAL.Functions.BudgetFunctions)
     *     - Used in budget revision to compute durability (e.g., Average(diff, durability))
     *   - OpenNARS 3.1.0 BudgetFunctions.java, lines 72–118
     *     - Budget revision based on truth value differences
     *   - Formula: average(x1, ..., xn) = (x1 + x2 + ... + xn) / n
     * 
     * @param values - Array of numbers in [0, 1] (frequencies or confidences)
     * @returns Arithmetic mean of values, or 0 if array is empty
     */
    static average = (...values: number[]): number => {
        return values.length === 0 ? 0 : values.reduce((acc, val) => acc + val, 0) / values.length;
    };
    static or(...array: number[]): number {
        return 1 - array.reduce((acc, val) => acc * (1 - val), 1);
    }

    static and(...array: number[]): number {
        return array.reduce((acc, val) => acc * val, 1);
    }

    static mean(...arr: number[]): number {
        return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }

    static randomSigned64Bit(): bigint {
        const buf = new Uint8Array(8);
        crypto.getRandomValues(buf);
        const hex = [...buf].map(b => b.toString(16).padStart(2, '0')).join('');
        return BigInt.asIntN(64, BigInt('0x' + hex));
    }
}
