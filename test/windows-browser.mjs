import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Only a disposable CI browser profile and synthetic captures are used here.
export async function verifyWindowsBrowser({ chrome, extensionDir, extensionId, temp, params }) {
  const profile = join(temp, 'chrome-test-profile');
  const browser = spawn(chrome, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, `--disable-extensions-except=${extensionDir}`, `--load-extension=${extensionDir}`, `chrome-extension://${extensionId}/panel.html`], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let socket, diagnostics = '';
  browser.stderr.on('data', data => { diagnostics = (diagnostics + data.toString()).slice(-4000); });
  browser.on('error', error => { diagnostics += error.message; });
  const pause = () => new Promise(resolve => setTimeout(resolve, 200));
  try {
    const portFile = join(profile, 'DevToolsActivePort'), deadline = Date.now() + 45000;
    while (!existsSync(portFile)) { if (Date.now() >= deadline) throw Error('Chrome startup: ' + diagnostics); await pause(); }
    const port = readFileSync(portFile, 'utf8').split('\n')[0];
    let page;
    while (!page) {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      page = pages.find(p => p.type === 'page' && p.url === `chrome-extension://${extensionId}/panel.html`);
      if (Date.now() >= deadline) throw Error('Extension panel did not open: ' + JSON.stringify(pages));
      if (!page) await pause();
    }
    socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    let serial = 0;
    const pending = new Map();
    socket.addEventListener('message', event => {
      const data = JSON.parse(event.data), p = pending.get(data.id);
      if (!p) return;
      pending.delete(data.id); clearTimeout(p.timer); data.error ? p.reject(Error(JSON.stringify(data.error))) : p.resolve(data.result);
    });
    const evaluate = async expression => {
      const id = ++serial;
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { pending.delete(id); reject(Error('Chrome evaluation timeout')); }, 55000);
        pending.set(id, { resolve, reject, timer });
        socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true, awaitPromise: true } }));
      });
      if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    const rpc = message => evaluate(`new Promise(resolve => chrome.runtime.sendMessage(${JSON.stringify(message)}, resolve))`);
    const ping = await rpc({ action: 'ping' });
    assert.equal(ping.ok, true, JSON.stringify(ping)); assert.equal(ping.result.platform, 'win32');
    const capture = await rpc({ action: 'import_manual', params });
    assert.equal(capture.ok, true, JSON.stringify(capture)); assert.equal(capture.result.frameCandidates, 2);
    const summary = await rpc({ action: 'query', params: { command: 'summary', urls: ['https://www.figma.com/design/TESTFILE/?node-id=1-2'] } });
    assert.equal(summary.ok, true, JSON.stringify(summary)); assert.deepEqual(summary.result.items[0].text, ['Olá, ação ✓']);
    console.log(JSON.stringify({ windowsChromeExtension: true, registryDiscoveredByChrome: true, nativeClipboardImport: true, summaryUTF8: true }));
  } finally {
    socket?.close();
    if (browser.pid) { try { execFileSync('taskkill.exe', ['/pid', String(browser.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true }); } catch {} }
  }
}
