import { readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DocumentStore } from '../application/DocumentStore.js';
import { SvgDocument } from '../domain/SvgDocument.js';
import { SvgCodec } from './SvgCodec.js';

export class FileDocumentStore implements DocumentStore {
  constructor(private readonly codec = new SvgCodec()) {}
  load(path: string): { readonly document: SvgDocument; readonly warnings: readonly string[] } {
    let source: string;
    try { source = readFileSync(path, 'utf8'); } catch { throw new Error(`cannot read file: ${path}`); }
    return this.codec.decode(source);
  }
  save(document: SvgDocument, path: string): void {
    const content = this.codec.encode(document);
    const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
    try { writeFileSync(temporary, content, { encoding: 'utf8', flag: 'wx' }); renameSync(temporary, path); }
    catch { throw new Error(`cannot write file: ${path}`); }
    finally { try { rmSync(temporary, { force: true }); } catch { /* 原始写入错误优先，无法清理的临时文件不覆盖原文件。 */ } }
  }
}
