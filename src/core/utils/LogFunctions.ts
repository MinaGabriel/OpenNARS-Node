// LogFunctions.ts
import fs from "fs";
import path from "path";
import colors from "ansi-colors";
import stringify from "json-stringify-pretty-compact";

export class LogFunctions {
  private static logDir = path.resolve(__dirname, "logs");
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
