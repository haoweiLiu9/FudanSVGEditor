import { Shape } from './Shape.js';
import { Numbers } from './Numbers.js';

export abstract class GeometryShape extends Shape {
  #geometry: Record<string, number>;
  readonly #horizontal: readonly string[];
  readonly #vertical: readonly string[];
  readonly #dimensions: readonly string[];

  protected constructor(id: string, geometry: Record<string, number>, horizontal: readonly string[], vertical: readonly string[], dimensions: readonly string[]) {
    super(id);
    this.#geometry = {};
    this.#horizontal = horizontal;
    this.#vertical = vertical;
    this.#dimensions = dimensions;
    for (const [key, value] of Object.entries(geometry)) this.#geometry[key] = this.validate(key, value);
  }

  protected value(key: string): number { return this.#geometry[key]!; }
  protected override geometryAttributes(): Readonly<Record<string, number>> { return { ...this.#geometry }; }

  override set(attr: string, value: string): void {
    if (!Object.hasOwn(this.#geometry, attr)) { super.set(attr, value); return; }
    this.#geometry[attr] = this.validate(attr, value);
  }

  override move(dx: number, dy: number): void {
    Numbers.parse(dx, 'dx'); Numbers.parse(dy, 'dy');
    const next = { ...this.#geometry };
    for (const key of this.#horizontal) next[key] = Numbers.parse(next[key]! + dx, key);
    for (const key of this.#vertical) next[key] = Numbers.parse(next[key]! + dy, key);
    this.#geometry = next;
  }

  override scale(factor: number): void {
    Numbers.positive(factor, 'scale factor');
    const next = Object.fromEntries(Object.entries(this.#geometry).map(([key, value]) => [key, Numbers.parse(value * factor, key)]));
    this.#geometry = next;
  }

  private validate(key: string, value: string | number): number {
    return this.#dimensions.includes(key) ? Numbers.nonnegative(value, key) : Numbers.parse(value, key);
  }
}
