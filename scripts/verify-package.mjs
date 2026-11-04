#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { APP_ROOT } from '../platform.mjs';
import { packageFiles } from './files.mjs';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: { target: { type: 'string' } } });
const target = values.target || (process.platform === 'win32' ? 'windows' : 'macos');
if (!['macos', 'windows'].includes(target)) throw Error('Destino: macos ou windows.');
const pkg = JSON.parse(readFileSync(join(APP_ROOT, 'package.json'), 'utf8'));
const archive = join(APP_ROOT, 'dist', `figma-local-${target}-${pkg.version}.zip`);
const python = `import json,sys,zipfile,hashlib,pathlib\np=json.load(sys.stdin)\nf=pathlib.Path(p['archive'])\nwith zipfile.ZipFile(f) as z:\n assert z.testzip() is None, 'Corrupt archive'\n expected={'FigmaLocal/'+x for x in p['files']}\n assert set(z.namelist())==expected, 'Unexpected archive contents'\n for n in z.namelist():\n  assert not any(x in n.split('/') for x in ('.cache','node_modules','.git','.env','Cookies','Default')), n\n assert z.getinfo('FigmaLocal/Instalar.command').external_attr>>16 & 0o111, 'Installer must be executable'\n assert 'FigmaLocal/LICENSE' in expected\n assert 'FigmaLocal/skills/figma-local/SKILL.md' in expected\n assert 'FigmaLocal/skills/figma-local-setup/SKILL.md' in expected\n assert 'FigmaLocal/extension/manifest.json' in expected\n checksum=hashlib.sha256(f.read_bytes()).hexdigest()+'  '+f.name\n assert (f.parent/'SHA256SUMS').read_text().strip()==checksum, 'Checksum mismatch'\n print(json.dumps({'archiveVerified':True,'files':len(expected),'sha256':checksum.split()[0]}))\n`;
const output = execFileSync(process.platform === 'win32' ? 'python' : 'python3', ['-c', python], { input: JSON.stringify({ archive, files: packageFiles(APP_ROOT) }), encoding: 'utf8' });
process.stdout.write(output);
