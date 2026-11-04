import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parseLink, unpackClipboard, clipboardHtml, saveCapture } from '../lib.mjs';
import { queryCached, cachedFiles } from '../service.mjs';

export function clipboardChangeCount() {
  if (process.platform !== 'darwin') throw Error('Esta versão captura no macOS.');
  const n = Number(execFileSync('osascript', ['-l', 'JavaScript', '-e', 'ObjC.import("AppKit"); $.NSPasteboard.generalPasteboard.changeCount'], {
    encoding: 'utf8', timeout: 5000, maxBuffer: 10000, stdio: ['ignore', 'pipe', 'pipe'],
  }).trim());
  if (!Number.isSafeInteger(n)) throw Error('Não foi possível verificar a cópia.');
  return n;
}

export function createService({ cacheDir, readClipboard = clipboardHtml, changeCount = clipboardChangeCount, platform = process.platform }) {
  const tickets = new Map();
  return async function handle(method, params = {}) {
    if (!params || typeof params !== 'object' || Array.isArray(params)) throw Error('Pedido inválido.');
    if (method === 'ping') return { name: 'Figma Local', version: '0.2.0', platform, captureSupported: platform === 'darwin' };
    if (method === 'files') return { files: cachedFiles(cacheDir) };
    if (method === 'query') return queryCached(cacheDir, params);
    if (method === 'prepare_capture') {
      if (platform !== 'darwin') throw Error('A captura desta versão está disponível no Mac.');
      const target = parseLink(params.url);
      if (!['node', 'selection', 'page'].includes(params.scope)) throw Error('Escolha o escopo da captura.');
      for (const [id, t] of tickets) if (Date.now() - t.created > 120000) tickets.delete(id);
      if (tickets.size >= 10) throw Error('Há capturas pendentes. Aguarde ou reconecte o leitor.');
      const token = randomUUID();
      tickets.set(token, { target, scope: params.scope, counter: changeCount(), created: Date.now() });
      return { token };
    }
    if (method === 'import_clipboard') {
      const target = parseLink(params.url);
      if (!['node', 'selection', 'page'].includes(params.scope)) throw Error('Escopo inválido.');
      const start = performance.now();
      if (params.manual !== true) {
        const ticket = tickets.get(params.token);
        tickets.delete(params.token);
        if (!ticket || Date.now() - ticket.created > 120000) throw Error('A captura expirou. Clique em capturar novamente.');
        if (ticket.target.fileKey !== target.fileKey || ticket.scope !== params.scope) throw Error('O arquivo ou escopo mudou durante a captura.');
        const deadline = Date.now() + 20000;
        while (changeCount() === ticket.counter) {
          if (Date.now() >= deadline) throw Error('O Figma não confirmou uma nova cópia. Use Copiar no Figma e depois Importar cópia manual.');
          await new Promise(r => setTimeout(r, 100));
        }
      }
      let html;
      try { html = readClipboard(); } catch { throw Error('A área de transferência não contém uma cópia Figma. Selecione as telas e use Copiar.'); }
      const data = unpackClipboard(html, target.fileKey);
      const count = params.expectedCount;
      if (count !== undefined && (!Number.isSafeInteger(count) || count < 1 || count > 50000)) throw Error('Contagem de seleção inválida.');
      const ids = params.selectedIds;
      if (ids !== undefined && (!Array.isArray(ids) || ids.length > 100 || ids.some(n => typeof n !== 'string' || n.length > 200))) throw Error('Seleção inválida.');
      const info = saveCapture(cacheDir, data, { scope: params.scope, requestedUrl: target.url,
        browserUrl: target.url, title: String(params.title || 'Arquivo Figma').slice(0, 160),
        captureMethod: params.manual === true ? 'manual-copy' : 'chrome-copy',
      }, (_scene, roots) => {
        if (count !== undefined && roots.length !== count) throw Error('A cópia não corresponde à seleção. Faça uma nova captura.');
        if (ids?.length === count && ids.every(n => /^\d+:\d+$/.test(n))) {
          const actual = new Set(roots.map(n => n.node_id));
          if (ids.some(id => !actual.has(id))) throw Error('Os nós copiados não correspondem aos selecionados.');
        }
      });
      return { ...info, totalMs: Math.round(performance.now() - start), live: false };
    }
    throw Error('Operação não suportada.');
  };
}
