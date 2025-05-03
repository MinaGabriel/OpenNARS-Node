 class Truth {
    private f: number;
    private c: number;
    private k: number;

    constructor(frequency: number, confidence: number, horizonK: number) {
        this.f = frequency;
        this.c = confidence;
        this.k = horizonK;
    }

    expectation(): number {
        return (this.c * (this.f - 0.5)) + 0.5;
    }

    values(): [number, number, number] {
        return [this.f, this.c, this.k];
    }

    print(): void {
        console.log(`%${this.f};${this.c}%`);
    }
}

export { Truth };