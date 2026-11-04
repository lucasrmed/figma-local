import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLink, nodeUrl, loadCapture, snapshotsOf, selectCapture, scopedCatalog, isCapturedPage, query, pageOutput } from './lib.mjs';

export function queryCached(cacheDir, params) {
  const command = params.command || 'index';
  if (!['index', 'summary', 'tree', 'node', 'components'].includes(command)) throw Error('Consulta não suportada.');
  if (!Array.isArray(params.urls) || !params.urls.length || params.urls.length > 50 || params.urls.some(u => typeof u !== 'string' || u.length > 4096)) throw Error('Informe de 1 a 50 links Figma.');
  const targets = [...new Map(params.urls.map(u => { const t = parseLink(u); return [t.fileKey + ':' + t.nodeId, t]; })).values()];
  const captures = new Map(), files = new Map(), items = [], sources = new Map();
  for (const target of targets) {
    if (!files.has(target.fileKey)) files.set(target.fileKey, snapshotsOf(cacheDir, target.fileKey));
    let all = files.get(target.fileKey);
    if (params.snapshotDigest) {
      if (!/^[a-f0-9]{64}$/.test(params.snapshotDigest)) throw Error('Captura inválida.');
      all = all.filter(s => s.info.digest === params.snapshotDigest);
    }
    const snapshot = selectCapture(all, target);
    const addSource = s => sources.set(s.info.digest, { fileKey: target.fileKey, capturedAt: s.info.capturedAt, scope: s.info.scope, digest: s.info.digest.slice(0, 12) });
    const getScene = () => {
      if (!captures.has(snapshot.info.digest)) captures.set(snapshot.info.digest, loadCapture(cacheDir, target.fileKey, snapshot));
      return captures.get(snapshot.info.digest).scene;
    };
    addSource(snapshot);
    if (command === 'index') {
      const light = isCapturedPage(snapshot, target) || snapshot.frames.some(n => n.id === target.nodeId);
      const candidates = target.nodeId ? scopedCatalog(snapshot, target, light ? null : getScene())
        : [...new Map(all.flatMap(s => { addSource(s); return s.frames; }).reverse().map(n => [n.id, n])).values()];
      const filter = String(params.filter || '').toLocaleLowerCase();
      items.push(...candidates.filter(n => !filter || n.name.toLocaleLowerCase().includes(filter)));
    } else {
      const depth = Number(params.depth ?? 2);
      if (!Number.isInteger(depth) || depth < 0 || depth > 8) throw Error('Profundidade entre 0 e 8.');
      if (isCapturedPage(snapshot, target)) throw Error('O link identifica uma página. Use o índice e escolha os frames.');
      const result = command === 'summary' && snapshot.summaries[target.nodeId] ? snapshot.summaries[target.nodeId] : query(getScene(), target, command, depth);
      items.push({ ...result, url: nodeUrl(target.fileKey, target.nodeId) });
    }
  }
  const unique = [...new Map(items.map(x => [(x.url || '') + ':' + (x.id || x.node_id), x])).values()];
  return pageOutput(unique, { sources: [...sources.values()], live: false, kind: command,
    ...(command === 'index' ? { note: 'Frames candidatos; podem incluir anotações e componentes.' } : {}) }, {
    cursor: Number(params.cursor ?? 0), limit: Number(params.limit ?? 10), maxChars: Number(params.maxChars ?? 6000),
  });
}

export function cachedFiles(cacheDir) {
  let names;
  try { names = readdirSync(cacheDir); } catch { return []; }
  return names.filter(n => /^[a-zA-Z0-9]+$/.test(n)).flatMap(fileKey => {
    try {
      const info = JSON.parse(readFileSync(join(cacheDir, fileKey, 'latest.json'), 'utf8'));
      if (info.fileKey !== fileKey) return [];
      return [{ fileKey, title: info.title || 'Arquivo Figma', capturedAt: info.capturedAt,
        frameCandidates: info.frameCandidates, scope: info.scope, digest: info.digest,
        url: `https://www.figma.com/design/${fileKey}/` }];
    } catch { return []; }
  }).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)).slice(0, 100);
}
