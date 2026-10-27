import { Numbers } from './Numbers.js';

export abstract class Shape {
  readonly #id: string;
  #styles = new Map<string, string>();

  protected constructor(id: string) {
    if (!id || /\s/.test(id)) throw new Error('id must be nonempty and contain no whitespace');
    this.#id = id;
  }

  get id(): string { return this.#id; }
  abstract get tag(): string;
  get label(): string { return `${this.tag}#${this.id}`; }
  get children(): readonly Shape[] { return []; }
  get textContent(): string | undefined { return undefined; }
  get isContainer(): boolean { return false; }
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract clone(): Shape;
  abstract geometryDescription(): string;
  protected geometryAttributes(): Readonly<Record<string, number>> { return {}; }

  set(attr: string, value: string): void {
    if (!['fill', 'stroke', 'stroke-width'].includes(attr)) throw new Error(`unknown attribute: ${attr}`);
    if (/[\r\n]/.test(value)) throw new Error('attribute value must be on one line');
    this.#styles.set(attr, attr === 'stroke-width' ? String(Numbers.nonnegative(value, attr)) : value);
  }

  attributes(): Readonly<Record<string, string>> {
    return Object.freeze({ id: this.id, ...Object.fromEntries(Object.entries(this.geometryAttributes()).map(([k, v]) => [k, String(v)])), ...Object.fromEntries(this.#styles) });
  }

  styleDescription(): string { return [...this.#styles].map(([k, v]) => `${k}=${v}`).join(' '); }
  summary(): string { return [this.label, this.geometryDescription(), this.styleDescription()].filter(Boolean).join('  '); }

  protected copyStyles<T extends Shape>(target: T): T {
    for (const [key, value] of this.#styles) target.set(key, value);
    return target;
  }
}
