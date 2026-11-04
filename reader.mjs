#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { parseLink, unpackClipboard, clipboardHtml, saveCapture } from './lib.mjs';
import { queryCached, cachedFiles } from './service.mjs';
import { pageOutput } from './lib.mjs';
import { defaultCache } from './platform.mjs';

const options = Object.fromEntries(['url', 'scope', 'session', 'cache-dir', 'filter', 'cursor', 'limit', 'max-chars', 'depth'].map(n => [n, { type: 'string' }]));
const { positionals: [command, ...links], values: flags } = parseArgs({ options, allowPositionals: true });
const cacheDir = flags['cache-dir'] || defaultCache();

function browser(...args) {
  const raw = execFileSync('agent-browser', ['--session', flags.session || 'figma-local', ...args, '--json'], {
    encoding: 'utf8', timeout: 15000, maxBuffer: 4 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const result = JSON.parse(raw);
  if (!result.success) throw Error(result.error || 'Falha no navegador.');
  return result.data;
}
const evaluate = js => browser('eval', js).result;

try {
  if (command === 'files') {
    console.log(JSON.stringify(pageOutput(cachedFiles(cacheDir), { live: false, kind: 'files' }, { cursor: Number(flags.cursor || 0), limit: Number(flags.limit || 10), maxChars: Number(flags['max-chars'] || 6000) })));
  } else if (['capture', 'import'].includes(command)) {
    if (!flags.url) throw Error('Informe --url para verificar a origem da cópia.');
    const target = parseLink(flags.url), scope = flags.scope || 'node';
    if (!['node', 'selection', 'page'].includes(scope)) throw Error('Escopo: node, selection ou page.');
    if (scope === 'node' && !target.nodeId) throw Error('Um arquivo sem node-id exige escopo selection/page explícito.');
    const begin = performance.now();
    let browserUrl;
    if (command === 'capture') {
      browserUrl = evaluate('location.href');
      if (parseLink(browserUrl).fileKey !== target.fileKey) throw Error('O navegador está em outro arquivo. Abra o link solicitado primeiro.');
      if (scope === 'node') {
        const selected = evaluate('[...document.querySelectorAll("[data-fpl-selected-root=true]")].map(e=>e.querySelector("[data-testid$=\\"-layers-panel-row\\"]")?.dataset.testid)');
        if (selected.length !== 1 || selected[0] !== target.nodeId + '-layers-panel-row') throw Error('Selecione exatamente o nó do link antes de capturar.');
      }
      if (scope === 'page') {
        browser('focus', '[role="application"]');
        browser('press', process.platform === 'darwin' ? 'Meta+a' : 'Control+a');
        browserUrl = evaluate('location.href');
      }
      evaluate(`(async()=>{const e=[...document.querySelectorAll('[data-fpl-selected-root=true]')].find(x=>{const r=x.getBoundingClientRect();return r.height>0&&r.top>100&&r.bottom<innerHeight});if(!e)throw Error('Selecione as telas no painel de camadas e tente novamente.');const r=e.getBoundingClientRect();e.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,button:2,clientX:Math.max(60,r.x+100),clientY:r.y+r.height/2}));const deadline=performance.now()+2000;let copy;do{copy=[...document.querySelectorAll('[role=menuitem]')].find(x=>['Copiar','Copy'].includes(x.innerText.trim().split(/\\s/)[0]));if(copy)break;await new Promise(r=>setTimeout(r,30))}while(performance.now()<deadline);if(!copy||copy.getAttribute('aria-disabled')==='true')throw Error('Copiar indisponível. Verifique a permissão do arquivo.');copy.setAttribute('data-figma-reader-copy','true');return true})()`);
      browser('click', '[data-figma-reader-copy=true]');
    }
    const data = unpackClipboard(await clipboardHtml(), target.fileKey);
    const info = saveCapture(cacheDir, data, { scope, requestedUrl: target.url, browserUrl });
    console.log(JSON.stringify({ ...info, totalMs: Math.round(performance.now() - begin), live: false }));
  } else if (['index', 'summary', 'tree', 'node', 'components'].includes(command)) {
    const requested = [...links, ...(flags.url ? [flags.url] : [])];
    if (!requested.length) throw Error('Informe pelo menos um link Figma.');
    console.log(JSON.stringify(queryCached(cacheDir, { command, urls: requested, filter: flags.filter, cursor: flags.cursor, limit: flags.limit, maxChars: flags['max-chars'], depth: flags.depth })));
  } else {
    throw Error('Comandos: capture/import --url LINK [--scope node|selection|page]; index/summary/tree/node/components LINK... [--limit 10 --max-chars 6000].');
  }
} catch (error) {
  console.error(JSON.stringify({ error: error.message, retry: 'Corrija o escopo/origem; nenhuma tela foi inferida.' }));
  process.exitCode = 1;
}
