
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
import { Statement } from "../Statement";
import { LogFunctions } from "./LogFunctions";

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

    static printAnswers(answers: Sentence | Sentence[] | null): void {
        if (_.isNil(answers)) {
            LogFunctions.console.info("No answers available.");
            return;
        }

        const list = _.castArray(answers); // ensures it's always an array

        if (_.isEmpty(list)) {
            LogFunctions.console.warn("Answer list is empty.");
            return;
        }

        _.forEach(list, (answer, index) => {
            LogFunctions.console.answer(
                list.length > 1
                    ? ` ${index + 1}: ${answer.toString()}`
                    : ` ${answer.toString()}`
            );
        });
    }

    //TODO: USE LogFunctions
    static conceptBagTableView(): void {
        const memory = MemoryStore.getState().memory;
        const conceptBag = memory.conceptsBag;
        let counter = 1;

        const data: string[][] = _(conceptBag.item_table).flatten().map((concept) => {
            const term = concept as unknown as Term;
            const taskLinks = _(concept.taskLinks.item_table).flatten().value();
            const taskLinkData = _.map(taskLinks, t => `${t}`);
            const taskLinkBudget = _.map(taskLinks, t => colors.green(t.budget.toString()));
            const termLinks = _(concept.termLinks.item_table).flatten().value();
            const termLinkData = _.map(termLinks, t => `${t}`);
            const termLinkBudget = _.map(termLinks, t => colors.red(t.budget.toString()));
            const beliefData = _.map(concept.beliefs, (b: Task) =>
                `• ${colors.gray(b.budget.toString())} ${colors.cyan(b.sentence.toString())}`);
            const questionData = _.map(concept.questions, (q: Task) =>
                `• ${colors.magenta(q.sentence.toString())} ${colors.gray(q.budget.toString())}`);
            const contentData = _.compact(
                [...taskLinkData, ...termLinkData, '', 'Beliefs:', ...beliefData, '', 'Questions:', ...questionData]).join('\n');
            return [`${counter++}`, `${colors.yellow(term.toString())}\n${colors.blue(concept.budget.toString())}`, contentData];
        }).value();

        if (_.isEmpty(data)) { console.log(colors.yellow('Concepts table is empty.')); return; }

        console.log(table(data, { header: { alignment: 'center', content: 'Concepts TABLE' } }));
    }
}