export class Time {
  private _startTime: number;
  private _narsClock: number;

  constructor() {
    this._startTime = Date.now();
    this._narsClock = 0;
  }

  /** Real time since boot in ms */
  public now(): number {
    return Date.now() - this._startTime;
  }

  /** Absolute system time in ms */
  public nowAbsolute(): number {
    return Date.now();
  }

  /** Logical time (number of cycles since boot) */
  public narsClock(): number {
    return this._narsClock;
  }

  /** Advance the logical clock by 1 */
  public tick(): void {
    this._narsClock++;
  }

  /** Reset everything */
  public reset(): void {
    this._startTime = Date.now();
    this._narsClock = 0;
  }
}
