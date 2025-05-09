
import { Reasoner } from './src/core/Reasoner'; 
import { log } from 'console';

// Initialize NARS reasoner
const nars = new Reasoner();
//const [success, task, overflow] = nars.inputNarsese("<<a --> b> ==> <b-->c>>. :/: %1.0;0.9%", true);

const [success, task, overflow] = nars.inputNarsese("<a --> b>. :/: %1.0;0.9%", true);


log('Success:', success);

