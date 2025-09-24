import readline from "readline";

import { Reasoner } from "./src/core/Reasoner";
import { MemoryStore } from "./src/core/Memory";
import { ConceptBag } from "./src/core/Bag";
import { PrintFunctions } from "./src/core/LogFunctions";
import { LogFunctions } from "./src/core/LogFunctions";

const nars = new Reasoner();

LogFunctions.init(); // Initialize logging
LogFunctions.info("Application started");

// -------------------------
// Interactive console with history (↑ / ↓)
// -------------------------
const consoleInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
  historySize: 1000, // keep last 1000 commands in memory
});

consoleInterface.prompt();

consoleInterface.on("line", (input) => {
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
      // Do whatever else you want with task/overflow/concepts
      break;
    }
  }

  consoleInterface.prompt();
});
