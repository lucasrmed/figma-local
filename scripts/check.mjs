#!/usr/bin/env node
import { readFileSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { APP_ROOT, extensionId } from '../platform.mjs';
import { packageFiles } from './files.mjs';
const json = path => JSON.parse(readFileSync(join(APP_ROOT, path), 'utf8'));
const pkg = json('package.json'), manifest = json('extension/manifest.json'), plugin = json('plugin.json'), lock = json('package-lock.json');
assert.match(pkg.version, /^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/);
assert.equal(manifest.version, pkg.version); assert.equal(plugin.version, pkg.version); assert.equal(lock.packages[''].version, pkg.version);
assert.equal(pkg.license, 'MIT'); assert.equal(manifest.manifest_version, 3);
assert.equal(extensionId(manifest.key), 'cjkffgojhenipdmabikjdfjkjoiajece');
const files = packageFiles(APP_ROOT);
const walk = path => readdirSync(join(APP_ROOT, path)).flatMap(name => {
  const file = join(path, name), s = lstatSync(join(APP_ROOT, file));
  if (s.isSymbolicLink()) throw Error('Link simbólico inesperado: ' + file);
  return s.isDirectory() ? walk(file) : [file];
});
for (const file of [...files, ...(existsSync(join(APP_ROOT, '.github')) ? walk('.github') : [])]) {
  if (/\.[cm]?js$/.test(file)) execFileSync(process.execPath, ['--check', join(APP_ROOT, file)], { stdio: 'pipe' });
  const text = readFileSync(join(APP_ROOT, file), 'utf8');
  assert.ok(!/\/(?:Users|home)\/[A-Za-z0-9._-]+\//.test(text), 'Caminho pessoal no arquivo ' + file);
  assert.ok(!/(?:gh[opusr]_|github_pat_)[A-Za-z0-9_]{20,}/.test(text), 'Possível credencial no arquivo ' + file);
  for (const match of text.matchAll(/https:\/\/(?:www\.)?figma\.com\/(?:design|file|proto)\/([A-Za-z0-9]+)/g)) {
    assert.ok(match[1].length <= 12, 'Use apenas chaves sintéticas nos exemplos: ' + file);
  }
}
assert.ok(readFileSync(join(APP_ROOT, 'LICENSE'), 'utf8').startsWith('MIT License'));
console.log(JSON.stringify({ syntax: true, manifests: true, privacyChecks: true, extensionId: extensionId(manifest.key), distributableFiles: files.length }));
