#!/usr/bin/env node
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const base = process.platform === 'darwin' ? join(homedir(), 'Library', 'Application Support', 'FigmaLocal') : process.platform === 'win32' ? join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'FigmaLocal') : join(homedir(), '.local', 'share', 'figma-local');
let install;
try { install = JSON.parse(readFileSync(process.env.FIGMA_LOCAL_CONFIG || join(base, 'install.json'), 'utf8')); } catch {}
const bundled = fileURLToPath(new URL('../../../reader.mjs', import.meta.url));
const reader = install?.rootDir ? join(install.rootDir, 'reader.mjs') : bundled;
const ready = existsSync(reader);
if (process.argv[2] === 'status') {
  console.log(JSON.stringify({ installed: ready, platform: process.platform, cacheConfigured: Boolean(install?.cacheDir), setup: ready ? undefined : 'Execute a configuração Figma Local.' }));
} else if (!ready) {
  console.error(JSON.stringify({ error: 'Leitor não instalado. Execute a configuração Figma Local.' })); process.exitCode = 1;
} else {
  const child = spawnSync(process.execPath, [reader, ...process.argv.slice(2)], { stdio: 'inherit', env: { ...process.env, ...(install?.cacheDir ? { FIGMA_READER_CACHE_DIR: install.cacheDir } : {}) } });
  process.exitCode = child.status ?? 1;
}
