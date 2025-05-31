// ───── Imports ─────
import { Budget } from "./Budget";
import { Concept } from "./Concept";
import { Sentence } from "./Sentence";
import { Truth } from "./Truth";
import { Term } from '../core/Term';
import { table } from "table"; //  npm install table
import _ from 'lodash';
import colors from 'ansi-colors';
import { MemoryStore } from '../core/MemoryStore';
import { Task } from '../core/Task';
import { Judgement } from '../core/Judgement';
import { Goal } from '../core/Goal';
import { Question } from '../core/Question';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import stringify from 'json-stringify-pretty-compact';
import { Parameters } from "./Parameters";
import { TemporalTypes } from "./Enums";
import { Stamp } from "./Stamp";
// ───── Budget Functions ─────
export class BudgetFunctions {
    static truthToQuality(truth: Truth): number {
        const exp = truth.getExpectation();
        return Math.max(exp, (1.0 - exp) * 0.75);
    }
    static rankBelief(judgement: Sentence, rankTruthExpectation: boolean): number {
        // Rank based on truth expectation or confidence
        if (rankTruthExpectation) {
            return judgement.truth.getExpectation();
        } else {
            return judgement.truth.confidence.getValue();
        }
    }

    static forget(budget: Budget, forget_rate: number, RELATIVE_THRESHOLD: number): void {
        let quality = budget.quality * RELATIVE_THRESHOLD;
        const priority = budget.priority - quality;
        if (priority > 0) {
            quality += priority * Math.pow(budget.durability, 1.0 / (forget_rate * priority));
        }
        budget.priority = quality;
    }

    static activate(concept: Concept, budget: Budget): void {
        const priority = MathFunctions.or(concept.priority, budget.priority);
        const durability = MathFunctions.mean(concept.durability, budget.durability);
        concept.priority = priority;
        concept.durability = durability;
        // quality remains unchanged
    }

    static merge(base: Budget, adjuster: Budget): void {
        base.priority = adjuster.priority;
        base.durability = Math.max(base.durability, adjuster.durability);
        base.quality = Math.max(base.quality, adjuster.quality);
    }
}

// ───── Math Functions ─────
export class MathFunctions {
    static average(...array: number[]): number {
        return array.reduce((acc, val) => acc + val, 0) / array.length;
    }

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

// ───── Truth Temporal Projection and Quality ─────
export class RuleFunctions {

    static revisable(sentence_1: Sentence, sentence_2: Sentence): boolean {
        // Conditions for revision in revisable(s1, s2):
        // - Temporal distance: Non-eternal sentences' and |occurrenceTime1 - occurrenceTime2| ≤ REVISION_MAX_OCCURRENCE_DISTANCE.
        // - Term indices: Must match exactly if both terms have indices. //TODO: Implement this check.
        // - Revisable: sentence_1 must be revisable (implication, equivalence, or no dependent variables).
        // - Temporal order: Orders must match or one must be ORDER_NONE.
        // - Term equivalence: Terms must be equal after interval normalization.
        // - Evidential base: No overlap between stamps' evidential bases.

        // Temporal condition: Allow revision if at least one is eternal or times are close enough
        if (!sentence_1.stamp.isEternal() && !sentence_2.stamp.isEternal()) {
            if (Math.abs(sentence_1.stamp.occurrenceTime - sentence_2.stamp.occurrenceTime) > Parameters.REVISION_MAX_OCCURRENCE_DISTANCE) {
                return false;
            }
        }

        if (!sentence_1.isRevisable()) return false;

        if (sentence_1.term.temporalOrder != sentence_2.term.temporalOrder &&
            sentence_1.term.temporalOrder != TemporalTypes.ORDER_NONE &&
            sentence_2.term.temporalOrder != TemporalTypes.ORDER_NONE) return false;

        //TODO:: Implement compound term equivalence check

        if (Stamp.baseOverlap(sentence_1.stamp, sentence_2.stamp)) return false;

        return true;

    }

    static w_to_c(w: number, k: number): number {
        return w / (w + k);
    }

    //convert time to timeless Truth c' = c/(c + k)
    static eternalize(truth: Truth): Truth {
        return new Truth(Number(truth.frequency), this.w_to_c(Number(truth.confidence), Number(truth.k)));
    }

    //three different time points: t_source (belief: <rain --> morning>), t_current: current time, t_target: query time <rain --> afternoon>?
    // s = 0.5 if t_current is in the interval [t_source, t_target] or [t_target, t_source]
    // s = min(|t_source - t_current|, |t_target - t_current|) otherwise
    // confidence_discount = 1 - v / (2 * s + v)
    // where v = |t_source - t_target|
    // c_new = truth.confidence * confidence_discount
    static project(truth: Truth, t_source: number, t_current: number, t_target: number): Truth {
        const v = Math.abs(t_source - t_target);
        const inInterval = t_source < t_target
            ? t_current >= t_source && t_current <= t_target
            : t_current <= t_source && t_current >= t_target;

        const s = inInterval ? 0.5 : Math.min(Math.abs(t_source - t_current), Math.abs(t_target - t_current));
        const confidence_discount = 1 - v / (2 * s + v);
        const c_new = Number(truth.confidence) * confidence_discount;

        return new Truth(Number(truth.frequency), Number(c_new));
    }

    static projectTruth(premise1: Judgement | Goal | Question, premise2: Judgement | Goal): Truth {
        let truth = premise2.truth;
        if (!premise2.stamp.isEternal && !premise1.stamp.isEternal) {
            const t_target = premise1.stamp.occurrenceTime;
            const t_source = premise2.stamp.occurrenceTime;
            const now = MemoryStore.getState().time.narsClock?.() ?? 0;
            truth = this.project(truth, Number(t_source), now, Number(t_target));
        }
        return this.eternalize(truth);
    }
 
    static solutionQuality(problem: Task, solution: Sentence, rateOfConfidence: boolean): number {
        if (problem.sentence.punctuation !== solution.punctuation && solution.term.hasVariableQuery()) return 0.0;

        let truth = solution.truth;
        if (problem.sentence.stamp.occurrenceTime !== solution.stamp.occurrenceTime) {
            truth = this.projectTruth(problem.sentence, solution);
        }
        // Quality = expectation / (triple square root of (complexity * r_term_complexity_unit))
        const complexity = solution.term.complexity;
        const rTermComplexityUnit = Parameters.COMPLEXITY_UNIT; // System-defined constant
        return rateOfConfidence ? truth.confidence.getValue() : truth.getExpectation() / Math.sqrt(Math.sqrt(Math.sqrt(complexity * rTermComplexityUnit)));
    }
}

// ───── String Utilities ─────
export class StringFunctions {
    static mapToStringObject<T>(map: Map<string, T>): { [key: string]: string } {
        const obj: { [key: string]: string } = {};
        map.forEach((value, key) => {
            obj[key] = String(value);
        });
        return obj;
    }
}

// ───── Print and Debug Views ─────
export class PrintHelper {
    private static formatDuration(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${seconds}s`;
    }

    static printTimeInfo(): void {
        const time = MemoryStore.getState().time;
        const now = time.now();
        const nowAbsolute = time.nowAbsolute();
        const clock = time.narsClock();

        const startFormatted = new Date(nowAbsolute - now).toLocaleString();

        const data: string[][] = [
            [colors.bold('Time Detail'), colors.bold('Value')],
            ['Server Start Time', colors.green(startFormatted)],
            ['Current Time', colors.cyan(new Date(nowAbsolute).toLocaleString())],
            ['Uptime (ms)', colors.yellow(`${now}`)],
            ['Uptime (formatted)', colors.yellow(this.formatDuration(now))],
            ['Logical Clock Ticks', colors.magenta(`${clock}`)],
        ];

        console.log(table(data, {
            header: { alignment: 'center', content: colors.bold.whiteBright('🟩 Runtime Diagnostics') },
            columnDefault: { alignment: 'left' }
        }));
    }

    static globalTaskBagTableView(): void {
        const memory = MemoryStore.getState().memory;
        const globalTasksBag = memory.globalTasksBag;
        const data: string[][] = [];
        globalTasksBag.item_table.flat().forEach((task, index) => {
            const taskType: string = task.sentence.isJudgement() ? 'Judgement' :
                task.sentence.isGoal() ? 'Goal' :
                    task.sentence.isQuestion() ? 'Question' : 'Unknown';
            data.push([
                `${index}`,
                `${colors.blue(task.toString())}`,
                `${taskType}`,
                `${task.budget.toString()}`
            ]);
        }
        );
        if (data.length === 0) {
            console.log(colors.yellow('Tasks table is empty.'));
            return;
        }
        console.log(table(data, {
            header: { alignment: 'center', content: 'Global Task Bag TABLE' }
        }));
    }

    static conceptBagTableView(): void {
        const memory = MemoryStore.getState().memory;
        const conceptBag = memory.conceptsBag;
        let counter = 1
        const data: string[][] = [];

        conceptBag.item_table.forEach((conceptArray, i) => {
            conceptArray.forEach((concept, j) => {
                const term = concept as unknown as Term;

                // Task links
                const taskLinkData = concept.taskLinks.item_table.flatMap(a =>
                    a.map(t => `${t}`));
                const taskLinkBudget = concept.taskLinks.item_table.flatMap(a =>
                    a.map(t => colors.green(t.budget.toString())));

                // Term links
                const termLinkData = concept.termLinks.item_table.flatMap(a =>
                    a.map(t => `${t}`));
                const termLinkBudget = concept.termLinks.item_table.flatMap(a =>
                    a.map(t => colors.red(t.budget.toString())));

                // Beliefs
                const beliefData = concept.beliefs.map((b: Task) =>
                    `• ${colors.cyan(b.sentence.toString())} ${colors.gray(b.budget.toString())}`
                );

                data.push([
                    `${counter++}`,
                    `${colors.yellow(term.toString())}\n${colors.blue(concept.budget.toString())}`,
                    [...taskLinkData, ...termLinkData, '', 'Beliefs:', ...beliefData].join('\n'),
                    [...taskLinkBudget, ...termLinkBudget].join('\n')
                ]);
            });
        });

        if (data.length === 0) {
            console.log(colors.yellow('Concepts table is empty.'));
            return;
        }

        console.log(table(data, {
            header: { alignment: 'center', content: 'Concepts TABLE' }
        }));
    }
}


export class LogHelper {
    private static logDir = './logs';
    private static logFile = path.join(LogHelper.logDir, 'app.log');

    private static consoleLogger = winston.createLogger({
        level: 'info',
        format: winston.format.printf(({ level, message }) => {
            let coloredMessage = message;
            if (level === 'info') coloredMessage = colors.green(message as string);
            else if (level === 'warn') coloredMessage = colors.yellow(message as string);
            else if (level === 'error') coloredMessage = colors.red(message as string);
            return `[${level.toUpperCase()}]: ${coloredMessage}`;
        }),
        transports: [new winston.transports.Console()],
    });

    private static fileLogger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message }) => {
                return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
            })
        ),
        transports: [new winston.transports.File({ filename: LogHelper.logFile })],
    });

    static setup(): void {
        if (!fs.existsSync(LogHelper.logDir)) {
            fs.mkdirSync(LogHelper.logDir);
        }
        fs.writeFileSync(LogHelper.logFile, '', 'utf8'); // clear on start
    }

    static info(msg: string): void {
        LogHelper.consoleLogger.info(msg);
        LogHelper.fileLogger.info(msg);
    }

    static warn(msg: string): void {
        LogHelper.consoleLogger.warn(msg);
        LogHelper.fileLogger.warn(msg);
    }

    static error(msg: string): void {
        LogHelper.consoleLogger.error(msg);
        LogHelper.fileLogger.error(msg);
    }

    static appendJson(label: string, obj: any): void {
        LogHelper.fileLogger.info(`${label}:\n${stringify(obj)}`);
    }
}


// ───── Central Access Point ─────
export class System {
    static Budget = BudgetFunctions;
    static Math = MathFunctions;
    static Print = PrintHelper;
    static String = StringFunctions;
    static Log = LogHelper;
    static Rule = RuleFunctions;
    static Memory: any;
}
