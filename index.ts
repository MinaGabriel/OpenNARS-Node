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

  // 🔹 CRITICAL: initialize the vector DB once
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
      const text = stripPrefix(input.trim(), ":");
      if (!text) {
        console.log("Please provide some text after ':'");
      } else {
        const id = MemoryStore.getState().bm25.add(text);

        try {
          const keyphrases = await MemoryStore.getState().llms.extractKeyphrases(text);
          const base = uuidv4();
          await Promise.all(
            keyphrases.map((kp, idx) =>
              MemoryStore.getState().vectorDB.addToken([
                { id: `${base}-${idx}`, text: kp.item, chunk: text },
              ])
            )
          );
          console.log("Keyphrases:", keyphrases);
        } catch (error) {
          console.log("Failed to extract keyphrases:", error);
        }

        console.log(`BM25 indexed (#${id}): ${text}`);
        console.log(`Total docs: ${MemoryStore.getState().bm25.count()}`);
      }
      consoleInterface.prompt();
      return;
    }

    if (isPrefix(input.trim(), "?:")) {
      const q = stripPrefix(input.trim(), "?:");
      if (!q) {
        console.log("Please provide a query after '?:'");
      } else {
        const hits = MemoryStore.getState().bm25.search(q);
        if (hits.length === 0) {
          console.log("No results.");
        } else {
          console.log(`Top results for: "${q}"`);
          for (const h of hits) {
            console.log(`- #${h.id}  score=${h.score.toFixed(4)}  ${h.body}`);
          }
        }

        // 🔹 Semantic Vector search
        try {
          const vectors = await MemoryStore.getState().vectorDB.search(q, 5); // top 5
          console.log(`\nVector search results for: "${q}"`);
          if (vectors.length === 0) {
            console.log("No semantic matches.");
          } else {
            for (const v of vectors) {
              console.log(`- id=${v.id}  text="${v.text}"  chunk="${v.chunk}"`);
            }
          }
        } catch (err) {
          console.error("Vector search failed:", err);
        }
      

    }
    consoleInterface.prompt();
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
