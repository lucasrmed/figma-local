import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const powershellPath = () => join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
let bridge;

// Compile the small Win32 adapter once per host, then reuse it while polling for Copy.
function windowsRequest(method) {
  if (!bridge) {
    const script = readFileSync(new URL('./clipboard-windows.ps1', import.meta.url), 'utf8');
    const child = spawn(powershellPath(), ['-NoLogo', '-NoProfile', '-NonInteractive', '-STA', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    const state = { child, pending: new Map(), next: 0, buffer: '' };
    bridge = state;
    const reference = active => {
      for (const stream of [child.stdin, child.stdout, child.stderr]) stream[active ? 'ref' : 'unref']?.();
      child[active ? 'ref' : 'unref']();
    };
    state.reference = reference;
    const fail = () => {
      if (bridge === state) bridge = undefined;
      for (const p of state.pending.values()) { clearTimeout(p.timer); p.reject(Error('Não consegui acessar a cópia do Windows. Verifique se o PowerShell está permitido neste computador.')); }
      state.pending.clear(); child.kill(); reference(false);
    };
    child.on('error', fail); child.on('exit', fail); child.stdin.on('error', fail);
    child.stderr.resume();
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      state.buffer += chunk;
      if (state.buffer.length > 180 * 1024 * 1024) { fail(); return; }
      let index;
      while ((index = state.buffer.indexOf('\n')) >= 0) {
        const line = state.buffer.slice(0, index); state.buffer = state.buffer.slice(index + 1);
        let response; try { response = JSON.parse(line); } catch { fail(); return; }
        const pending = state.pending.get(response.id);
        if (!pending) { fail(); return; }
        state.pending.delete(response.id); clearTimeout(pending.timer);
        if (response.ok) pending.resolve(response.result);
        else pending.reject(Error(response.error || 'Não consegui ler a cópia do Windows.'));
      }
      if (!state.pending.size) reference(false);
    });
  }
  const state = bridge, id = ++state.next;
  state.reference(true);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      state.pending.delete(id); reject(Error('O Windows demorou para liberar a área de transferência. Tente copiar novamente.'));
      state.child.kill();
    }, 15000);
    state.pending.set(id, { resolve, reject, timer });
    state.child.stdin.write(JSON.stringify({ id, method }) + '\n');
  });
}

export function closeClipboard() { bridge?.child.kill(); }

export async function clipboardHtml() {
  if (process.platform === 'win32') return Buffer.from(await windowsRequest('read'), 'base64').toString('utf8');
  if (process.platform !== 'darwin') throw Error('A captura está disponível no macOS e no Windows.');
  const raw = execFileSync('osascript', ['-e', 'the clipboard as «class HTML»'], {
    encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: 10000, stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  return Buffer.from(raw.replace(/^«data \w{4}/, '').replace(/»$/, ''), 'hex').toString('utf8');
}

export async function clipboardChangeCount() {
  if (process.platform === 'win32') return windowsRequest('count');
  if (process.platform !== 'darwin') throw Error('A captura está disponível no macOS e no Windows.');
  const n = Number(execFileSync('osascript', ['-l', 'JavaScript', '-e', 'ObjC.import("AppKit"); $.NSPasteboard.generalPasteboard.changeCount'], {
    encoding: 'utf8', timeout: 5000, maxBuffer: 10000, stdio: ['ignore', 'pipe', 'pipe'],
  }).trim());
  if (!Number.isSafeInteger(n)) throw Error('Não foi possível verificar a cópia.');
  return n;
}
