
import ansi from 'ansi-colors';

// Define argument type for print function
export type PrintArgs = {
    priority?: number;
    durability?: number;
    quality?: number;
};

// Define allowed print types
export type PrintType = 'IN' | 'OUT' | 'ERROR' | 'ANSWER' | 'ACHIEVED' | 'EXE' | 'INFO' | 'COMMENT';

// Map print types to ansi-colors functions
const colorMap: Record<PrintType, (text: string) => string> = {
    IN: ansi.blue,
    OUT: ansi.green,
    ERROR: ansi.red,
    ANSWER: ansi.yellow,
    ACHIEVED: ansi.cyan,
    EXE: ansi.magenta,
    INFO: ansi.white,
    COMMENT: ansi.gray
};

/**
 * Prints formatted output with optional priority, durability, and quality
 * @param type - Type of message
 * @param content - Message content
 * @param args - Optional metrics
 */
export function print(type: PrintType, content: string, args?: PrintArgs): void {
    const p = args?.priority?.toFixed(2) ?? '';
    const d = args?.durability?.toFixed(2) ?? '';
    const q = args?.quality?.toFixed(2) ?? '';

    const coloredType = colorMap[type](`${type} :`);

    console.log(`${p.padEnd(6)} ${d.padEnd(6)} ${q.padEnd(6)} ${coloredType} ${ansi.white(content)}`);
}

/**
 * Simple string hashing function using djb2 algorithm
 * @param str - String to hash
 * @returns 32-bit integer hash value
 * @throws Error if input is not a string
 */
export function hashString(str: string): number {
    if (typeof str !== 'string') {
        throw new Error('Input must be a string');
    }

    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) + hash) + char; // hash * 33 + char
    }
    return hash >>> 0; // Force unsigned 32-bit integer
}

// Export all utilities as a single object
export const utility = {
    print,
    hashString
} as const;
