import { Budget } from "../Budget";
import { Copula } from "../Copula";
import { Judgement } from "../Judgement";
import { Punctuation } from "../Punctuation";
import { Sentence } from "../Sentence";
import { Table } from "../Table";
import { Task } from "../Task";
import { Tense } from "../Tense";
import { Term } from "../Term";
import { Truth } from "../Truth";

console.log("Hello Table");

//task 1 === task 2 add only one time ( it will keep the new priority)
let task1 = new Task(new Judgement(new Term('a'), Punctuation.Judgement,new Truth(0.9, 0.8),Tense.Past), new Budget());
let task2 = new Task(new Judgement(new Term('a'), Punctuation.Judgement,new Truth(0.9, 0.8),Tense.Past), new Budget());

//task 3 !=== task 4 confidence is different
let task3 = new Task(new Judgement(new Term('b'), Punctuation.Judgement,new Truth(0.9, 0.9),Tense.Past), new Budget());
let task4 = new Task(new Judgement(new Term('b'), Punctuation.Judgement,new Truth(0.9, 0.5),Tense.Past), new Budget());

let table = new Table<Task>(10); 

table.add(task1, 0.5);
table.add(task2, 0.9); 


console.log(table.items()) // should only have one task

table.add(task3, 0.3);
table.add(task4, 0.3); 

console.log(table.items())

console.log(table.length) // 3
console.log('Items');

console.log(table.items());
console.log('Values');

console.log(table.values());