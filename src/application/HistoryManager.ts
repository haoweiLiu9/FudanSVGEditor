import type { Command } from './Command.js';
export class HistoryManager {
  #undo: Command[] = [];
  #redo: Command[] = [];
  #blocked = true;
  execute(command: Command): string {
    const result = command.execute();
    this.#undo.push(command); this.#redo = []; this.#blocked = false;
    return result;
  }
  barrier(): void { this.#undo = []; this.#redo = []; this.#blocked = true; }
  undo(): string {
    if (this.#blocked) throw new Error('undo not allowed after io command');
    const command = this.#undo.at(-1);
    if (!command) throw new Error('nothing to undo');
    const result = command.undo(); this.#undo.pop(); this.#redo.push(command); return result;
  }
  redo(): string {
    if (this.#blocked) throw new Error('undo not allowed after io command');
    const command = this.#redo.at(-1);
    if (!command) throw new Error('nothing to redo');
    const result = command.redo(); this.#redo.pop(); this.#undo.push(command); return result;
  }
}
