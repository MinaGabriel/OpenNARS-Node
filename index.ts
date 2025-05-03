import { utility } from './src/utils/Utility';
import { Reasoner } from './src/core/Reasoner';
import readline from 'readline';

// Initialize NARS reasoner
const nars = new Reasoner();

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Process input function
 * @param input - The Narsese input string
 */
function processInput(input: string): void {
    try {
        const [success, task, overflow] = nars.inputNarsese(input, true);
        if (success) {
            utility.print('IN', String(task.sentence), task.budget);
        } else {
            utility.print('ERROR', 'Invalid Narsese statement');
        }
    } catch (error) {
        utility.print('ERROR', `An error occurred: ${(error as Error).message}`);
    }
    rl.prompt();
}

// Handle input loop
rl.on('line', (input: string) => {
    if (input.trim().toLowerCase() === 'exit') {
        rl.close();
        return;
    }
    processInput(input);
});

// Handle closing
rl.on('close', () => {
    utility.print('INFO', 'Closing OpenNARS...');
    process.exit(0);
});

// Start the input loop
utility.print('INFO', 'OpenNARS initialized. Enter Narsese statements (type "exit" to quit):');
rl.prompt();