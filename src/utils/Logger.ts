import winston from 'winston';
import colors from 'colors';
import fs from 'fs';
import path from 'path';

// Setup log directory and file
const logDir = './';
const logFile = path.join(logDir, 'app.log');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Clear the log file each startup
fs.writeFileSync(logFile, '', 'utf8');

// --- Console Logger (with color) ---
const consoleLogger = winston.createLogger({
    level: 'info',
    format: winston.format.printf(({ level, message }) => {
        let coloredMessage = message;
        if (level === 'info') coloredMessage = colors.green(message as string);
        else if (level === 'warn') coloredMessage = colors.yellow(message as string);
        else if (level === 'error') coloredMessage = colors.red(message as string);
        return `[${level.toUpperCase()}]: ${coloredMessage}`;
    }),
    transports: [
        new winston.transports.Console()
    ],
});

// --- File Logger ---
const fileLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ filename: logFile }),
    ],
});

// --- Export as unified object ---
const logger = {
    console: {
        info: (msg: string) => consoleLogger.info(msg),
        warn: (msg: string) => consoleLogger.warn(msg),
        error: (msg: string) => consoleLogger.error(msg),
    },
    file: {
        info: (msg: string) => fileLogger.info(msg),
        warn: (msg: string) => fileLogger.warn(msg),
        error: (msg: string) => fileLogger.error(msg),
        appendJson: (label: string, obj: any) => {
            const jsonString = JSON.stringify(obj, null, 2);
            fileLogger.info(`${label}:\n${jsonString}`);
        }
    }
};

export default logger;
