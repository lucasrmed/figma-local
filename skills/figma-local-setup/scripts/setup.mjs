#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
let script = fileURLToPath(new URL('../../../scripts/install.mjs', import.meta.url));
if (!existsSync(script)) {
  try { const c = JSON.parse(readFileSync(process.env.FIGMA_LOCAL_CONFIG || join(homedir(), 'Library', 'Application Support', 'FigmaLocal', 'install.json'), 'utf8')); script = join(c.rootDir, 'scripts', 'install.mjs'); } catch {}
}
if (!existsSync(script)) { console.error('Não encontrei o pacote Figma Local. Abra Instalar.command no pacote distribuído.'); process.exitCode = 1; }
else process.exitCode = spawnSync(process.execPath, [script, ...process.argv.slice(2)], { stdio: 'inherit' }).status ?? 1;
