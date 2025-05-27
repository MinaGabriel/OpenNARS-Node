import { Reasoner } from './src/core/Reasoner';
import promptSync from 'prompt-sync';
import logger from './src/utils/Logger';
import * as Utility from './src/utils/Utility';
import { memoryStore } from './src/core/MemoryStore';

const prompt = promptSync();

// Initialize Reasoner and store it
const nars = new Reasoner();

while (true) {
  const input = prompt('> ');
  switch (input.trim().toLowerCase()) {
    case 'exit':
      process.exit(0);
    case 'time':
      Utility.printTimeInfo();
      continue;
    case 'concepts':
      Utility.conceptBagTableView();
      continue;
    default:
      const [success, task, overflow] = nars.inputNarsese(input);
      if (!success) {
        logger.console.error('Failed to process input.');
      } else {
        logger.file.appendJson('Task', task);
      }
      continue;
  }
}
