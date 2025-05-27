import colors from "ansi-colors";
import { Budget } from "./Budget";
import { Concept } from "./Concept";
import { Link } from "./Link";
import { Task } from "./Task";
import _ from "lodash";
import { LinkType } from "./LinkType";


class TermLink extends Link {
    constructor(source: Concept , target: Concept , budget: Budget) {
        super(source, target, budget, true, false);
    }

    toString(): string {
        return `Term Link: ${colors.red(this.target.toString())} ${LinkType[this.type as number] ?? ""}`;
    }

}

export { TermLink }