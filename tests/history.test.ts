import test from 'node:test';
import assert from 'node:assert/strict';
import { SvgDocument } from '../src/domain/SvgDocument.js';
import { HistoryManager } from '../src/application/HistoryManager.js';
import { CreateCommand } from '../src/application/CreateCommand.js';
import { MoveCommand } from '../src/application/MoveCommand.js';
import { DeleteCommand } from '../src/application/DeleteCommand.js';
import { ScaleCommand } from '../src/application/ScaleCommand.js';

test('undo redo restore state and new successful edit clears redo', () => {
  const doc = new SvgDocument(); const history = new HistoryManager();
  history.execute(new CreateCommand(doc, 'rect', 'r', ['1', '2', '3', '4']));
  history.execute(new MoveCommand(doc, 'r', 10, 20)); history.undo();
  assert.equal(doc.find('r').attributes().x, '1'); history.redo(); assert.equal(doc.find('r').attributes().x, '11');
  history.undo();
  assert.throws(() => history.execute(new MoveCommand(doc, 'missing', 1, 2)), /no such shape/);
  history.redo(); assert.equal(doc.find('r').attributes().x, '11');
  history.undo(); history.execute(new DeleteCommand(doc, 'r')); assert.throws(() => history.redo(), /nothing to redo/);
  history.undo(); assert.equal(doc.find('r').attributes().x, '1');
});

test('document barrier blocks history until a successful edit', () => {
  const doc = new SvgDocument(); const history = new HistoryManager(); history.barrier();
  assert.throws(() => history.undo(), /undo not allowed after io command/);
  assert.throws(() => history.execute(new MoveCommand(doc, 'missing', 1, 2)), /no such shape/);
  assert.throws(() => history.redo(), /undo not allowed after io command/);
  history.execute(new CreateCommand(doc, 'g', 'g', [])); history.undo(); assert.equal(doc.size, 0);
});

test('partial recursive failure rolls back document and history', () => {
  const doc = new SvgDocument(); const history = new HistoryManager();
  history.execute(new CreateCommand(doc, 'g', 'g', []));
  history.execute(new CreateCommand(doc, 'circle', 'small', ['1', '2', '3'], 'g'));
  history.execute(new CreateCommand(doc, 'circle', 'huge', ['1e308', '2', '3'], 'g'));
  assert.throws(() => history.execute(new ScaleCommand(doc, 'g', 10)), /invalid number/);
  assert.equal(doc.find('small').attributes().cx, '1');
  assert.equal(doc.find('huge').attributes().cx, '1e+308');
  history.undo(); assert.throws(() => doc.find('huge'), /no such shape/);
});
