import { EditorSession } from '../application/EditorSession.js';
import { CommandDispatcher } from '../cli/CommandDispatcher.js';
import { Repl } from '../cli/Repl.js';
import { FileDocumentStore } from '../infrastructure/FileDocumentStore.js';
export class Main {
  static async run(): Promise<void> { await new Repl(new CommandDispatcher(new EditorSession(new FileDocumentStore()))).run(); }
}
await Main.run();
