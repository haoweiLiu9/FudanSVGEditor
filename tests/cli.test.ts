import test from 'node:test';
import assert from 'node:assert/strict';
import { EditorSession } from '../src/application/EditorSession.js';
import { CommandDispatcher } from '../src/cli/CommandDispatcher.js';
import { Tokenizer } from '../src/cli/Tokenizer.js';

test('tokenizer preserves paint, quoted content, empty strings and Windows paths', () => {
  const parser = new Tokenizer();
  assert.equal(parser.tokenize('  # comment').length, 0);
  assert.deepEqual(parser.tokenize('set t text "开始 \\"结束\\""').map(t => t.value), ['set', 't', 'text', '开始 "结束"']);
  assert.deepEqual(parser.tokenize('read "C:\\data\\my file.svg"').map(t => t.value), ['read', 'C:\\data\\my file.svg']);
  assert.equal(parser.tokenize('set t text ""').at(-1)!.value, '');
  assert.throws(() => parser.tokenize('set t text "oops'), /unterminated/);
});

test('CLI formats errors and does not confuse quoted in or color with syntax', () => {
  const cli = new CommandDispatcher(new EditorSession());
  assert.equal(cli.dispatch('tree'), "error: no document. use 'init' or 'read' first");
  assert.match(cli.dispatch('help'), /create.*containerId/);
  cli.dispatch('init'); cli.dispatch('create g node');
  assert.equal(cli.dispatch('create rect r 0 0 10 20 #4a90d9 in node'), 'rect#r created in g#node');
  assert.equal(cli.dispatch('create text t 1 2 "in"'), 'text#t created');
  assert.match(cli.dispatch('tree'), /rect#r.*w=10 h=20\s+fill=#4a90d9/);
  assert.match(cli.dispatch('show r'), /parent=g#node/);
  assert.equal(cli.dispatch('set r onclick x'), 'error: unknown attribute: onclick');
  assert.equal(cli.dispatch('scale r 0'), 'error: scale factor must be positive');
  assert.match(cli.dispatch('move r 1x 2'), /^error: invalid number/);
  assert.match(cli.dispatch('move r 1'), /^error: usage:/);
});

test('display commands leave history intact and canvas query is read-only', () => {
  const cli = new CommandDispatcher(new EditorSession()); cli.dispatch('init'); cli.dispatch('create g g');
  cli.dispatch('tree'); cli.dispatch('show g'); cli.dispatch('help'); cli.dispatch('canvas');
  assert.match(cli.dispatch('undo'), /^undone:/);
  assert.equal(cli.dispatch('tree'), 'svg (800x600)');
  cli.dispatch('canvas 100 200'); assert.equal(cli.dispatch('redo'), 'error: undo not allowed after io command');
});
