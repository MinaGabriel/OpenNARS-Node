import { Reasoner } from "../Reasoner";
import _ from "lodash";
import { Task } from "../nalCorePrimitives";
import { describe, it, expect } from "vitest";
import { Memory } from "../Memory";

const nars = new Reasoner();

describe("unifyTerms - success cases (query variables only)", () => {
  it("1) Variable matches atomic constant", () => {
    const query = _.nth(nars.inputNarsese("<bird --> ?x>?"), 1) as Task;
    const cand  = _.nth(nars.inputNarsese("<bird --> ?x>."), 1) as Task;
    const result = query.term.unifyWith(cand.term);
    expect(result).not.toBeNull();
    expect(result!.substitutionMap.get("?x")?.name()).toBe("fly");
  });
 
 
});
