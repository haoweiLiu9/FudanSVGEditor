import { SvgDocument } from '../domain/SvgDocument.js';
import type { Command } from './Command.js';
import { EditorOperations } from './EditorOperations.js';

export abstract class SnapshotCommand implements Command {
  #before?: SvgDocument;
  #after?: SvgDocument;
  #result = '';
  protected readonly edits: EditorOperations;
  protected constructor(protected readonly document: SvgDocument) { this.edits = new EditorOperations(document); }
  protected abstract perform(): string;
  execute(): string {
    const before = this.document.clone();
    try {
      const result = this.perform();
      this.#after = this.document.clone(); this.#before = before; this.#result = result;
      return result;
    } catch (error) { this.document.restore(before); throw error; }
  }
  undo(): string {
    if (!this.#before) throw new Error('command has not executed');
    this.document.restore(this.#before); return `undone: ${this.#result}`;
  }
  redo(): string {
    if (!this.#after) throw new Error('command has not executed');
    this.document.restore(this.#after); return `redone: ${this.#result}`;
  }
}
