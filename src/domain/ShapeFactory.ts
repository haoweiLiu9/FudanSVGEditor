import { Shape } from './Shape.js';
import { Rect } from './Rect.js';
import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Line } from './Line.js';
import { Text } from './Text.js';
import { Group } from './Group.js';
import { Numbers } from './Numbers.js';

export class ShapeFactory {
  // 唯一的图形类型名称分派点；后续以插件注册替代此内置清单。
  readonly #providers = new Map<string, { count: number; geometry: readonly string[]; paint?: string; make: (id: string, p: readonly string[]) => Shape }>([
    ['rect', { count: 4, geometry: ['x', 'y', 'width', 'height'], paint: 'fill', make: (id, p) => new Rect(id, Numbers.parse(p[0]!, 'x'), Numbers.parse(p[1]!, 'y'), Numbers.parse(p[2]!, 'width'), Numbers.parse(p[3]!, 'height')) }],
    ['circle', { count: 3, geometry: ['cx', 'cy', 'r'], paint: 'fill', make: (id, p) => new Circle(id, Numbers.parse(p[0]!, 'cx'), Numbers.parse(p[1]!, 'cy'), Numbers.parse(p[2]!, 'r')) }],
    ['ellipse', { count: 4, geometry: ['cx', 'cy', 'rx', 'ry'], paint: 'fill', make: (id, p) => new Ellipse(id, Numbers.parse(p[0]!, 'cx'), Numbers.parse(p[1]!, 'cy'), Numbers.parse(p[2]!, 'rx'), Numbers.parse(p[3]!, 'ry')) }],
    ['line', { count: 4, geometry: ['x1', 'y1', 'x2', 'y2'], paint: 'stroke', make: (id, p) => new Line(id, Numbers.parse(p[0]!, 'x1'), Numbers.parse(p[1]!, 'y1'), Numbers.parse(p[2]!, 'x2'), Numbers.parse(p[3]!, 'y2')) }],
    ['text', { count: 3, geometry: ['x', 'y'], make: (id, p) => new Text(id, Numbers.parse(p[0]!, 'x'), Numbers.parse(p[1]!, 'y'), p[2]!) }],
    ['g', { count: 0, geometry: [], make: id => new Group(id) }],
  ]);

  create(type: string, id: string, parameters: readonly string[]): Shape {
    const provider = this.provider(type);
    if (parameters.length !== provider.count && !(provider.paint && parameters.length === provider.count + 1)) throw new Error(`invalid parameters for ${type}`);
    const shape = provider.make(id, parameters);
    if (provider.paint && parameters.length > provider.count) shape.set(provider.paint, parameters[provider.count]!);
    return shape;
  }

  fromAttributes(type: string, id: string, attributes: Readonly<Record<string, string>>, content?: string): Shape {
    const provider = this.provider(type);
    const params = provider.geometry.map(key => attributes[key] ?? '0');
    if (content !== undefined) params.push(content);
    const shape = this.create(type, id, params);
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'id' || provider.geometry.includes(key) || (key === 'data-kind' && shape.isContainer)) continue;
      shape.set(key, value);
    }
    return shape;
  }

  private provider(type: string) {
    const provider = this.#providers.get(type);
    if (!provider) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return provider;
  }
}
