// Memory.ts
// The concept graph: a bag of concepts, one per term (book §4.2–4.3).
//
// A task is stored in the concept of each of its terms:
//   <robin --> bird>.   is added to concept "robin" and concept "bird"
//   <robin --> ?x>?     is added to concept "robin" only (variables have no concept)
// That is what lets two tasks meet: they share a concept exactly when they
// share a term, which is when a syllogism can apply.

import { Bag } from "./Bag";
import { Concept } from "./Concept";
import { Task } from "./Task";
import { Term } from "./Term";
import { InferenceResult, emptyResult } from "./InferenceEngine";

export const CONCEPT_BAG = { levels: 100, bucket: 10 };

export class Memory {
  readonly concepts = new Bag<Concept>(CONCEPT_BAG.levels, CONCEPT_BAG.bucket);

  /** Sends a task to the concepts of its subject and predicate. */
  addTask(task: Task): void {
    for (const term of [task.statement.subject, task.statement.predicate]) {
      if (!term.isVariable()) this.addToConcept(term, task);
    }
  }

  /** Book §4.3, memory cycle: fire one concept, chosen by priority. */
  cycle(): InferenceResult {
    const concept = this.concepts.select();
    if (!concept) return emptyResult();
    const result = concept.fire();
    this.concepts.putBack(concept);
    return result;
  }

  concept(term: string): Concept | undefined {
    return this.concepts.peek(term);
  }

  private addToConcept(term: Term, task: Task): void {
    const existing = this.concepts.take(term.name());
    if (existing) {
      existing.addTask(task);
      this.concepts.putBack(existing);
      return;
    }
    const concept = new Concept(term);
    concept.addTask(task);
    this.concepts.put(concept);
  }
}
