import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { existsSync, readdirSync, lstatSync, mkdirSync, copyFileSync } from 'node:fs';
import { powershellPath } from '../native/clipboard.mjs';

const shellQuote = s => "'" + s.replaceAll("'", "'\\''") + "'";
const batchPath = s => {
  if (/[\r\n"]/u.test(s)) throw Error('O caminho de instalação contém caracteres não suportados.');
  return s.replaceAll('%', '%%');
};

export function copyDirectory(source, destination) {
  mkdirSync(destination, { recursive: true });
  for (const name of readdirSync(source)) {
    const from = join(source, name), to = join(destination, name), stat = lstatSync(from);
    if (stat.isSymbolicLink()) throw Error('Links simbólicos não são aceitos na instalação.');
    if (stat.isDirectory()) copyDirectory(from, to);
    else if (stat.isFile()) copyFileSync(from, to);
    else throw Error('Tipo de arquivo não suportado na instalação.');
  }
}

export function launcherText(paths, node, platform = process.platform) {
  if (platform === 'win32') return ['@echo off', 'chcp 65001 >nul', 'setlocal DisableDelayedExpansion',
    `set "FIGMA_LOCAL_CONFIG=${batchPath(paths.config)}"`, `"${batchPath(node)}" "${batchPath(join(paths.app, 'native', 'host.mjs'))}" %*`, 'exit /b %errorlevel%', ''].join('\r\n');
  return `#!/bin/sh\nexport FIGMA_LOCAL_CONFIG=${shellQuote(paths.config)}\nexec ${shellQuote(node)} ${shellQuote(join(paths.app, 'native', 'host.mjs'))} "$@"\n`;
}

export function installDependencies(app) {
  const options = { cwd: app, stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000, windowsHide: true };
  const args = ['ci', '--ignore-scripts', '--no-audit', '--no-fund'];
  if (process.platform !== 'win32') return execFileSync('npm', args, options);
  // Execute npm's JS entry point directly: .cmd files cannot be execFile targets.
  const npmCli = [process.env.npm_execpath, join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')]
    .find(p => p && /[/\\]npm-cli\.js$/.test(p) && existsSync(p));
  if (!npmCli) throw Error('Não encontrei o npm. Instale o Node.js LTS pelo instalador oficial e tente novamente.');
  return execFileSync(process.execPath, [npmCli, ...args], options);
}

export function windowsRegistryKeys(host) {
  return ['Google\\Chrome', 'Chromium'].map(browser => `HKCU\\Software\\${browser}\\NativeMessagingHosts\\${host}`);
}

export function openGuide(guidePath) {
  if (process.platform !== 'win32') return execFileSync('open', [guidePath]);
  const command = 'Start-Process -FilePath $env:FIGMA_LOCAL_GUIDE';
  return execFileSync(powershellPath(), ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(command, 'utf16le').toString('base64')], {
    windowsHide: true, env: { ...process.env, FIGMA_LOCAL_GUIDE: guidePath }, stdio: 'ignore', timeout: 15000,
  });
}
