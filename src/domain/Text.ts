import { GeometryShape } from './GeometryShape.js';
export class Text extends GeometryShape {
  #content: string;
  constructor(id: string, x: number, y: number, content: string) { super(id, { x, y }, ['x'], ['y'], []); this.#content = content; }
  override get tag(): string { return 'text'; }
  override get textContent(): string { return this.#content; }
  override set(attr: string, value: string): void { if (attr === 'text') { this.#content = value; } else { super.set(attr, value); } }
  override clone(): Text { return this.copyStyles(new Text(this.id, this.value('x'), this.value('y'), this.#content)); }
  override geometryDescription(): string { return `(${this.value('x')},${this.value('y')}) ${JSON.stringify(this.#content)}`; }
}
