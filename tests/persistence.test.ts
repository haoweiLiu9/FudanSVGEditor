import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { FileDocumentStore } from '../src/infrastructure/FileDocumentStore.js';
import { EditorSession } from '../src/application/EditorSession.js';
import { CommandDispatcher } from '../src/cli/CommandDispatcher.js';

test('all six types round trip with XML escaping and nested inherited paint', () => {
  const codec = new SvgCodec();
  const source = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><g id="g" fill="red"><rect id="r" x="1" y="2" width="3" height="4"/><circle id="c" r="2"/><ellipse id="e" rx="3" ry="4"/><line id="l" x2="2" stroke="black"/><text id="t" x="1" y="2">开始 &amp; &lt;结束&gt; "quoted"</text><text id="empty"/></g></svg>';
  const first = codec.decode(source).document; const saved = codec.encode(first); const second = codec.decode(saved).document;
  assert.match(saved, /&amp;/); assert.match(saved, /&lt;/);
  assert.equal(second.find('t').textContent, '开始 & <结束> "quoted"');
  assert.equal(second.find('empty').textContent, '');
  assert.deepEqual(second.all().map(s => s.attributes()), first.all().map(s => s.attributes()));
  assert.equal(second.find('r').attributes().fill, undefined);
});

test('missing ids avoid every explicit id, duplicates and unsupported SVG are rejected', () => {
  const codec = new SvgCodec();
  const result = codec.decode('<svg><rect/><g id="g"><rect id="rect1"/><rect/></g></svg>');
  assert.deepEqual(result.warnings, ['warning: assigned id rect2 to unnamed <rect>', 'warning: assigned id rect3 to unnamed <rect>']);
  assert.equal(result.document.size, 4);
  assert.throws(() => codec.decode('<svg><g id="same"/><rect id="same"/></svg>'), /id already exists: same/);
  assert.throws(() => codec.decode('<svg><g id="g" transform="translate(1,2)"/></svg>'), /unknown attribute: transform/);
  assert.throws(() => codec.decode('<svg><path id="p"/></svg>'), /unknown shape type: path/);
  assert.throws(() => codec.decode('<svg><g></svg>'), /./);
  assert.throws(() => codec.decode('<!DOCTYPE svg><svg/>'), /DOCTYPE/);
  assert.throws(() => codec.decode('<svg viewBox="0 0 100 200" width="300" height="200"/>'), /viewBox scaling/);
});

test('file save and read set barriers, failures preserve document path and redo', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-editor-'));
  try {
    const file = join(directory, 'my diagram.svg'); const missing = join(directory, 'missing', 'x.svg');
    const session = new EditorSession(new FileDocumentStore()); const cli = new CommandDispatcher(session);
    cli.dispatch('init'); cli.dispatch('create circle c 1 2 3'); cli.dispatch('move c 10 0'); cli.dispatch('undo');
    assert.match(cli.dispatch(`save "${missing}"`), /^error: cannot write file:/);
    assert.match(cli.dispatch('redo'), /^redone:/);
    assert.match(cli.dispatch(`save "${file}"`), /^saved to/);
    assert.equal(cli.dispatch('undo'), 'error: undo not allowed after io command');
    cli.dispatch('move c 1 0'); assert.match(cli.dispatch('save'), /^saved to/);
    assert.match(readFileSync(file, 'utf8'), /cx="12"/);
    cli.dispatch('move c 1 0');
    writeFileSync(join(directory, 'bad.svg'), '<svg><g></svg>');
    assert.match(cli.dispatch(`read "${join(directory, 'bad.svg')}"`), /^error:/);
    assert.equal(session.document.find('c').attributes().cx, '13'); assert.match(cli.dispatch('undo'), /^undone:/);
    assert.match(cli.dispatch(`read "${file}"`), /^read/);
    assert.equal(cli.dispatch('redo'), 'error: undo not allowed after io command');
    assert.match(cli.dispatch(`read "${missing}"`), /^error: cannot read file:/);
    assert.equal(readdirSync(directory).filter(name => name.endsWith('.tmp')).length, 0);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('init forgets path and failed resize retains document and history', () => {
  const session = new EditorSession(new FileDocumentStore()); const cli = new CommandDispatcher(session);
  cli.dispatch('init 400 300'); cli.dispatch('create g g');
  assert.match(cli.dispatch('canvas 100 -2'), /^error:/); assert.equal(cli.dispatch('canvas'), 'canvas 400x300');
  assert.match(cli.dispatch('undo'), /^undone:/);
  cli.dispatch('init'); assert.equal(cli.dispatch('save'), 'error: no save path. use save <file.svg>');
});
