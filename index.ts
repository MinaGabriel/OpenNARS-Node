import { Reasoner } from './src/core/Reasoner';
import logger from './src/utils/Logger';
import promptSync from 'prompt-sync';



const prompt = promptSync();
const nars = new Reasoner();

logger.console.info("Welcome to the OpenNARS Shell! Starting system...");


while (true) {
    const input = prompt('> '); 
    if (input.trim().toLowerCase() === 'exit') {
        logger.console.info("User chose to exit. Shutting down.");
        break;
    }


    const [success, task, overflow] = nars.inputNarsese(input, true);
    if (!success) {
        logger.console.error("Failed to process input.");
    } else { 
        logger.console.info(`Input processed. Success: ${success}`);
    }

    nars.tick();
    logger.console.info(`Completed tick. Clock now at: ${nars.clock}`);
}
