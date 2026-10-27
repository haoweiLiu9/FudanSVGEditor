import test from 'node:test';
import assert from 'node:assert/strict';
import { ShapeFactory } from '../src/domain/ShapeFactory.js';
import { SvgDocument } from '../src/domain/SvgDocument.js';
import { Group } from '../src/domain/Group.js';

test('six shapes, geometry scale and group recursion use polymorphism', () => {
  const factory = new ShapeFactory(); const doc = new SvgDocument();
  doc.add(factory.create('g', 'scene', []));
  doc.add(factory.create('rect', 'r', ['10', '20', '30', '40', 'red']), 'scene');
  doc.add(factory.create('circle', 'c', ['5', '6', '7']), 'scene');
  doc.add(factory.create('ellipse', 'e', ['1', '2', '3', '4']), 'scene');
  doc.add(factory.create('line', 'l', ['1', '2', '3', '4', 'black']), 'scene');
  doc.add(factory.create('text', 't', ['10', '20', '开始']), 'scene');
  doc.find('scene').move(2, 3); doc.find('scene').scale(2);
  assert.deepEqual(doc.find('r').attributes(), { id: 'r', x: '24', y: '46', width: '60', height: '80', fill: 'red' });
  assert.equal(doc.find('t').textContent, '开始');
  assert.equal(doc.find('l').attributes().x2, '10');
  assert.equal(doc.size, 6);
});

test('id uniqueness, missing container and unknown types are rejected', () => {
  const factory = new ShapeFactory(); const doc = new SvgDocument(); doc.add(new Group('g'));
  assert.throws(() => doc.add(new Group('g')), /id already exists: g/);
  assert.throws(() => doc.container('missing'), /no such container: missing/);
  assert.throws(() => factory.create('box', 'b', []), /unknown shape type: box/);
  assert.throws(() => factory.create('rect', 'r', ['0', '0', '-1', '2']), /width must not be negative/);
});

test('snapshots are isolated and attribute whitelist validates before changing', () => {
  const doc = new SvgDocument(); const factory = new ShapeFactory(); doc.add(factory.create('circle', 'c', ['1', '2', '3']));
  const snapshot = doc.clone(); doc.find('c').move(10, 10); doc.restore(snapshot);
  assert.equal(doc.find('c').attributes().cx, '1');
  assert.throws(() => doc.find('c').set('r', '-2'), /must not be negative/);
  assert.throws(() => doc.find('c').set('onclick', 'x'), /unknown attribute: onclick/);
  assert.equal(doc.find('c').attributes().r, '3');
  assert.throws(() => doc.find('c').scale(0), /scale factor must be positive/);
});
