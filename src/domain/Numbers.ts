export class Numbers {
  static parse(value: string | number, label: string): number {
    if (typeof value === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
      throw new Error(`invalid number for ${label}: ${value}`);
    }
    const result = Number(value);
    if (!Number.isFinite(result)) throw new Error(`invalid number for ${label}: ${value}`);
    return result;
  }

  static nonnegative(value: string | number, label: string): number {
    const result = this.parse(value, label);
    if (result < 0) throw new Error(`${label} must not be negative`);
    return result;
  }

  static positive(value: string | number, label: string): number {
    const result = this.parse(value, label);
    if (result <= 0) throw new Error(`${label} must be positive`);
    return result;
  }
}
