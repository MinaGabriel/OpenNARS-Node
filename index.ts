import { Reasoner } from './src/core/Reasoner';
import promptSync from 'prompt-sync';
import { System } from './src/core/Functions'; // Assuming `System` is exported here
import { MemoryStore } from './src/core/MemoryStore';
import { ConceptBag } from './src/core/bag/ConceptBag';

const prompt = promptSync();
const nars = new Reasoner();

System.Log.setup(); // Initialize logging

while (true) {
  const input = prompt('> ');

  switch (input.trim().toLowerCase()) {
    case 'exit':
      process.exit(0);
    case 'time':
      System.Print.printTimeInfo();
      continue;
    case 'concepts':
      System.Print.conceptBagTableView();
      continue;
    case 'tasks':
      System.Print.globalTaskBagTableView();
      continue;
    default:
      const [success, task, overflow] = nars.inputNarsese(input);
      const concepts: ConceptBag = MemoryStore.getState().memory.conceptsBag;

      if (!success) {
        System.Log.error('Failed to process input.');
      } else {
        System.Log.appendJson('Task', task);
      }

      continue;
  }
}
