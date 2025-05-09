
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
 * @returns 32-bit integer hash valueue
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

/**
    * Arithmetic average (mean)
    * Formula: (x₁ + x₂ + ... + xₙ) / n
    * Example: aveAri(0.4, 0.6, 0.8) → (0.4 + 0.6 + 0.8) / 3 = 0.6
    */
export function average(...array: number[]): number {
    const sum = array.reduce((accumulator, value) => accumulator + value, 0); // 0 start of accumulator
    return sum / array.length;
}

/**
 * Probabilistic OR (independent probabilities)
 * Formula: 1 - ∏(1 - xᵢ)  → 1 minus the product over (1 - xᵢ)
 * Example: or(0.3, 0.5) → 1 - (1 - 0.3)(1 - 0.5) = 1 - (0.7 * 0.5) = 1 - 0.35 = 0.65
 */
export function or(...array: number[]): number {
    const product = array.reduce((accumulator, value) => accumulator * (1 - value), 1);
    return 1 - product;
}

/**
 * Probabilistic AND (independent probabilities)
 * Formula: ∏xᵢ → product over all xᵢ
 * Example: and(0.3, 0.5) → 0.3 * 0.5 = 0.15
 */
export function and(...array: number[]): number {
    return array.reduce((accumulator, value) => accumulator * value, 1);
}

export function mean(...arr: number[]): number {
    let sum = 0;
    for (const f of arr) {
        sum += f;
    }
    return sum / arr.length;
}


// Export all utilities as a single object
export const utility = {
    print,
    hashString,
    average,
    or,
    and, 
    mean
} as const;
