import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import { CommandDispatcher } from './CommandDispatcher.js';
export class Repl {
  constructor(private readonly dispatcher: CommandDispatcher) {}
  async run(input: Readable = process.stdin, output: Writable = process.stdout, interactive = !!process.stdin.isTTY): Promise<void> {
    const reader = createInterface({ input, output, terminal: interactive });
    output.write("svg-editor 0.1 — type 'help' for commands\n");
    reader.setPrompt('svg> '); if (interactive) reader.prompt();
    for await (const line of reader) {
      const result = this.dispatcher.dispatch(line); if (result) output.write(`${result}\n`);
      if (interactive) reader.prompt();
    }
  }
}
