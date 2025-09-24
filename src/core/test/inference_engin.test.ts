import fs, { stat } from "node:fs";
import path from "path";
import {
  createEngineState,
  loadYamlRules,
  assertFact,
  inferSingleShotOnCurrentFacts,
  formatTerm
} from "../NALInferenceEngine";
import { LogFunctions } from "../LogFunctions";
import { assertType } from "vitest";

const state = createEngineState();
const yaml = fs.readFileSync(path.resolve(__dirname, "../nal-rules.yml"), "utf8");

// Load Immediate rules (and you can also load NAL-1 if you want).
loadYamlRules(state, yaml, ["rules", "immediate"]);
// Load NAL-1 rules
loadYamlRules(state, yaml, ["rules", "nal1"]);


// Seed one fact:
assertFact(state, "<bird --> fly>.");
assertFact(state, "<fly --> animal>.");
// Apply each Immediate rule ONCE over the initial facts only:
const results = inferSingleShotOnCurrentFacts(state, {
  allowOnePremise: true,
  allowTwoPremise: true, // avoid any NAL-1 combinations here
});

for (const r of results) {
  LogFunctions.console.derived(`${formatTerm(r.conclusion)}`);
  console.log("  by rule:", r.ruleApplied);
  console.log("  from:", r.premisesMatched.map(formatTerm).join(" AND "));
  console.log("  substitution:", r.substitutionUsed, "\n");
}
