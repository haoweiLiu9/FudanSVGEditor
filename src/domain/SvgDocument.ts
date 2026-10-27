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
  group(id: string, members: readonly string[]): Group {
    if (this.all().some(node => node.id === id)) throw new Error(`id already exists: ${id}`);
    if (!members.length) throw new Error('group requires at least one shape');
    if (new Set(members).size !== members.length) throw new Error('duplicate group member');
    const requested = members.map(member => this.find(member));
    const selected = this.all().filter(node => requested.includes(node));
    for (const node of selected) {
      if (node instanceof Group && selected.some(other => other !== node && node.contains(other))) throw new Error(`cannot group a container into its own descendant: ${node.id}`);
    }
    let destination = this.parent(selected[0]!);
    while (!selected.every(node => destination.contains(node))) destination = this.parent(destination);
    const branches = selected.map(node => {
      let branch = node;
      while (this.parent(branch) !== destination) branch = this.parent(branch);
      return destination.children.indexOf(branch);
    });
    const position = Math.min(...branches);
    const originalParents = selected.map(node => this.parent(node));
    const group = new Group(id);
    selected.forEach((node, index) => { originalParents[index]!.remove(node); group.insert(node); });
    destination.insert(group, position);
    return group;
  }
  ungroup(id: string): number {
    const group = this.find(id);
    if (!(group instanceof Group)) throw new Error(`not a container: ${id}`);
    const parent = this.parent(group);
    if (parent === this.#root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const children = group.children;
    const position = parent.remove(group);
    children.forEach((child, index) => { group.remove(child); parent.insert(child, position + index); });
    return children.length;
  }
  addTo(groupId: string, id: string): void {
    const target = this.container(groupId); const shape = this.find(id);
    if (shape === target || (shape instanceof Group && shape.contains(target))) throw new Error(`cannot group a container into its own descendant: ${id}`);
    this.parent(shape).remove(shape); target.insert(shape);
  }
  reorder(id: string, toFront: boolean): void {
    const shape = this.find(id); const parent = this.parent(shape);
    parent.remove(shape); parent.insert(shape, toFront ? parent.children.length : 0);
  }
  clone(): SvgDocument { const copy = new SvgDocument(this.width, this.height); copy.#root = this.#root.clone(); return copy; }
  restore(snapshot: SvgDocument): void { const copy = snapshot.clone(); this.#width = copy.width; this.#height = copy.height; this.#root = copy.#root; }
}
