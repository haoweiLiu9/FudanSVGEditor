import test from 'node:test';
import assert from 'node:assert/strict';
import { SvgDocument } from '../src/domain/SvgDocument.js';
import { EditorOperations } from '../src/application/EditorOperations.js';

test('basic editing supports nested creation, absent paint and text updates', () => {
  const doc = new SvgDocument(); const edits = new EditorOperations(doc);
  edits.create('g', 'scene', []); edits.create('rect', 'r', ['1.5', '2', '3', '4'], 'scene');
  assert.equal(doc.parentLabel(doc.find('r')), 'g#scene');
  assert.equal(doc.find('r').attributes().fill, undefined);
  edits.move('r', 0.5, -2); edits.scale('r', 2); edits.set('r', 'stroke-width', '1.5');
  assert.equal(doc.find('r').attributes().x, '4');
  assert.equal(doc.find('r').attributes()['stroke-width'], '1.5');
  edits.create('text', 't', ['0', '0', 'old'], 'scene'); edits.set('t', 'text', '新内容');
  assert.equal(doc.find('t').textContent, '新内容');
  edits.delete('scene'); assert.equal(doc.size, 0);
});

test('failed create and invalid attribute preserve the tree', () => {
  const doc = new SvgDocument(); const edits = new EditorOperations(doc);
  edits.create('circle', 'c', ['1', '2', '3']);
  assert.throws(() => edits.create('g', 'x', [], 'c'), /not a container: c/);
  assert.throws(() => edits.create('g', 'x', [], 'missing'), /no such container: missing/);
  assert.throws(() => edits.set('c', 'width', '4'), /unknown attribute: width/);
  assert.equal(doc.size, 1);
});
