// index.ts
import readline from "readline";
import { Reasoner } from "./src/core/Reasoner";
import { MemoryStore } from "./src/core/Memory";
import { ConceptBag } from "./src/core/Bag";
import { PrintFunctions } from "./src/core/LogFunctions";
import { LogFunctions } from "./src/core/LogFunctions";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";

async function main() {
  LogFunctions.init();
  LogFunctions.info("Application started");

  //initialize the vector DB once
  await MemoryStore.getState().vectorDB.init();
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

  function isPrefix(s: string, prefix: string) {
    return s.toLowerCase().startsWith(prefix.toLowerCase());
  }
  function stripPrefix(s: string, prefix: string) {
    return s.slice(prefix.length).trim();
  }

  consoleInterface.on("line", async (input) => {
    if (isPrefix(input.trim(), ":")) {
      const text = stripPrefix(input.trim(), ":").toLowerCase();
      if (!text) {
        console.log("Please provide some text after ':'");
      } else {
        const id = MemoryStore.getState().bm25.add(text);

        try {
          const itemsAndWeights = await MemoryStore.getState().llms.extractItemsAndWeights(text);
          const base = uuidv4();
          await Promise.all(
            itemsAndWeights.map((itemWeight, idx) =>
              MemoryStore.getState().vectorDB.addToken([
                { id: `${base}-${idx}`, text: itemWeight.item, chunk: text },
              ])
            )
          );
          console.log("Items and Weights:", itemsAndWeights);
        } catch (error) {
          console.log("Failed to extract items weights:", error);
        }

        console.log(`BM25 indexed (#${id}): ${text}`);
        console.log(`Total docs: ${MemoryStore.getState().bm25.count()}`);
      }
      consoleInterface.prompt();
      return;
    }

    if (isPrefix(input.trim(), "?")) {
      const q = stripPrefix(input.trim(), "?").toLowerCase();
      if (!q) return; 

      
      const userInput = await MemoryStore.getState().llms.extractItemsAndWeights(q);
      const uniqUserInput = _.uniqBy(userInput, 'item');
      const stringifyUserInput = _.join(_.map(uniqUserInput, 'item'), ' '); 
      // S_l Lexical scores
      const lexicalScores = MemoryStore.getState().bm25.search(stringifyUserInput);
      const minByScore = _.minBy(lexicalScores, 'score')?.score ?? 0;
      const maxByScore = _.maxBy(lexicalScores, 'score')?.score ?? 1;
      //\tilde{S}_l normalized lexical scores: 
      const normalizedLexicalScores = lexicalScores.map(s => ({...s, normScore: (s.score - minByScore) / (maxByScore - minByScore + 1e-6)}));
      // +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

      
      return;
    }

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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
