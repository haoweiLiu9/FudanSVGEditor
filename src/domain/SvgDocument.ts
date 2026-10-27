import { Group } from './Group.js';
import { Shape } from './Shape.js';
import { Numbers } from './Numbers.js';

export class SvgDocument {
  #width: number;
  #height: number;
  #root = new Group('__document_root__');
  constructor(width = 800, height = 600) { this.#width = Numbers.positive(width, 'canvas width'); this.#height = Numbers.positive(height, 'canvas height'); }
  get width(): number { return this.#width; }
  get height(): number { return this.#height; }
  get children(): readonly Shape[] { return this.#root.children; }
  get size(): number { return this.all().length; }
  resize(width: number, height: number): void {
    const w = Numbers.positive(width, 'canvas width'); const h = Numbers.positive(height, 'canvas height');
    this.#width = w; this.#height = h;
  }
  all(): readonly Shape[] {
    const result: Shape[] = [];
    const visit = (shape: Shape): void => { result.push(shape); for (const child of shape.children) visit(child); };
    for (const child of this.children) visit(child);
    return result;
  }
  find(id: string): Shape {
    const shape = this.all().find(node => node.id === id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  container(id?: string): Group {
    if (id === undefined) return this.#root;
    const shape = this.all().find(node => node.id === id);
    if (!shape) throw new Error(`no such container: ${id}`);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    return shape;
  }
  parent(shape: Shape): Group {
    const parent = [this.#root, ...this.all()].find(node => node.children.includes(shape));
    if (!(parent instanceof Group)) throw new Error(`no such shape: ${shape.id}`);
    return parent;
  }
  parentLabel(shape: Shape): string { const parent = this.parent(shape); return parent === this.#root ? 'svg' : parent.label; }
  add(shape: Shape, parentId?: string): void {
    const ids = new Set(this.all().map(node => node.id));
    const validate = (node: Shape): void => { if (ids.has(node.id)) throw new Error(`id already exists: ${node.id}`); ids.add(node.id); for (const child of node.children) validate(child); };
    validate(shape);
    this.container(parentId).insert(shape);
  }
  delete(id: string): Shape { const shape = this.find(id); this.parent(shape).remove(shape); return shape; }
  clone(): SvgDocument { const copy = new SvgDocument(this.width, this.height); copy.#root = this.#root.clone(); return copy; }
  restore(snapshot: SvgDocument): void { const copy = snapshot.clone(); this.#width = copy.width; this.#height = copy.height; this.#root = copy.#root; }
}
