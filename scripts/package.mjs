#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { APP_ROOT } from '../platform.mjs';
import { packageFiles } from './files.mjs';
const pkg = JSON.parse(readFileSync(join(APP_ROOT, 'package.json'), 'utf8'));
if (!/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(pkg.version)) throw Error('Versão inválida para distribuição.');
const destination = join(APP_ROOT, 'dist', `figma-local-macos-${pkg.version}.zip`);
mkdirSync(join(APP_ROOT, 'dist'), { recursive: true });
const files = packageFiles(APP_ROOT);
for (const file of files) if (!statSync(join(APP_ROOT, file)).isFile()) throw Error('Pacote contém entrada inválida.');
const python = `import json,sys,zipfile,os\np=json.load(sys.stdin)\nwith zipfile.ZipFile(p['destination'],'w',zipfile.ZIP_DEFLATED) as z:\n for f in p['files']:\n  z.write(os.path.join(p['root'],f),'FigmaLocal/'+f)\n`;
execFileSync('python3', ['-c', python], { input: JSON.stringify({ root: APP_ROOT, destination, files }), encoding: 'utf8' });
const hash = createHash('sha256').update(readFileSync(destination)).digest('hex');
writeFileSync(join(APP_ROOT, 'dist', 'SHA256SUMS'), `${hash}  ${basename(destination)}\n`);
console.log(JSON.stringify({ archive: destination, files: files.length, bytes: statSync(destination).size, includesDesignData: false, includesBrowserProfile: false }));
