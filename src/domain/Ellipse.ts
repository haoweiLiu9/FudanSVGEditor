import { GeometryShape } from './GeometryShape.js';
export class Ellipse extends GeometryShape {
  constructor(id: string, cx: number, cy: number, rx: number, ry: number) { super(id, { cx, cy, rx, ry }, ['cx'], ['cy'], ['rx', 'ry']); }
  override get tag(): string { return 'ellipse'; }
  override clone(): Ellipse { return this.copyStyles(new Ellipse(this.id, this.value('cx'), this.value('cy'), this.value('rx'), this.value('ry'))); }
  override geometryDescription(): string { return `cx=${this.value('cx')} cy=${this.value('cy')} rx=${this.value('rx')} ry=${this.value('ry')}`; }
}
