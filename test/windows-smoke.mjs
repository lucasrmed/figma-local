// Explicit integration check for disposable Windows CI runners: changes the clipboard
// and installs a host under HKCU. Ordinary npm test never changes those user settings.
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { clipboardFixture } from './fixture.mjs';
import { clipboardHtml, clipboardChangeCount, closeClipboard, powershellPath } from '../native/clipboard.mjs';
import { encodeMessage } from '../native/protocol.mjs';
import { windowsRegistryKeys } from '../scripts/install-platform.mjs';
import { APP_ROOT, HOST_NAME } from '../platform.mjs';
import { verifyWindowsBrowser } from './windows-browser.mjs';

if (process.platform !== 'win32' || process.env.CI !== 'true') throw Error('Execute apenas na CI Windows descartável.');
process.env.FIGMA_LOCAL_DEBUG_INSTALL = '1';
const temp = mkdtempSync(join(tmpdir(), 'figma-local-windows-'));
const home = join(temp, "D'Ávila & 50%! teste");
let host;
const ps = command => execFileSync(powershellPath(), ['-NoLogo', '-NoProfile', '-NonInteractive', '-STA', '-EncodedCommand', Buffer.from(command, 'utf16le').toString('base64')], { encoding: 'utf8', windowsHide: true, timeout: 20000 });
const clipboardPath = join(temp, 'clipboard.html');
process.env.FIGMA_LOCAL_TEST_HTML = clipboardPath;
function copy(html) {
  writeFileSync(clipboardPath, html);
  ps(`$ProgressPreference = 'SilentlyContinue'; Add-Type -AssemblyName System.Windows.Forms; $data = New-Object System.Windows.Forms.DataObject; $bytes = [Text.Encoding]::UTF8.GetBytes([IO.File]::ReadAllText($env:FIGMA_LOCAL_TEST_HTML)); $stream = New-Object IO.MemoryStream(,$bytes); $data.SetData('HTML Format', $false, $stream); [System.Windows.Forms.Clipboard]::SetDataObject($data, $true, 10, 100)`);
}
try {
  mkdirSync(home);
  const installed = JSON.parse(execFileSync(process.execPath, ['scripts/install.mjs', '--home', home], { cwd: APP_ROOT, encoding: 'utf8', timeout: 180000 }));
  assert.equal(installed.installed, true);
  const base = join(home, 'AppData', 'Local', 'FigmaLocal');
  const config = JSON.parse(readFileSync(join(base, 'install.json'), 'utf8'));
  const marker = join(config.cacheDir, 'preserved.txt'); writeFileSync(marker, 'keep');
  execFileSync(process.execPath, ['scripts/install.mjs', '--home', home], { cwd: APP_ROOT, timeout: 120000 });
  assert.equal(readFileSync(marker, 'utf8'), 'keep');
  for (const key of windowsRegistryKeys(HOST_NAME)) assert.ok(execFileSync('reg.exe', ['query', key, '/ve'], { encoding: 'utf8' }).includes(join(base, HOST_NAME + '.json')));
  const fixture = clipboardFixture();
  const cfHtml = `Version:1.0\r\nStartHTML:-1\r\nEndHTML:-1\r\nStartFragment:0000000000\r\nEndFragment:0000000000\r\n<html><!--StartFragment--><p>Olá, ação ✓</p>${fixture.html}<!--EndFragment--></html>`;
  copy(cfHtml);
  const before = await clipboardChangeCount();
  const read = await clipboardHtml();
  assert.ok(read.includes('Olá, ação ✓'), 'UTF-8 clipboard prefix: ' + JSON.stringify(read.slice(0, 240)));
  copy(cfHtml);
  assert.notEqual(await clipboardChangeCount(), before);
  const launcher = join(base, 'native-launcher.cmd');
  const origin = `chrome-extension://${config.extensionId}/`;
  host = spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `""${launcher}" "${origin}" --parent-window=0"`], { windowsVerbatimArguments: true, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  let buffer = Buffer.alloc(0), next = 0;
  const pending = new Map();
  host.stdout.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length >= 4 && buffer.length >= buffer.readUInt32LE(0) + 4) {
      const size = buffer.readUInt32LE(0), response = JSON.parse(buffer.subarray(4, size + 4)); buffer = buffer.subarray(size + 4);
      const p = pending.get(response.id); pending.delete(response.id); clearTimeout(p.timer);
      response.ok ? p.resolve(response.result) : p.reject(Error(response.error));
    }
  });
  let diagnostics = ''; host.stderr.on('data', chunk => { diagnostics += chunk.toString(); });
  const request = (method, params) => new Promise((resolve, reject) => {
    const id = ++next, timer = setTimeout(() => reject(Error('Host timeout: ' + diagnostics.slice(0, 2000))), 30000);
    pending.set(id, { resolve, reject, timer }); host.stdin.write(encodeMessage({ id, method, params }));
  });
  assert.equal((await request('ping')).platform, 'win32');
  const params = { url: 'https://www.figma.com/design/TESTFILE/?node-id=1-1', scope: 'selection', expectedCount: 1, selectedIds: ['1:1'] };
  const ticket = await request('prepare_capture', params);
  copy(cfHtml);
  assert.equal((await request('import_clipboard', { ...params, token: ticket.token })).frameCandidates, 2);
  const summary = await request('query', { command: 'summary', urls: ['https://www.figma.com/design/TESTFILE/?node-id=1-2'] });
  assert.deepEqual(summary.items[0].text, ['Olá, ação ✓']);
  await assert.rejects(request('import_clipboard', { ...params, token: ticket.token }), /expirou/);
  const env = { ...process.env, FIGMA_LOCAL_CONFIG: join(base, 'install.json') };
  const helper = join(home, '.codex', 'skills', 'figma-local', 'scripts', 'reader.mjs');
  assert.equal(JSON.parse(execFileSync(process.execPath, [helper, 'status'], { env, encoding: 'utf8' })).installed, true);
  const fromSkill = JSON.parse(execFileSync(process.execPath, [helper, 'summary', 'https://www.figma.com/design/TESTFILE/?node-id=1-2'], { env, encoding: 'utf8' }));
  assert.deepEqual(fromSkill.items[0].text, ['Olá, ação ✓']);
  if (process.env.FIGMA_LOCAL_TEST_CHROME) await verifyWindowsBrowser({ chrome: process.env.FIGMA_LOCAL_TEST_CHROME, extensionDir: installed.extensionDir, extensionId: config.extensionId, temp, params });
  console.log(JSON.stringify({ windows: true, installAndUpdate: true, registryHKCU: true, unicodeClipboard: true, freshness: true, batchNativeProtocol: true, skills: true }));
} finally {
  host?.stdin.end(); host?.kill(); closeClipboard();
  for (const key of windowsRegistryKeys(HOST_NAME)) { try { execFileSync('reg.exe', ['delete', key, '/f'], { stdio: 'ignore' }); } catch {} }
  // Windows can keep launcher/Node files open briefly after stdin closes.
  for (let i = 0; i < 20; i++) { try { rmSync(temp, { recursive: true, force: true }); break; } catch { await new Promise(r => setTimeout(r, 200)); } }
}
