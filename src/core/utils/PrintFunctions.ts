
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

export class PrintFunctions {
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