import { SvgDocument } from '../domain/SvgDocument.js';
import type { Command } from './Command.js';
import type { DocumentStore } from './DocumentStore.js';
import { HistoryManager } from './HistoryManager.js';

export class EditorSession {
  #document?: SvgDocument;
  #path?: string;
  readonly #history = new HistoryManager();
  constructor(private readonly store?: DocumentStore) {}
  get document(): SvgDocument {
    if (!this.#document) throw new Error("no document. use 'init' or 'read' first");
    return this.#document;
  }
  init(width = 800, height = 600): string {
    const document = new SvgDocument(width, height);
    this.#document = document; this.#path = undefined; this.#history.barrier();
    return `canvas ${width}x${height} created`;
  }
  canvas(width?: number, height?: number): string {
    const document = this.document;
    if (width !== undefined || height !== undefined) {
      if (width === undefined || height === undefined) throw new Error('canvas requires width and height');
      document.resize(width, height); this.#history.barrier();
    }
    return `canvas ${document.width}x${document.height}`;
  }
  execute(command: Command): string { this.document; return this.#history.execute(command); }
  undo(): string { this.document; return this.#history.undo(); }
  redo(): string { this.document; return this.#history.redo(); }
  read(path: string): string {
    if (!this.store) throw new Error('document persistence is unavailable');
    const result = this.store.load(path);
    this.#document = result.document; this.#path = path; this.#history.barrier();
    return [...result.warnings, `read ${path} (${result.document.size} elements)`].join('\n');
  }
  save(path?: string): string {
    const document = this.document; const destination = path ?? this.#path;
    if (!destination) throw new Error('no save path. use save <file.svg>');
    if (!this.store) throw new Error('document persistence is unavailable');
    this.store.save(document, destination);
    this.#path = destination; this.#history.barrier();
    return `saved to ${destination} (${document.size} elements)`;
  }
}
