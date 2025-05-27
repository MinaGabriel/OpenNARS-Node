import ansi from 'ansi-colors';
import { Term } from '../core/Term';
import { Bag } from '../core/Bag';
import { Concept } from '../core/Concept';
import { Budget } from '../core/Budget';
import { table } from "table";
import { TaskLink } from '../core/TaskLink';
import _ from 'lodash';
import colors from 'ansi-colors';
import { TermLink } from '../core/TermLink';
import { MemoryStore } from '../core/MemoryStore';
import { Task } from '../core/Task';
import { Sentence } from '../core/Sentence';
import { Judgement } from '../core/Judgement';
import { Goal } from '../core/Goal';
import { Question } from '../core/Question';
import { Truth } from '../core/Truth';
import { ShortFloat } from './ShortFloat';

// Define argument type for print function
export type PrintArgs = {
    priority?: number;
    durability?: number;
    quality?: number;
};

// Define allowed print types
export type PrintType = 'IN' | 'OUT' | 'ERROR' | 'ANSWER' | 'ACHIEVED' | 'EXE' | 'INFO' | 'COMMENT';

// Map print types to ansi-colors functions
const colorMap: Record<PrintType, (text: string) => string> = {
    IN: ansi.blue,
    OUT: ansi.green,
    ERROR: ansi.red,
    ANSWER: ansi.yellow,
    ACHIEVED: ansi.cyan,
    EXE: ansi.magenta,
    INFO: ansi.white,
    COMMENT: ansi.gray
};

/**
 * Prints formatted output with optional priority, durability, and quality
 * @param type - Type of message
 * @param content - Message content
 * @param args - Optional metrics
 */
export function print(type: PrintType, content: string, args?: PrintArgs): void {
    const p = args?.priority?.toFixed(2) ?? '';
    const d = args?.durability?.toFixed(2) ?? '';
    const q = args?.quality?.toFixed(2) ?? '';

    const coloredType = colorMap[type](`${type} :`);

    console.log(`${p.padEnd(6)} ${d.padEnd(6)} ${q.padEnd(6)} ${coloredType} ${ansi.white(content)}`);
}

/**
 * Simple string hashing function using djb2 algorithm
 * @param str - String to hash
 * @returns 32-bit integer hash valueue
 * @throws Error if input is not a string
 */
export function hashString(str: string): number {
    if (typeof str !== 'string') {
        throw new Error('Input must be a string');
    }

    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) + hash) + char; // hash * 33 + char
    }
    return hash >>> 0; // Force unsigned 32-bit integer
}

/**
    * Arithmetic average (mean)
    * Formula: (x₁ + x₂ + ... + xₙ) / n
    * Example: aveAri(0.4, 0.6, 0.8) → (0.4 + 0.6 + 0.8) / 3 = 0.6
    */
export function average(...array: number[]): number {
    const sum = array.reduce((accumulator, value) => accumulator + value, 0); // 0 start of accumulator
    return sum / array.length;
}

/**
 * Probabilistic OR (independent probabilities)
 * Formula: 1 - ∏(1 - xᵢ)  → 1 minus the product over (1 - xᵢ)
 * Example: or(0.3, 0.5) → 1 - (1 - 0.3)(1 - 0.5) = 1 - (0.7 * 0.5) = 1 - 0.35 = 0.65
 */
export function or(...array: number[]): number {
    const product = array.reduce((accumulator, value) => accumulator * (1 - value), 1);
    return 1 - product;
}

/**
 * Probabilistic AND (independent probabilities)
 * Formula: ∏xᵢ → product over all xᵢ
 * Example: and(0.3, 0.5) → 0.3 * 0.5 = 0.15
 */
export function and(...array: number[]): number {
    return array.reduce((accumulator, value) => accumulator * value, 1);
}

export function mean(...arr: number[]): number {
    let sum = 0;
    for (const f of arr) {
        sum += f;
    }
    return sum / arr.length;
}

export function mapToStringObject<T>(map: Map<string, T>): { [key: string]: string } {
    const obj: { [key: string]: string } = {};
    map.forEach((value, key) => {
        obj[key] = String(value);
    });
    return obj;
}

function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
}

export function printTimeInfo(): void {
    const time = MemoryStore.getState().time;

    const now = time.now();
    const nowAbsolute = time.nowAbsolute();
    const clock = time.narsClock();

    const startTimestamp = new Date(nowAbsolute - now);
    const startFormatted = startTimestamp.toLocaleString();

    const data: string[][] = [
        [colors.bold('Time Detail'), colors.bold('Value')],
        ['Server Start Time', colors.green(startFormatted)],
        ['Current Time', colors.cyan(new Date(nowAbsolute).toLocaleString())],
        ['Uptime (ms)', colors.yellow(`${now}`)],
        ['Uptime (formatted)', colors.yellow(formatDuration(now))],
        ['Logical Clock Ticks', colors.magenta(`${clock}`)],
    ];

    console.log(table(data, {
        header: { alignment: 'center', content: colors.bold.whiteBright('🟩 Runtime Diagnostics') },
        columnDefault: { alignment: 'left' }
    }));
}
//TOOBAD:: +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


function w_to_c(w: number, k: number): number {
    return w / (w + k);
}

/**
 * Eternalizes a temporal truth value.
 * Reference:
 * [1] OpenNARS 3.1.0 TruthFunctions.java line 485~490
 * [2] Hammer et al., "The OpenNARS implementation of the non-axiomatic reasoning system."
 * 
 * $$c_{eternal} = \frac{1}{k + c_{temporal}}$$
 * 
 * @param truth - The temporal truth value to eternalize
 * @returns The eternalized truth value
 */

export function eternalize(truth: Truth): Truth {
    // Assuming w_to_c is a function that converts confidence and k to eternalized confidence
    // and Truth is a class or type with constructor Truth(f, c, k)
    return new Truth(Number(truth.frequency), w_to_c(Number(truth.confidence), Number(truth.k)));
}

/**
 * Projects a temporal truth value from one time to another.
 * Reference: p.172 Non-Axiomatic Logic — A Model of Intelligent Reasoning (Second Edition)
 */
export function project(truth: Truth, t_source: number, t_current: number, t_target: number): Truth {
    const v = Math.abs(t_source - t_target);

    let t_current_is_in_interval = false;
    if (t_source < t_target) {
        if (t_current >= t_source && t_current <= t_target) t_current_is_in_interval = true;
    } else {
        if (t_current <= t_source && t_current >= t_target) t_current_is_in_interval = true;
    }

    let s: number;
    if (t_current_is_in_interval) {
        s = 0.5;
    } else {
        s = Math.min(Math.abs(t_source - t_current), Math.abs(t_target - t_current));
    }

    const confidence_discount = 1 - v / (2 * s + v);
    const c_new = Number(truth.confidence) * confidence_discount;
    return new Truth(Number(truth.frequency), Number(c_new));
}

export function projectTruth(
    premise1: Judgement | Goal | Question,
    premise2: Judgement | Goal
): any {
    let truth = premise2.truth;
    if (!premise2.stamp.isEternal) {
        if (!premise1.stamp.isEternal) {
            const t_target = premise1.stamp.occurrenceTime;
            const t_source = premise2.stamp.occurrenceTime;
            const narsClock = MemoryStore.getState().time.narsClock?.() ?? 0;
            truth = project(truth, Number(t_source), narsClock, Number(t_target));
        }
        truth = eternalize(truth);
    }
    return truth;
}


export function solutionQuality(problem: Task, solution: Sentence, rateOfConfidence: boolean): number {
    if (problem.sentence.punctuation != solution.punctuation && solution.term.hasVariableQuery) return 0.0;
    let truth = solution.truth;

    // time of problem occurrence 
    const problemTime = problem.sentence.stamp.occurrenceTime;
    const solutionTime = solution.stamp.occurrenceTime;
    if (problemTime !== solutionTime) {
        truth = projectTruth(problem.sentence, solution);
    }
    if (!rateOfConfidence) {
        return truth.getExpectation();
    } else {
        return truth.confidence.getValue();
    }

}

//TOOBAD:: +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


export function conceptBagTableView(): void {
    const memory = MemoryStore.getState().memory;
    const conceptBag = memory.conceptsBag; // Uses your getter

    let data: string[][] = [];

    conceptBag.item_table.forEach((conceptArray: Concept[], i) => {
        conceptArray.forEach((concept: Concept, j) => {
            const term = concept as unknown as Term;
            const taskLinks = concept.taskLinks.item_table;
            let taskLinkData: string[] = [];
            let taskLinkBudget: string[] = [];

            taskLinks.forEach((taskLinkArray: TaskLink[]) => {
                taskLinkArray.forEach((taskLink: TaskLink) => {
                    taskLinkData.push(`${taskLink}`);
                    taskLinkBudget.push(`${colors.green(taskLink.budget.toString())}`);
                });
            });

            const termLinkData: string[] = [];
            const termLinkBudget: string[] = [];
            const termLinks = concept.termLinks.item_table;

            termLinks.forEach((termLinkArray: TermLink[]) => {
                termLinkArray.forEach((termLink: TermLink) => {
                    termLinkData.push(`${termLink}`);
                    termLinkBudget.push(`${colors.red(termLink.budget.toString())}`);
                });
            });

            data.push([
                `${i},${j}`,
                `${colors.bold(term.toString())} \n\n ${colors.blue(concept.budget.toString())}`,
                _.flatten(_.concat(taskLinkData, termLinkData)).join('\n'),
                _.flatten(_.concat(taskLinkBudget, termLinkBudget)).join('\n')
            ]);
        });
    });

    console.log(
        table(data, {
            header: { alignment: 'center', content: 'Concepts TABLE' }
        })
    );
}


// Export all utilities as a single object
export const utility = {
    print,
    hashString,
    average,
    or,
    and,
    mean,
    mapToStringObject,
    conceptBagTableView,
    projectTruth
} as const;
