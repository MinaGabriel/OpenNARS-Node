import { Reasoner } from './src/core/Reasoner';
import promptSync from 'prompt-sync'; 
import { MemoryStore } from './src/core/storage/MemoryStore';
import { ConceptBag } from './src/core/storage/ConceptBag';
import {PrintFunctions} from './src/core/utils/PrintFunctions';
import {LogFunctions} from './src/core/utils/LogFunctions';
const prompt = promptSync();
const nars = new Reasoner(); 

LogFunctions.setup(); // Initialize logging

while (true) {
  const input = prompt('> ');

  switch (input.trim().toLowerCase()) {
    case 'exit':
      process.exit(0);
    case 'time':
      PrintFunctions.printTimeInfo();
      continue;
    case 'concepts':
      PrintFunctions.conceptBagTableView();
      continue;
    case 'tasks':
      PrintFunctions.globalTaskBagTableView();
      continue;
    default:
      const [success, task, overflow] = nars.inputNarsese(input);
      const concepts: ConceptBag = MemoryStore.getState().memory.conceptsBag;

      

      continue;
  }
}
