import { Distributor } from "../Distributor";

const d : Distributor = new Distributor(10);

console.log(d.pick(0));
console.log(d.pick(1));
console.log(d.pick(2));

console.log(d);