class IntVar {
    private num_: number;
    private parent_: IntVar | null;
    private son_: IntVar | null;

    constructor(num: number | string) {
        this.num_ = parseInt(num as string);
        this.parent_ = null;
        this.son_ = null;
    }

    // Getter for num
    get num(): number {
        return this.num_;
    }

    // Setter for num
    set num(value: number | string) {
        this.num_ = parseInt(value as string);
    }

    // Equality comparison
    equals(other: IntVar | number | string): boolean {
        const value = other instanceof IntVar ? other.num_ : parseInt(other as string);
        return this.num_ === value;
    }

    // Conversion to number
    valueOf(): number {
        return this.num_;
    }

    // Hash function
    hash(): number {
        return this.num_;
    }

    // String representation
    toString(): string {
        return `_${this.num_}`;
    }

    // Set number (Python __call__)
    setNum(num: number | string): this {
        if (num !== null && num !== undefined) {
            this.num_ = parseInt(num as string);
        }
        return this;
    }

    // Comparison operators
    greaterThan(other: IntVar | number | string): boolean {
        const value = other instanceof IntVar ? other.num_ : parseInt(other as string);
        return this.num_ > value;
    }

    greaterThanOrEqual(other: IntVar | number | string): boolean {
        const value = other instanceof IntVar ? other.num_ : parseInt(other as string);
        return this.num_ >= value;
    }

    lessThan(other: IntVar | number | string): boolean {
        const value = other instanceof IntVar ? other.num_ : parseInt(other as string);
        return this.num_ < value;
    }

    lessThanOrEqual(other: IntVar | number | string): boolean {
        const value = other instanceof IntVar ? other.num_ : parseInt(other as string);
        return this.num_ <= value;
    }

    notEqual(other: IntVar | number | string): boolean {
        const value = other instanceof IntVar ? other.num_ : parseInt(other as string);
        return this.num_ !== value;
    }

    // Arithmetic operators
    plus(other: IntVar | number | string): number {
        const value = other instanceof IntVar ? other.num_ : parseInt(other as string);
        return this.num_ + value;
    }

    minus(other: IntVar | number | string): number {
        const value = other instanceof IntVar ? other.num_ : parseInt(other as string);
        return this.num_ - value;
    }

    multiply(other: IntVar | number | string): number {
        const value = other instanceof IntVar ? other.num_ : parseInt(other as string);
        return this.num_ * value;
    }

    divide(other: IntVar | number | string): number {
        const value = other instanceof IntVar ? other.num_ : parseInt(other as string);
        if (value === 0) throw new Error('Division by zero');
        return this.num_ / value;
    }

    // Unary operators
    positive(): IntVar {
        return this;
    }

    negate(): IntVar {
        return new IntVar(-this.num_);
    }

    // Connection methods
    connect(son: IntVar): void {
        this.son_ = son;
        son.parent_ = this;
    }

    propagateDown(): void {
        let current = this.son_;
        while (current !== null) {
            current.num_ = this.num_;
            current = current.son_;
        }
    }

    propagateUp(): void {
        let current = this.parent_;
        while (current !== null) {
            current.num_ = this.num_;
            current = current.parent_;
        }
    }

    // Clone method
    clone(): IntVar {
        const copy = new IntVar(this.num_);
        // Parent and son are not cloned to avoid circular references
        return copy;
    }
}

export { IntVar };