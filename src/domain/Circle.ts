import { GeometryShape } from './GeometryShape.js';
export class Circle extends GeometryShape {
  constructor(id: string, cx: number, cy: number, r: number) { super(id, { cx, cy, r }, ['cx'], ['cy'], ['r']); }
  override get tag(): string { return 'circle'; }
  override clone(): Circle { return this.copyStyles(new Circle(this.id, this.value('cx'), this.value('cy'), this.value('r'))); }
  override geometryDescription(): string { return `cx=${this.value('cx')} cy=${this.value('cy')} r=${this.value('r')}`; }
}
