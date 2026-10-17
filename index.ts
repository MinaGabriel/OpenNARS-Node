// index.ts
// Interactive console for Mini-NARS (book §4.6).
//
//   > <bird --> animal>. %1.0;0.9%
//   > <robin --> bird>. %1.0;0.9%
//   > <robin --> animal>?
//   > 100
//   OUT: <robin --> animal>. %1.00;0.81%   (cycle 31)

import readline from "node:readline";
import { Reasoner } from "./src/core/Reasoner";
import { NarseseError } from "./src/core/NarseseParser";
import { Concept } from "./src/core/Concept";

const HELP = `Enter a Narsese sentence, a number of cycles, or a command:
  <robin --> bird>. %1.0;0.9%   judgment
  <robin --> ?x>?               question
  100                           run 100 cycles
  concepts                      list concepts by priority
  verbose                       toggle printing of derived tasks
  help | exit`;

function main(): void {
  const nars = new Reasoner();
  let verbose = false;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });

  const runCycles = (n: number) => {
    const { answers, derived } = nars.run(n);
    if (verbose) for (const task of derived) console.log(`     ${task}`);
    for (const a of answers) console.log(`OUT: ${a.answer}   (cycle ${a.cycle})`);
  };

  console.log("Mini-NARS. Type 'help' for usage.");
  rl.prompt();

  rl.on("line", (line) => {
    const input = line.trim();

    if (input === "" || input.startsWith("//") || input.startsWith("OUT:")) {
      // blank lines, comments and recorded output lines are ignored
    } else if (input === "exit") {
      rl.close();
      return;
    } else if (input === "help") {
      console.log(HELP);
    } else if (input === "verbose") {
      verbose = !verbose;
      console.log(`verbose ${verbose ? "on" : "off"}`);
    } else if (/^\d+$/.test(input)) {
      runCycles(Number(input));
    } else if (input === "buffer") {
      nars.buffer.print();
    } else if (input === "concepts") {
      Concept.printAll(nars.memory.concepts.toArray());
    } else {
      try {
        const task = nars.inputNarsese(input);
        console.log(`IN:  ${task}   ${task.sentence.base}`);
      } catch (error) {
        if (!(error instanceof NarseseError)) throw error;
        console.log(`ERR: ${error.message}`);
      }
    }

    rl.prompt();
  });

  rl.on("close", () => process.exit(0));
}

main();
