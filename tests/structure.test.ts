import test from 'node:test';
import assert from 'node:assert/strict';
import { SvgDocument } from '../src/domain/SvgDocument.js';
import { EditorOperations } from '../src/application/EditorOperations.js';
import { HistoryManager } from '../src/application/HistoryManager.js';
import { GroupCommand } from '../src/application/GroupCommand.js';
import { UngroupCommand } from '../src/application/UngroupCommand.js';
import { AddToCommand } from '../src/application/AddToCommand.js';
import { DeleteCommand } from '../src/application/DeleteCommand.js';
import { FrontCommand } from '../src/application/FrontCommand.js';
import { BackCommand } from '../src/application/BackCommand.js';

test('cross-parent grouping preserves document order and undo restores all parents', () => {
  const doc = new SvgDocument(); const edits = new EditorOperations(doc); const history = new HistoryManager();
  edits.create('g', 'left', []); edits.create('g', 'right', []);
  edits.create('circle', 'a', ['1', '2', '3'], 'left'); edits.create('circle', 'b', ['4', '5', '6'], 'left');
  edits.create('circle', 'c', ['7', '8', '9'], 'right');
  history.execute(new GroupCommand(doc, 'selected', ['c', 'a']));
  assert.deepEqual(doc.find('selected').children.map(x => x.id), ['a', 'c']);
  assert.deepEqual(doc.children.map(x => x.id), ['selected', 'left', 'right']);
  history.undo(); assert.deepEqual(doc.find('left').children.map(x => x.id), ['a', 'b']);
  assert.deepEqual(doc.find('right').children.map(x => x.id), ['c']);
  history.redo(); assert.deepEqual(doc.find('selected').children.map(x => x.id), ['a', 'c']);
});

test('cycles and top-level ungroup are rejected without changes', () => {
  const doc = new SvgDocument(); const edits = new EditorOperations(doc); const history = new HistoryManager();
  edits.create('g', 'outer', []); edits.create('g', 'inner', [], 'outer'); edits.create('text', 't', ['0', '0', 'x'], 'inner');
  assert.throws(() => history.execute(new GroupCommand(doc, 'bad', ['t', 'inner'])), /cannot group a container into its own descendant: inner/);
  assert.throws(() => history.execute(new AddToCommand(doc, 'inner', 'outer')), /own descendant: outer/);
  assert.throws(() => history.execute(new AddToCommand(doc, 'inner', 'inner')), /own descendant: inner/);
  assert.throws(() => history.execute(new UngroupCommand(doc, 'outer')), /cannot ungroup top-level container: outer/);
  assert.equal(doc.parentLabel(doc.find('inner')), 'g#outer'); assert.equal(doc.size, 3);
});

test('ungroup occupies original slot and delete restores whole subtree in one undo', () => {
  const doc = new SvgDocument(); const edits = new EditorOperations(doc); const history = new HistoryManager();
  edits.create('g', 'outer', []); edits.create('g', 'before', [], 'outer'); edits.create('g', 'inner', [], 'outer'); edits.create('g', 'after', [], 'outer');
  edits.create('g', 'a', [], 'inner'); edits.create('g', 'b', [], 'inner');
  history.execute(new UngroupCommand(doc, 'inner'));
  assert.deepEqual(doc.find('outer').children.map(x => x.id), ['before', 'a', 'b', 'after']);
  history.undo(); assert.deepEqual(doc.find('outer').children.map(x => x.id), ['before', 'inner', 'after']);
  history.execute(new DeleteCommand(doc, 'inner')); assert.equal(doc.size, 3);
  history.undo(); assert.deepEqual(doc.find('inner').children.map(x => x.id), ['a', 'b']);
});

test('front back and addto use sibling painting order and append semantics', () => {
  const doc = new SvgDocument(); const edits = new EditorOperations(doc); const history = new HistoryManager();
  for (const id of ['a', 'b', 'c']) edits.create('g', id, []);
  history.execute(new FrontCommand(doc, 'a')); assert.deepEqual(doc.children.map(x => x.id), ['b', 'c', 'a']);
  history.execute(new BackCommand(doc, 'a')); assert.deepEqual(doc.children.map(x => x.id), ['a', 'b', 'c']);
  history.execute(new AddToCommand(doc, 'b', 'a')); assert.equal(doc.parentLabel(doc.find('a')), 'g#b');
  history.undo(); assert.deepEqual(doc.children.map(x => x.id), ['a', 'b', 'c']);
});
