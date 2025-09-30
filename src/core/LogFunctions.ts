// LogFunctions.ts
import fs from "fs";
import path from "path";
import colors from "ansi-colors";
import stringify from "json-stringify-pretty-compact";
// ───── Imports ───── 
import { Sentence } from "./nalCorePrimitives"; 
import { Term } from './nalCorePrimitives';
import { table } from "table"; //  npm install table
import _ from 'lodash';
import { MemoryStore } from './Memory';
import { Task } from './nalCorePrimitives';

export class LogFunctions {
  private static logDir = path.resolve(__dirname, "./");
  private static logFile = path.join(this.logDir, "app.log");
  private static initialized = false;

  static init(filename = "app.log"): void {
    if (this.initialized) return;
    this.logFile = path.join(this.logDir, filename);
    fs.mkdirSync(this.logDir, { recursive: true });
    if (fs.existsSync(this.logFile)) fs.unlinkSync(this.logFile);
    fs.writeFileSync(this.logFile, "", "utf8");
    this.initialized = true;
    this.both.info("LogFunctions initialized - file and console logging active");
  }

  private static ensureInit(): void { if (!this.initialized) this.init(); }

  private static writeToFile(level: string, msg: string): void {
    this.ensureInit();
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level}]: ${msg}\n`;
    fs.appendFileSync(this.logFile, line);
  }

  private static writeToConsole(level: string, msg: string): void {
    const colorMap = {
      INFO: colors.green,
      WARN: colors.yellow,
      ERROR: colors.red,
      ANSWER: colors.bold.bgGreen, // <- New distinct color for answers
      DERIVED: colors.bgBlue
    };
    const colorFn = colorMap[level as keyof typeof colorMap] || ((x: string) => x);
    console.log(`[${level}]: ${colorFn(msg)}`);
  }

  // ═══ CONSOLE ONLY LOGGING ═══
  static console = {
    info: (msg: string) => LogFunctions.writeToConsole("INFO", msg),
    warn: (msg: string) => LogFunctions.writeToConsole("WARN", msg),
    error: (msg: string) => LogFunctions.writeToConsole("ERROR", msg),
    answer: (msg: string) => LogFunctions.writeToConsole("ANSWER", msg), 
    derived: (msg: string) => LogFunctions.writeToConsole("DERIVED", msg), 
    json: (label: string, obj: unknown) => LogFunctions.writeToConsole("INFO", `${label}:\n${stringify(obj)}`)
  };

  // ═══ FILE ONLY LOGGING ═══
  static file = {
    info: (msg: string) => LogFunctions.writeToFile("INFO", msg),
    warn: (msg: string) => LogFunctions.writeToFile("WARN", msg),
    error: (msg: string) => LogFunctions.writeToFile("ERROR", msg),
    answer: (msg: string) => LogFunctions.writeToFile("ANSWER", msg),
    derived: (msg: string) => LogFunctions.writeToConsole("DERIVED", msg), 
    json: (label: string, obj: unknown) => LogFunctions.writeToFile("INFO", `${label}:\n${stringify(obj)}`)
  };

  // ═══ BOTH CONSOLE AND FILE LOGGING ═══
  static both = {
    info: (msg: string) => { LogFunctions.writeToConsole("INFO", msg); LogFunctions.writeToFile("INFO", msg); },
    warn: (msg: string) => { LogFunctions.writeToConsole("WARN", msg); LogFunctions.writeToFile("WARN", msg); },
    error: (msg: string) => { LogFunctions.writeToConsole("ERROR", msg); LogFunctions.writeToFile("ERROR", msg); },
    answer: (msg: string) => { LogFunctions.writeToConsole("ANSWER", msg); LogFunctions.writeToFile("ANSWER", msg); },
    derived: (msg: string) => LogFunctions.writeToConsole("DERIVED", msg), 
    json: (label: string, obj: unknown) => {
      const content = `${label}:\n${stringify(obj)}`;
      LogFunctions.writeToConsole("INFO", content);
      LogFunctions.writeToFile("INFO", content);
    }
  };

  // ═══ LEGACY COMPATIBILITY (defaults to both) ═══
  static info = (msg: string) => LogFunctions.both.info(msg);
  static warn = (msg: string) => LogFunctions.both.warn(msg);
  static error = (msg: string) => LogFunctions.both.error(msg);
  static answer = (msg: string) => LogFunctions.both.answer(msg);
  static derived = (msg: string) => LogFunctions.both.derived(msg); // NEW
  static appendJson = (label: string, obj: unknown) => LogFunctions.both.json(label, obj);

  // ═══ UTILITY FUNCTIONS ═══
  static getLogFilePath = (): string => { LogFunctions.ensureInit(); return LogFunctions.logFile; };
  static fileExists = (): boolean => { LogFunctions.ensureInit(); return fs.existsSync(LogFunctions.logFile); };
  static fileSize = (): number => { LogFunctions.ensureInit(); return fs.existsSync(LogFunctions.logFile) ? fs.statSync(LogFunctions.logFile).size : 0; };
  static clearFile = (): void => { LogFunctions.ensureInit(); fs.writeFileSync(LogFunctions.logFile, "", "utf8"); };
  static readFile = (): string => { LogFunctions.ensureInit(); return fs.existsSync(LogFunctions.logFile) ? fs.readFileSync(LogFunctions.logFile, "utf8") : ""; };
  static reset = (): void => { LogFunctions.initialized = false; LogFunctions.init(); };

  static status = (): void => {
    LogFunctions.ensureInit();
    const exists = fs.existsSync(LogFunctions.logFile);
    const size = exists ? fs.statSync(LogFunctions.logFile).size : 0;
    console.log(`[STATUS] Log file: ${LogFunctions.logFile}`);
    console.log(`[STATUS] Exists: ${exists} | Size: ${size} bytes | Initialized: ${LogFunctions.initialized}`);
  };
}




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
        globalTasksBag.item_table.flat().forEach((task: Task, index: Number) => {
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