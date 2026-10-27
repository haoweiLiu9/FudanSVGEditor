import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { Resvg } from '@resvg/resvg-js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';

test('actual CLI process replays assignment transcript and survives expected errors', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-transcript-'));
  try {
    copyFileSync('examples/other.svg', join(directory, 'other.svg'));
    const result = spawnSync(process.execPath, [resolve('dist/src/bootstrap/Main.js')], { cwd: directory, input: readFileSync('examples/session.commands', 'utf8'), encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 0, result.stderr); assert.equal(result.stderr, '');
    assert.match(result.stdout, /svg-editor 0.1/);
    assert.match(result.stdout, /error: cannot group a container into its own descendant: markers/);
    assert.match(result.stdout, /error: undo not allowed after io command/);
    assert.equal(result.stdout.split('\n').filter(line => line.startsWith('error:')).length, 2);
    assert.match(result.stdout, /warning: assigned id rect1 to unnamed <rect>/);
    assert.match(result.stdout, /read other.svg \(7 elements\)/);
    const doc = new SvgCodec().decode(readFileSync(join(directory, 'demo.svg'), 'utf8')).document;
    assert.equal(doc.size, 5); assert.equal(doc.find('c1').attributes().cx, '130');
    assert.equal(doc.find('title').textContent, 'My Diagram');
    assert.equal(doc.parentLabel(doc.find('box')), 'g#markers');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('flowchart CLI output is valid SVG and renders with an independent SVG engine', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-flowchart-'));
  try {
    const result = spawnSync(process.execPath, [resolve('dist/src/bootstrap/Main.js')], { cwd: directory, input: readFileSync('examples/flowchart.commands', 'utf8'), encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 0, result.stderr); assert.doesNotMatch(result.stdout, /^error:/m);
    const svg = readFileSync(join(directory, 'flowchart.svg'), 'utf8');
    const doc = new SvgCodec().decode(svg).document;
    assert.equal(doc.size, 8); assert.equal(doc.find('process').attributes().y, '100');
    assert.equal(doc.find('process-label').textContent, '处理数据 v2');
    const rendered = new Resvg(svg).render(); assert.equal(rendered.width, 800); assert.equal(rendered.height, 600);
    const pixel = (x: number, y: number): readonly number[] => [...rendered.pixels.subarray((y * 800 + x) * 4, (y * 800 + x) * 4 + 4)];
    assert.deepEqual(pixel(125, 105), [74, 144, 217, 255]);
    assert.deepEqual(pixel(525, 105), [245, 166, 35, 255]);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
