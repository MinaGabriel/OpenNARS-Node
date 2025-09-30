// index.ts — silence console output for built-in commands

import express, { Request, Response } from "express";
import readline from "readline";
import cors from "cors"; 
import { Reasoner } from "./src/core/Reasoner";
import { LogFunctions } from "./src/core/utils/LogFunctions";
import _ from "lodash";

const reasoner = new Reasoner();
LogFunctions.init();
LogFunctions.info("Application started");

// -------------------------
// Shared command handler
// -------------------------
type Source = "console" | "http";
type Output = {
  task?: string | null;
  answers?: String[] | null
} | null;

function handleInput(inputText: string, source: Source): Output {
  const commandText = inputText.trim().toLowerCase();
  const [success, task, overflow, rawAnswers] = reasoner.inputNarsese(inputText);
  //clean the answers: 
  const answers = _.map(rawAnswers, a => a.toString());
  return {
    task: task ? String((task as any).toString?.() ?? (task as any).id ?? "[Task]") : null,
    answers: answers
  };
}

// -------------------------
// Minimal HTTP server
// -------------------------
const application = express();
application.use(cors());
application.use(express.json());


application.post("/command", (request: Request, response: Response) => {
  const inputText = String((request.body as any)?.input ?? "").trim();
  if (!inputText) {
    return response.status(400).json({ ok: false, error: "Missing 'input'." });
  }
  const output = handleInput(inputText, "http")!;
  return response.json(output);
});

const port = Number(process.env.PORT) || 3000;
const server = application.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is busy, closing and retrying...`);
    server.close(() => {
      const retry = port;
      application.listen(retry, () => {
        console.log(`Restarted on port ${retry}`);
      });
    });
  } else {
    throw err;
  }
});

// -------------------------
// Minimal non-blocking console
// -------------------------
const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
  crlfDelay: Infinity,
});

readlineInterface.prompt();
readlineInterface.on("line", (line: string) => {
  const result = handleInput(line, "console");
  if (result) {
    console.log(JSON.stringify(result));
  }
  readlineInterface.prompt();
});
