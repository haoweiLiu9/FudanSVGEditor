import { DOMImplementation, DOMParser, XMLSerializer, type Document as XmlDocument, type Element as XmlElement } from '@xmldom/xmldom';
import { SvgDocument } from '../domain/SvgDocument.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import { Shape } from '../domain/Shape.js';
import { Group } from '../domain/Group.js';
import { Numbers } from '../domain/Numbers.js';

export class SvgCodec {
  readonly #namespace = 'http://www.w3.org/2000/svg';
  constructor(private readonly factory = new ShapeFactory()) {}

  decode(source: string): { readonly document: SvgDocument; readonly warnings: readonly string[] } {
    if (/<!DOCTYPE/i.test(source)) throw new Error('unsupported SVG: DOCTYPE');
    const xml = new DOMParser({ onError: (_level, message) => { throw new Error(`invalid SVG XML: ${message}`); } }).parseFromString(source, 'image/svg+xml');
    const root = xml.documentElement;
    if (!root || root.tagName !== 'svg' || (root.namespaceURI && root.namespaceURI !== this.#namespace)) throw new Error('expected SVG root element');
    const rootAttrs = this.attributes(root);
    for (const key of Object.keys(rootAttrs)) if (!['xmlns', 'width', 'height', 'viewBox', 'version'].includes(key)) throw new Error(`unsupported SVG root attribute: ${key}`);
    const viewBox = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(value => Numbers.parse(value, 'viewBox'));
    if (viewBox && (viewBox.length !== 4 || viewBox[0] !== 0 || viewBox[1] !== 0)) throw new Error('unsupported SVG viewBox');
    const width = root.hasAttribute('width') ? this.pixels(root.getAttribute('width')!, 'width') : viewBox?.[2] ?? 800;
    const height = root.hasAttribute('height') ? this.pixels(root.getAttribute('height')!, 'height') : viewBox?.[3] ?? 600;
    if (viewBox && (viewBox[2] !== width || viewBox[3] !== height)) throw new Error('unsupported SVG viewBox scaling');
    const document = new SvgDocument(width, height);
    const used = new Set<string>(); const warnings: string[] = [];
    // 先扫描整棵外部树的显式 id，避免自动 rect1 与后面已有 rect1 冲突。
    this.collectIds(root, used);
    for (const element of this.elements(root)) document.add(this.decodeShape(element, used, warnings));
    this.rejectUnexpectedText(root);
    return { document, warnings };
  }

  encode(document: SvgDocument): string {
    const xml = new DOMImplementation().createDocument(this.#namespace, 'svg', null);
    const root = xml.documentElement!;
    root.setAttribute('xmlns', this.#namespace); root.setAttribute('width', String(document.width)); root.setAttribute('height', String(document.height));
    root.setAttribute('viewBox', `0 0 ${document.width} ${document.height}`);
    for (const shape of document.children) { root.appendChild(xml.createTextNode('\n  ')); root.appendChild(this.encodeShape(xml, shape, 1)); }
    root.appendChild(xml.createTextNode('\n'));
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(xml)}\n`;
  }

  private decodeShape(element: XmlElement, used: Set<string>, warnings: string[]): Shape {
    if (element.namespaceURI && element.namespaceURI !== this.#namespace) throw new Error(`unsupported SVG namespace: ${element.namespaceURI}`);
    const attributes = this.attributes(element); let id = attributes.id;
    if (!id) {
      let count = 1; while (used.has(`${element.tagName}${count}`)) count++;
      id = `${element.tagName}${count}`; used.add(id);
      warnings.push(`warning: assigned id ${id} to unnamed <${element.tagName}>`);
    }
    const content = Array.from(element.childNodes).filter(node => node.nodeType === 3 || node.nodeType === 4).map(node => node.nodeValue ?? '').join('');
    const shape = this.factory.fromAttributes(element.tagName, id, attributes, content);
    const children = this.elements(element);
    if (shape instanceof Group) {
      this.rejectUnexpectedText(element);
      for (const child of children) shape.insert(this.decodeShape(child, used, warnings));
    } else {
      if (children.length) throw new Error(`unsupported SVG children in <${element.tagName}>`);
      if (shape.textContent === undefined && content.trim()) throw new Error(`unexpected text in <${element.tagName}>`);
    }
    return shape;
  }

  private encodeShape(xml: XmlDocument, shape: Shape, depth: number): XmlElement {
    const element = xml.createElementNS(this.#namespace, shape.tag);
    for (const [key, value] of Object.entries(shape.attributes())) element.setAttribute(key, value);
    if (shape.textContent !== undefined) element.appendChild(xml.createTextNode(shape.textContent));
    for (const child of shape.children) { element.appendChild(xml.createTextNode(`\n${'  '.repeat(depth + 1)}`)); element.appendChild(this.encodeShape(xml, child, depth + 1)); }
    if (shape.children.length) element.appendChild(xml.createTextNode(`\n${'  '.repeat(depth)}`));
    return element;
  }
  private collectIds(element: XmlElement, used: Set<string>): void {
    for (const child of this.elements(element)) {
      const id = child.getAttribute('id');
      if (id) { if (used.has(id)) throw new Error(`id already exists: ${id}`); used.add(id); }
      this.collectIds(child, used);
    }
  }
  private attributes(element: XmlElement): Readonly<Record<string, string>> { return Object.fromEntries(Array.from(element.attributes).map(attribute => [attribute.name, attribute.value])); }
  private elements(element: XmlElement): readonly XmlElement[] {
    for (const node of Array.from(element.childNodes)) if (![1, 3, 4, 8].includes(node.nodeType)) throw new Error('unsupported SVG child node');
    return Array.from(element.childNodes).filter((node): node is XmlElement => node.nodeType === 1);
  }
  private rejectUnexpectedText(element: XmlElement): void {
    if (Array.from(element.childNodes).some(node => (node.nodeType === 3 || node.nodeType === 4) && node.nodeValue?.trim())) throw new Error(`unexpected text in <${element.tagName}>`);
  }
  private pixels(value: string, label: string): number { return Numbers.positive(value.trim().replace(/px$/, ''), label); }
}
