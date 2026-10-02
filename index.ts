// index.ts
import readline from "readline";
import { Reasoner } from "./src/core/Reasoner";
import { MemoryStore } from "./src/core/Memory";
import { ConceptBag } from "./src/core/Bag";
import { PrintFunctions } from "./src/core/LogFunctions";
import { LogFunctions } from "./src/core/LogFunctions";
import _ from "lodash";

function main() {
  LogFunctions.init();
  LogFunctions.info("Application started");

  const nars = new Reasoner();

  // -------------------------
  // Interactive console
  // -------------------------
  const consoleInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
    historySize: 1000,
  });

  consoleInterface.prompt();

  consoleInterface.on("line", (input) => {
    if (!input.trim()) {
      LogFunctions.error("Please enter a command or input");
      consoleInterface.prompt();
      return;
    }

    // =========================
    // Commands
    // =========================
    switch (input.trim().toLowerCase()) {
      case "exit":
        process.exit(0);
      case "time":
        PrintFunctions.printTimeInfo();
        break;
      case "concepts":
        PrintFunctions.conceptBagTableView();
        break;
      case "tasks":
        PrintFunctions.globalTaskBagTableView();
        break;
      default: {
        const [success, task, overflow] = nars.inputNarsese(input);
        const concepts: ConceptBag = MemoryStore.getState().memory.conceptsBag;
        // ...
        break;
      }
    }

    consoleInterface.prompt();
  });
}

main();
