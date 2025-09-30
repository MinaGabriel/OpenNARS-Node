// src/core/Reasoner.ts
import fs from "node:fs";
import path from "path";

import { MemoryStore } from "./Memory";
import { Task } from "./nalCorePrimitives";
import { Concept } from "./Concept";
import { TaskLink } from "./Link";
import { LogFunctions } from "./LogFunctions";
import {
  createEngineState,
  loadYamlRules,
  assertFact,
  inferSingleShotOnCurrentFacts,
  formatTerm,
  EngineState
} from "./NALInferenceEngine";
import _ from "lodash";
import { Sentence } from "./nalCorePrimitives";

export class Reasoner {
  private _memory = MemoryStore.getState().memory;
  private _time = MemoryStore.getState().time;
  private _channel = MemoryStore.getState().channel;
  

  /** internal inference engine state (rules + facts) */
  private _nalState: EngineState;

  constructor() {
    MemoryStore.setState({ reasoner: this });
    this._nalState = createEngineState();
    const yamlPath = path.resolve(__dirname, "./nal-rules.yml");
    const yamlContent = fs.readFileSync(yamlPath, "utf8");
    loadYamlRules(this._nalState, yamlContent, ["rules", "immediate"]);
    loadYamlRules(this._nalState, yamlContent, ["rules", "nal1"]);
    LogFunctions.info("Reasoner initialized with rules.");
  }

  get memory() { return this._memory; }
  get time() { return this._time; }
  get channel() { return this._channel; }

  /**
   * Perform one working cycle.
   */
  cycle(): void {
    const concept: Concept | null = this.memory.conceptsBag.takeOut() as Concept;
    if (!concept) return;

    const taskLink: TaskLink | null = concept.taskLinks.takeOut() as TaskLink;
    if (!taskLink) {
      this.memory.conceptsBag.putBack(concept);
      return;
    }

    // When you put the Task back it will lose some priority (decay).
    concept.taskLinks.putBack(taskLink);

    // Extract the task itself
    const task: Task = taskLink.target as Task;

    // Feed fact into inference engine
    assertFact(this._nalState, task.term.toString());

    // Apply inference rules
    const results = inferSingleShotOnCurrentFacts(this._nalState, {
      allowOnePremise: true,
      allowTwoPremise: true
    });
    //conclusion is derived text:  <fly --> bird> Dirty workaround add punctuation for now
    _.forEach(results, ({ conclusion, ruleApplied, premisesMatched, substitutionUsed }) => {
      //build the new task 
      const [success, derived, overflow] = this._channel.put(formatTerm(conclusion) + task.sentence.punctuation);

      this._memory.input(derived!);
      this._time.tick();
      LogFunctions.console.info(derived!.term.toString());

    });


    LogFunctions.console.info("Cycle complete.");

    // Return concept back into memory
    this.memory.conceptsBag.putBack(concept);
  }

  /**
   * Handle input: either run cycles (if numeric) or process a Narsese task.
   */
  inputNarsese(text: string): [boolean, Task | null, Task | null, Sentence[] | null] {
    const trimmed = text.trim();

    // Case 1: Numeric input = run cycles
    if (trimmed !== "" && !isNaN(Number(trimmed))) {
      const cycles = parseInt(trimmed, 10);
      for (let i = 0; i < cycles; i++) {
        this.cycle();
        this._time.tick();
      }
      return [true, null, null, null];
    }

    // Case 2: Narsese input
    const [success, task, overflow] = this._channel.put(trimmed);
    let answers: Sentence[] = [];
    if (task) {
      answers = this._memory.input(task).answers;
      this._time.tick();
    }
    return [success, task, overflow, answers];
  }
}
