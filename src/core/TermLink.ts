import colors from "ansi-colors";
import { Budget } from "./Budget";
import { Concept } from "./Concept";
import { Link } from "./Link";
import { Task } from "./Task";
import _ from "lodash";
import { LinkType } from "./enums/Enums";


class TermLink extends Link {
    constructor(source: Concept, target: Concept, budget: Budget) {
        super(source, target, budget, true, false);
    }

    toString(): string {
        return `Term Link: ${colors.magenta(this.budget.toString())}  ${colors.magenta(this.source.name() + " --- " + this.target.name())} ${colors.yellow(_.isArray(this.index) && this.index.length > 0 ? JSON.stringify(this.index) : "")} ${LinkType[this.type as number] ?? ""}`;
    }

}

export { TermLink }