import { randomUUID } from 'node:crypto';
import { clipboardChangeCount } from './clipboard.mjs';
import { parseLink, unpackClipboard, clipboardHtml, saveCapture } from '../lib.mjs';
import { queryCached, cachedFiles } from '../service.mjs';

export function createService({ cacheDir, readClipboard = clipboardHtml, changeCount = clipboardChangeCount, platform = process.platform }) {
  const tickets = new Map();
  return async function handle(method, params = {}) {
    if (!params || typeof params !== 'object' || Array.isArray(params)) throw Error('Pedido inválido.');
    if (method === 'ping') return { name: 'Figma Local', version: '0.3.0', platform, captureSupported: ['darwin', 'win32'].includes(platform) };
    if (method === 'files') return { files: cachedFiles(cacheDir) };
    if (method === 'query') return queryCached(cacheDir, params);
    if (method === 'prepare_capture') {
      if (!['darwin', 'win32'].includes(platform)) throw Error('A captura está disponível no macOS e no Windows.');
      const target = parseLink(params.url);
      if (!['node', 'selection', 'page'].includes(params.scope)) throw Error('Escolha o escopo da captura.');
      for (const [id, t] of tickets) if (Date.now() - t.created > 120000) tickets.delete(id);
      if (tickets.size >= 10) throw Error('Há capturas pendentes. Aguarde ou reconecte o leitor.');
      const token = randomUUID();
      tickets.set(token, { target, scope: params.scope, counter: await changeCount(), created: Date.now() });
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
        while (await changeCount() === ticket.counter) {
          if (Date.now() >= deadline) throw Error('O Figma não confirmou uma nova cópia. Use Copiar no Figma e depois Importar cópia manual.');
          await new Promise(r => setTimeout(r, 100));
        }
      }
      let html;
      try { html = await readClipboard(); } catch (error) { throw Error('Não consegui importar a cópia Figma. Selecione as telas e use Copiar. ' + error.message); }
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
