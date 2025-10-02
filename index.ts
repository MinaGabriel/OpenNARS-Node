// index.ts
import readline from "readline";
import { Reasoner } from "./src/core/Reasoner";
import { MemoryStore } from "./src/core/Memory";
import { ConceptBag } from "./src/core/Bag";
import { PrintFunctions } from "./src/core/LogFunctions";
import { LogFunctions } from "./src/core/LogFunctions";
import _ from "lodash";
import { LLMs } from "./src/core/LLMs";
import { keywordsArrayType } from "./src/core/VectorDB";
import { sha1Id } from "./src/core/VectorDB";

async function main() {
  LogFunctions.init();
  LogFunctions.info("Application started");

  // initialize VectorDB
  const db = MemoryStore.getState().vectorDB;
  await db.init();

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
    if (!input.trim()) {
      LogFunctions.error("Please enter a command or input");
      consoleInterface.prompt();
      return;
    }
    // =========================
    // Ingest a chunk  (": ...")
    // =========================
    if (isPrefix(input.trim(), ":")) {
      const chunkText = stripPrefix(input.trim(), ":").toLowerCase();
      if (!chunkText) {
        console.log("Please provide some text after ':'");
        consoleInterface.prompt();
        return;
      }

      // Add to BM25
      const bm25Id = MemoryStore.getState().bm25.add(chunkText);

      // Extract, normalize, dedupe keywords (keep max weight)
      let extracted: keywordsArrayType = await LLMs.extractItemsAndWeights(chunkText);
      const dedupeMap: Record<string, { item: string; weight: number }> = Object.create(null);
      for (const k of extracted) {
        const key = k.item.toLowerCase();
        const prev = dedupeMap[key];
        if (!prev || k.weight > prev.weight) {
          dedupeMap[key] = { item: key, weight: k.weight };
        }
      }
      const normalizedKeywords: keywordsArrayType = Object.values(dedupeMap);

      // Store chunk (also writes token rows)
      await db.addChunkFromKeywords({
        chunk_id: sha1Id(chunkText),
        document_id: bm25Id.toString(),
        text: chunkText,
        keywords: normalizedKeywords,
      });

      console.log(`BM25 indexed (#${bm25Id}): ${chunkText}`);
      console.log("Keywords:", normalizedKeywords);
      consoleInterface.prompt();
      return;
    }

    // =========================
    // Query ("? ...")
    // =========================
    if (isPrefix(input.trim(), "?")) {
      const q = stripPrefix(input.trim(), "?").toLowerCase();
      if (!q) {
        console.log("Please provide a query after '?'");
        consoleInterface.prompt();
        return;
      }

      // 1) Extract keywords, normalize + dedupe (keep max weight)
      const extracted = await LLMs.extractItemsAndWeights(q);
      const deDuplicationMap: Record<string, { item: string; weight: number }> = Object.create(null);
      for (const k of extracted) {
        const key = k.item.toLowerCase();
        const prev = deDuplicationMap[key];
        if (!prev || k.weight > prev.weight) {
          deDuplicationMap[key] = { item: key, weight: k.weight };
        }
      }
      const uniqueKeywords = Object.values(deDuplicationMap);

      // 2) BM25 lexical search over the keyword items
      const queryTerms = uniqueKeywords.map(k => k.item).join(" ").trim();
      const lexicalScores = queryTerms
        ? MemoryStore.getState().bm25.search(queryTerms)
        : [];
      
      for(const s of lexicalScores) {
        LogFunctions.info(`BM25 hit: doc#${s.body} score=${s.score.toFixed(4)}`);
      }

      // 3) Vector search (v* inside VectorDB.searchChunks)
      const vectorResults = await db.searchChunks(uniqueKeywords, 1);
      LogFunctions.info(`VectorDB returned ${vectorResults.length} results`);

      // (Optional) print results quickly
      if (vectorResults.length === 0) {
        console.log("No semantic matches.");
      } else {
        console.log(`Top vector results for: "${q}"`);
        for (const r of vectorResults) {
          const kws = JSON.parse(r.keywords);
          console.log(`- [doc=${r.document_id}] ${r.text}`);
          console.log("  keywords:", kws);
        }
      }

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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
