import { ShapeFactory } from '../domain/ShapeFactory.js';
import { SvgDocument } from '../domain/SvgDocument.js';

export class EditorOperations {
  constructor(private readonly document: SvgDocument, private readonly factory = new ShapeFactory()) {}
  create(type: string, id: string, params: readonly string[], parentId?: string): string {
    const shape = this.factory.create(type, id, params);
    this.document.add(shape, parentId);
    return `${shape.label} created${parentId === undefined ? '' : ` in g#${parentId}`}`;
  }
  delete(id: string): string { return `${this.document.delete(id).label} deleted`; }
  move(id: string, dx: number, dy: number): string {
    const shape = this.document.find(id); shape.move(dx, dy);
    return `${shape.label} moved by (${dx},${dy}): ${shape.summary()}`;
  }
  scale(id: string, factor: number): string {
    const shape = this.document.find(id); shape.scale(factor);
    return `${shape.label} scaled by ${factor}: ${shape.summary()}`;
  }
  set(id: string, attr: string, value: string): string {
    const shape = this.document.find(id); shape.set(attr, value);
    return `${shape.label} updated: ${attr}=${JSON.stringify(value)}`;
  }
}
