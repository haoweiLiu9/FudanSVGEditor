import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, basename, resolve, relative } from 'node:path';

test('source dependencies follow the documented module directions and class files match names', () => {
  const allowed: Readonly<Record<string, readonly string[]>> = {
    domain: ['domain'], application: ['application', 'domain'], infrastructure: ['infrastructure', 'application', 'domain'],
    cli: ['cli', 'application', 'domain'], bootstrap: ['bootstrap', 'cli', 'application', 'domain', 'infrastructure'],
  };
  const root = resolve('src'); const files: string[] = [];
  const walk = (directory: string): void => { for (const entry of readdirSync(directory, { withFileTypes: true })) { const path = join(directory, entry.name); if (entry.isDirectory()) walk(path); else if (path.endsWith('.ts')) files.push(path); } };
  walk(root);
  for (const file of files) {
    const source = readFileSync(file, 'utf8'); const module = relative(root, file).split(/[\\/]/)[0]!;
    for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const dependency = match[1]!;
      if (dependency.startsWith('.')) {
        const target = relative(root, resolve(file, '..', dependency)).split(/[\\/]/)[0]!;
        assert.ok(allowed[module]!.includes(target), `${relative(root, file)} must not depend on ${dependency}`);
      } else if (module === 'domain' || module === 'application') assert.fail(`${module} must not import ${dependency}`);
    }
    const classes = [...source.matchAll(/export\s+(?:abstract\s+)?class\s+(\w+)/g)];
    assert.ok(classes.length <= 1, `one class per file: ${file}`);
    if (classes.length) assert.equal(basename(file, '.ts'), classes[0]![1]);
    assert.doesNotMatch(source, /\bswitch\s*\(/, `unexpected switch dispatch: ${file}`);
  }
});
