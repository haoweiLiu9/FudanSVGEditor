import { EditorSession } from '../application/EditorSession.js';
import { CommandDispatcher } from '../cli/CommandDispatcher.js';
import { Repl } from '../cli/Repl.js';
export class Main {
  static async run(): Promise<void> { await new Repl(new CommandDispatcher(new EditorSession())).run(); }
}
await Main.run();
