import { Numbers } from '../domain/Numbers.js';
import { EditorSession } from '../application/EditorSession.js';
import { CreateCommand } from '../application/CreateCommand.js';
import { DeleteCommand } from '../application/DeleteCommand.js';
import { MoveCommand } from '../application/MoveCommand.js';
import { ScaleCommand } from '../application/ScaleCommand.js';
import { SetCommand } from '../application/SetCommand.js';
import { GroupCommand } from '../application/GroupCommand.js';
import { UngroupCommand } from '../application/UngroupCommand.js';
import { AddToCommand } from '../application/AddToCommand.js';
import { FrontCommand } from '../application/FrontCommand.js';
import { BackCommand } from '../application/BackCommand.js';
import { Tokenizer } from './Tokenizer.js';
import { TreeRenderer } from './TreeRenderer.js';
import type { Token } from './Token.js';

export class CommandDispatcher {
  readonly #tokenizer = new Tokenizer();
  readonly #renderer = new TreeRenderer();
  readonly #handlers: ReadonlyMap<string, { syntax: string; counts?: readonly number[]; min?: number; run: (args: readonly Token[]) => string }>;
  constructor(private readonly session: EditorSession) {
    // 唯一的命令名称分派点；未来可改为 CommandProvider 注册。
    this.#handlers = new Map<string, { syntax: string; counts?: readonly number[]; min?: number; run: (args: readonly Token[]) => string }>([
      ['init', { syntax: 'init [w] [h]', counts: [0, 1, 2], run: a => session.init(a[0] ? Numbers.parse(a[0].value, 'width') : 800, a[1] ? Numbers.parse(a[1].value, 'height') : 600) }],
      ['read', { syntax: 'read <file.svg>', counts: [1], run: a => session.read(a[0]!.value) }],
      ['save', { syntax: 'save [file.svg]', counts: [0, 1], run: a => session.save(a[0]?.value) }],
      ['canvas', { syntax: 'canvas [w h]', counts: [0, 2], run: a => a.length ? session.canvas(Numbers.parse(a[0]!.value, 'width'), Numbers.parse(a[1]!.value, 'height')) : session.canvas() }],
      ['create', { syntax: 'create <rect|circle|ellipse|line|text|g> <id> [params...] [in <containerId>]', min: 2, run: a => this.create(a) }],
      ['delete', { syntax: 'delete <id>', counts: [1], run: a => session.execute(new DeleteCommand(session.document, a[0]!.value)) }],
      ['move', { syntax: 'move <id> <dx> <dy>', counts: [3], run: a => session.execute(new MoveCommand(session.document, a[0]!.value, Numbers.parse(a[1]!.value, 'dx'), Numbers.parse(a[2]!.value, 'dy'))) }],
      ['scale', { syntax: 'scale <id> <factor>', counts: [2], run: a => session.execute(new ScaleCommand(session.document, a[0]!.value, Numbers.parse(a[1]!.value, 'scale factor'))) }],
      ['set', { syntax: 'set <id> <attr> <value>', counts: [3], run: a => session.execute(new SetCommand(session.document, a[0]!.value, a[1]!.value, a[2]!.value)) }],
      ['group', { syntax: 'group <newGid> <id1> [id2...]', min: 2, run: a => session.execute(new GroupCommand(session.document, a[0]!.value, a.slice(1).map(t => t.value))) }],
      ['ungroup', { syntax: 'ungroup <gid>', counts: [1], run: a => session.execute(new UngroupCommand(session.document, a[0]!.value)) }],
      ['addto', { syntax: 'addto <gid> <id>', counts: [2], run: a => session.execute(new AddToCommand(session.document, a[0]!.value, a[1]!.value)) }],
      ['front', { syntax: 'front <id>', counts: [1], run: a => session.execute(new FrontCommand(session.document, a[0]!.value)) }],
      ['back', { syntax: 'back <id>', counts: [1], run: a => session.execute(new BackCommand(session.document, a[0]!.value)) }],
      ['tree', { syntax: 'tree [id]', counts: [0, 1], run: a => this.#renderer.tree(session.document, a[0]?.value) }],
      ['show', { syntax: 'show <id>', counts: [1], run: a => this.#renderer.show(session.document, a[0]!.value) }],
      ['help', { syntax: 'help', counts: [0], run: () => [...this.#handlers.values()].map(h => h.syntax).join('\n') }],
      ['undo', { syntax: 'undo', counts: [0], run: () => session.undo() }],
      ['redo', { syntax: 'redo', counts: [0], run: () => session.redo() }],
    ]);
  }
  dispatch(line: string): string {
    try {
      const tokens = this.#tokenizer.tokenize(line); if (!tokens.length) return '';
      const name = tokens[0]!.value; const handler = this.#handlers.get(name);
      if (!handler) throw new Error(`unknown command: ${name}`);
      const args = tokens.slice(1);
      if ((handler.counts && !handler.counts.includes(args.length)) || (handler.min !== undefined && args.length < handler.min)) throw new Error(`usage: ${handler.syntax}`);
      return handler.run(args);
    } catch (error) {
      return `error: ${(error instanceof Error ? error.message : String(error)).replace(/[\r\n]+/g, ' ')}`;
    }
  }
  private create(args: readonly Token[]): string {
    const params = args.slice(2); let parentId: string | undefined;
    const marker = params.at(-2);
    if (marker?.value === 'in' && !marker.quoted) { parentId = params.at(-1)!.value; params.splice(-2); }
    return this.session.execute(new CreateCommand(this.session.document, args[0]!.value, args[1]!.value, params.map(t => t.value), parentId));
  }
}
