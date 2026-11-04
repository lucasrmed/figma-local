import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { packageFiles } from '../scripts/files.mjs';

test('distribuição exclui cache, credenciais e dependências e rejeita symlinks', t => {
  const root = mkdtempSync(join(tmpdir(), 'figma-local-distribution-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'docs'));
  writeFileSync(join(root, 'README.md'), 'Public documentation');
  writeFileSync(join(root, '.env'), 'PRIVATE_TEST_DATA');
  mkdirSync(join(root, '.cache')); writeFileSync(join(root, '.cache', 'capture'), 'PRIVATE_TEST_DATA');
  mkdirSync(join(root, 'node_modules')); writeFileSync(join(root, 'node_modules', 'dependency'), 'dependency');
  assert.deepEqual(packageFiles(root), ['README.md']);
  symlinkSync(join(root, '.cache'), join(root, 'docs', 'outside-dir'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => packageFiles(root), /simbólicos/);
});
