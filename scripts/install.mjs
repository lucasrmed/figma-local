#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, cpSync, chmodSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { APP_ROOT, HOST_NAME, userPaths, extensionId } from '../platform.mjs';
import { packageFiles } from './files.mjs';
const { values: flags } = parseArgs({ options: { home: { type: 'string' }, 'profile-dir': { type: 'string', multiple: true }, open: { type: 'boolean' }, 'migrate-cache': { type: 'boolean' } } });
const quote = s => "'" + s.replaceAll("'", "'\\''") + "'";
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
try {
  if (process.platform !== 'darwin') throw Error('Esta versão do instalador atende macOS.');
  if (Number(process.versions.node.split('.')[0]) < 22) throw Error('Instale uma versão LTS mantida do Node.js (22 ou posterior) e execute novamente.');
  const home = resolve(flags.home || homedir()), paths = userPaths(home);
  const marker = join(paths.app, '.figma-local-managed.json');
  if (existsSync(paths.app) && !existsSync(marker) && resolve(paths.app) !== resolve(APP_ROOT)) throw Error('A pasta de destino já existe e não é gerenciada pelo Figma Local.');
  mkdirSync(paths.app, { recursive: true, mode: 0o700 });
  if (resolve(paths.app) !== resolve(APP_ROOT)) for (const file of packageFiles(APP_ROOT)) {
    mkdirSync(dirname(join(paths.app, file)), { recursive: true }); copyFileSync(join(APP_ROOT, file), join(paths.app, file));
  }
  writeFileSync(marker, JSON.stringify({ package: 'figma-local', version: '0.2.0' }), { mode: 0o600 });
  const lockHash = createHash('sha256').update(readFileSync(join(paths.app, 'package-lock.json'))).digest('hex');
  let previousHash; try { previousHash = readFileSync(join(paths.app, '.installed-lock'), 'utf8'); } catch {}
  if (previousHash !== lockHash || !existsSync(join(paths.app, 'node_modules', 'figma-clipboard-mcp'))) {
    execFileSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: paths.app, stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 });
    writeFileSync(join(paths.app, '.installed-lock'), lockHash, { mode: 0o600 });
  }
  mkdirSync(paths.cache, { recursive: true, mode: 0o700 });
  let migratedFiles = 0;
  if (flags['migrate-cache'] && existsSync(join(APP_ROOT, '.cache'))) {
    const { cachedFiles } = await import('../service.mjs');
    for (const f of cachedFiles(join(APP_ROOT, '.cache'))) {
      const destination = join(paths.cache, f.fileKey);
      if (!existsSync(destination)) { cpSync(join(APP_ROOT, '.cache', f.fileKey), destination, { recursive: true }); migratedFiles++; }
    }
  }
  const manifest = JSON.parse(readFileSync(join(paths.app, 'extension', 'manifest.json'), 'utf8'));
  const id = extensionId(manifest.key);
  const skillNames = ['figma-local', 'figma-local-setup'];
  for (const name of skillNames) {
    const destination = join(paths.skills, name);
    if (existsSync(destination) && !existsSync(join(destination, '.figma-local-managed.json'))) throw Error(`A skill ${name} já existe e não foi criada por este instalador.`);
    mkdirSync(destination, { recursive: true });
    cpSync(join(paths.app, 'skills', name), destination, { recursive: true });
    writeFileSync(join(destination, '.figma-local-managed.json'), JSON.stringify({ package: 'figma-local', version: '0.2.0' }), { mode: 0o600 });
  }
  const config = { package: 'figma-local', version: '0.2.0', rootDir: paths.app, cacheDir: paths.cache, extensionId: id, installedAt: new Date().toISOString() };
  writeFileSync(paths.config, JSON.stringify(config, null, 2), { mode: 0o600 });
  const launcher = join(paths.base, 'native-launcher');
  writeFileSync(launcher, `#!/bin/sh\nexport FIGMA_LOCAL_CONFIG=${quote(paths.config)}\nexec ${quote(process.execPath)} ${quote(join(paths.app, 'native', 'host.mjs'))} "$@"\n`, { mode: 0o700 }); chmodSync(launcher, 0o700);
  const profileRoots = [join(home, 'Library', 'Application Support', 'Google', 'Chrome'), join(home, 'Library', 'Application Support', 'Google', 'ChromeForTesting'), join(home, 'Library', 'Application Support', 'Chromium'), ...(flags['profile-dir'] || []).map(p => resolve(p))];
  const hostManifest = { name: HOST_NAME, description: 'Figma Local reader', path: launcher, type: 'stdio', allowed_origins: [`chrome-extension://${id}/`] };
  for (const profile of new Set(profileRoots)) { const dir = join(profile, 'NativeMessagingHosts'); mkdirSync(dir, { recursive: true, mode: 0o700 }); writeFileSync(join(dir, HOST_NAME + '.json'), JSON.stringify(hostManifest, null, 2), { mode: 0o600 }); }
  const extensionDir = join(paths.app, 'extension'), guidePath = join(paths.base, 'Instalacao.html');
  writeFileSync(guidePath, `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Figma Local instalado</title><style>body{max-width:700px;margin:60px auto;padding:24px;font:16px/1.6 system-ui;background:#f3f6f2;color:#183d2c}h1{font-size:32px}section{padding:24px;background:white;border-radius:16px;margin:20px 0}code{display:block;background:#eef3ed;padding:12px;overflow-wrap:anywhere;border-radius:8px}a{color:#12684a}</style><h1>O leitor e as skills estão instalados.</h1><section><h2>Carregue a extensão no Chrome</h2><ol><li>Abra <strong>chrome://extensions</strong>.</li><li>Ative <strong>Modo do desenvolvedor</strong>.</li><li>Escolha <strong>Carregar sem compactação</strong> e selecione a pasta abaixo.</li></ol><code>${escape(extensionDir)}</code><p>ID esperado: ${id}</p></section><section><h2>Comece pelo Figma</h2><p>Abra seu arquivo no Chrome e entre com sua conta. Clique no ícone Figma Local e capture a seleção ou a página. Confirme pelo botão que aparece dentro do Figma.</p><p>Selecione as telas do catálogo e use Copiar pedido para o Codex.</p></section><section><h2>Use a skill no Codex</h2><p>Em uma nova conversa, invoque <strong>$figma-local</strong>. Se a skill não aparecer, reabra o Codex.</p><p>A captura é local e precisa ser refeita quando o design mudar. Beta para macOS; detalhes de componentes remotos podem estar parciais.</p></section></html>`, { mode: 0o600 });
  console.log(JSON.stringify({ installed: true, appRoot: paths.app, extensionDir, extensionId: id, skills: skillNames, guidePath, migratedFiles }));
  if (flags.open) execFileSync('open', [guidePath]);
} catch (error) { console.error(JSON.stringify({ error: error.message })); process.exitCode = 1; }
