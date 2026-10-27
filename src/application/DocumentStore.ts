import type { SvgDocument } from '../domain/SvgDocument.js';
export interface DocumentStore {
  load(path: string): { readonly document: SvgDocument; readonly warnings: readonly string[] };
  save(document: SvgDocument, path: string): void;
}
