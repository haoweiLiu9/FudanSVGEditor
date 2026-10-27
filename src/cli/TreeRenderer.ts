import { Shape } from '../domain/Shape.js';
import { SvgDocument } from '../domain/SvgDocument.js';
export class TreeRenderer {
  tree(document: SvgDocument, id?: string): string {
    const lines: string[] = [];
    const append = (children: readonly Shape[], prefix: string): void => {
      children.forEach((child, index) => {
        const last = index === children.length - 1;
        lines.push(`${prefix}${last ? '└── ' : '├── '}${child.summary()}`);
        append(child.children, `${prefix}${last ? '    ' : '│   '}`);
      });
    };
    if (id !== undefined) { const shape = document.find(id); lines.push(shape.summary()); append(shape.children, ''); }
    else { lines.push(`svg (${document.width}x${document.height})`); append(document.children, ''); }
    return lines.join('\n');
  }
  show(document: SvgDocument, id: string): string {
    const shape = document.find(id);
    return [`${shape.label}  parent=${document.parentLabel(shape)}`, shape.geometryDescription(), shape.styleDescription()].filter(Boolean).map((line, index) => index ? `  ${line}` : line).join('\n');
  }
}
