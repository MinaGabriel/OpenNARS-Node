import { ImmutableOrderedSet } from "../ImmutableOrderedSet";
import { Term } from "../Term";


const term1 = new Term('A');
const term2 = new Term('A');
const term3 = new Term('B')
console.log(term1.identical(term2)); // true
console.log(term1.identical(term3)) // false

console.log(term1)
console.log("**********************")
console.log(term3)