import logger from "../../utils/Logger";
import { ImmutableOrderedSet } from "../ImmutableOrderedSet";
import { Term } from "../Term";
import { TermType } from "../TermType";


const term1 = new Term('A', TermType.ATOM)
const term2 = new Term('A', TermType.ATOM); 

//term 1 and term2 are equal
logger.console.info(`Terms are identical: ${term1.identical(term2)}`); // true