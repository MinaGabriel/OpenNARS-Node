/**
 * Global state manager for OpenNARS
 * Handles system-wide variables like time
 */
class Global {
    static time: number = 0;

    /**
     * Prevent instantiation of the Global class
     */
    private constructor() {
        throw new Error('Global class cannot be instantiated');
    }

    /**
     * Reset global state
     */
    static reset(): void {
        this.time = 0;
    }
}

export { Global };