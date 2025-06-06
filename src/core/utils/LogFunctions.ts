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

export class LogFunctions {
    private static logDir = './logs';
    private static logFile = path.join(LogFunctions.logDir, 'app.log');

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
        transports: [new winston.transports.File({ filename: LogFunctions.logFile })],
    });

    static setup(): void {
        if (!fs.existsSync(LogFunctions.logDir)) {
            fs.mkdirSync(LogFunctions.logDir);
        }
        fs.writeFileSync(LogFunctions.logFile, '', 'utf8'); // clear on start
    }

    static info(msg: string): void {
        LogFunctions.consoleLogger.info(msg);
        LogFunctions.fileLogger.info(msg);
    }

    static warn(msg: string): void {
        LogFunctions.consoleLogger.warn(msg);
        LogFunctions.fileLogger.warn(msg);
    }

    static error(msg: string): void {
        LogFunctions.consoleLogger.error(msg);
        LogFunctions.fileLogger.error(msg);
    }

    static appendJson(label: string, obj: any): void {
        LogFunctions.fileLogger.info(`${label}:\n${stringify(obj)}`);
    }
}