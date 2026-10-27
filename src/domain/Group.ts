import { Shape } from './Shape.js';
import { Numbers } from './Numbers.js';
export class Group extends Shape {
  #children: Shape[] = [];
  constructor(id: string) { super(id); }
  override get tag(): string { return 'g'; }
  override get isContainer(): boolean { return true; }
  override get children(): readonly Shape[] { return [...this.#children]; }
  override geometryDescription(): string { return ''; }
  contains(shape: Shape): boolean { return this === shape || this.#children.some(child => child === shape || (child instanceof Group && child.contains(shape))); }
  insert(shape: Shape, index = this.#children.length): void {
    if (shape === this || (shape instanceof Group && shape.contains(this))) throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
    if (this.#children.includes(shape)) throw new Error(`shape already in container: ${shape.id}`);
    if (!Number.isInteger(index) || index < 0 || index > this.#children.length) throw new Error('invalid child index');
    this.#children.splice(index, 0, shape);
  }
  remove(shape: Shape): number {
    const index = this.#children.indexOf(shape);
    if (index < 0) throw new Error(`shape not in container: ${shape.id}`);
    this.#children.splice(index, 1);
    return index;
  }
  override move(dx: number, dy: number): void { Numbers.parse(dx, 'dx'); Numbers.parse(dy, 'dy'); for (const child of this.#children) child.move(dx, dy); }
  override scale(factor: number): void { Numbers.positive(factor, 'scale factor'); for (const child of this.#children) child.scale(factor); }
  override clone(): Group { const copy = this.copyStyles(new Group(this.id)); for (const child of this.#children) copy.insert(child.clone()); return copy; }
}
