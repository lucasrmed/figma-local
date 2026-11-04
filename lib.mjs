import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseFigBuffer } from './vendor/figma-clipboard/figparse.js';
import { buildScene, key, listFrames, nodeStyles, layerTree, componentTree } from './vendor/figma-clipboard/scene.js';

export function parseLink(input) {
  const u = new URL(input);
  if (u.protocol !== 'https:' || !['figma.com', 'www.figma.com'].includes(u.hostname)) {
    throw Error('Use um link HTTPS do Figma.');
  }
  const p = u.pathname.split('/').filter(Boolean);
  if (!['design', 'file', 'proto'].includes(p[0]) || !/^[a-zA-Z0-9]+$/.test(p[1] || '')) {
    throw Error('Este leitor atende arquivos Figma Design e links de protótipo.');
  }
  const branch = p[2] === 'branch' && p[3] ? 2 : -1;
  const fileKey = branch >= 0 ? p[branch + 1] : p[1];
  if (!/^[a-zA-Z0-9]+$/.test(fileKey || '')) throw Error('Chave de arquivo inválida.');
  const raw = u.searchParams.get('node-id') || (p[0] === 'proto' ? u.searchParams.get('starting-point-node-id') : null);
  const nodeId = raw && /^\d+[-:]\d+$/.test(raw) ? raw.replace('-', ':') : raw;
  return { fileKey, nodeId, kind: p[0], url: u.href };
}

export const nodeUrl = (fileKey, nodeId) => `https://www.figma.com/design/${fileKey}/?node-id=${encodeURIComponent(nodeId.replace(':', '-'))}`;

export function unpackClipboard(html, expectedFileKey) {
  // Chrome escapes the comment delimiters inside data-* attributes. Match only their payload.
  const payload = marker => html.match(new RegExp(`\\(${marker}\\)([A-Za-z0-9+/=\\s]+)\\(/${marker}\\)`))?.[1];
  const meta64 = payload('figmeta'), data64 = payload('figma');
  if (!meta64 || !data64) throw Error('A cópia não contém dados Figma compatíveis. Use Copiar no Figma e tente novamente.');
  const meta = JSON.parse(Buffer.from(meta64, 'base64').toString('utf8'));
  if (meta.fileKey !== expectedFileKey) throw Error('A cópia pertence a outro arquivo. Nada foi importado.');
  return { meta, buffer: Buffer.from(data64, 'base64') };
}

export function clipboardHtml() {
  if (process.platform !== 'darwin') throw Error('A captura da área de transferência foi validada apenas no macOS.');
  const raw = execFileSync('osascript', ['-e', 'the clipboard as «class HTML»'], {
    encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: 10000,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  return Buffer.from(raw.replace(/^«data \w{4}/, '').replace(/»$/, ''), 'hex').toString('utf8');
}

export function sceneOf(buffer, meta) {
  return buildScene({ ...parseFigBuffer(buffer), meta, source: 'authorized Figma clipboard selection' });
}

export function catalog(scene, fileKey) {
  const items = [];
  function visit(n, sections = []) {
    if (n.type === 'CANVAS' && n.name === 'Internal Only Canvas') return;
    if (['DOCUMENT', 'CANVAS', 'SECTION'].includes(n.type)) {
      const path = n.type === 'SECTION' ? [...sections, n.name] : sections;
      for (const child of scene.children.get(key(n.guid)) || []) visit(child, path);
    } else if (n.type === 'FRAME') {
      items.push({ id: key(n.guid), name: n.name, size: n.size ? [n.size.x, n.size.y] : undefined,
        section: sections.length ? sections.join(' / ') : undefined, url: nodeUrl(fileKey, key(n.guid)) });
    }
  }
  for (const n of scene.roots) visit(n);
  return items;
}

function descendants(scene, id) {
  const found = [], visited = new Set();
  function walk(current) {
    if (visited.has(current)) return;
    visited.add(current);
    const n = scene.nodes.get(current);
    if (!n) throw Error('Nó ausente nesta captura. Copie o escopo correspondente; o leitor não amplia o pedido automaticamente.');
    found.push(n);
    for (const child of scene.children.get(current) || []) walk(key(child.guid));
  }
  walk(id);
  return found;
}

export function overview(scene, fileKey, id) {
  const nodes = descendants(scene, id), root = nodes[0];
  if (['DOCUMENT', 'CANVAS'].includes(root.type)) throw Error('Para uma página, consulte o índice e selecione os frames.');
  if (root.type === 'SECTION') {
    return { id, name: root.name, type: root.type, url: nodeUrl(fileKey, id),
      frames: nodes.filter(n => n.type === 'FRAME' && scene.nodes.get(key(n.parentIndex?.guid))?.type === 'SECTION')
        .map(n => ({ id: key(n.guid), name: n.name })) };
  }
  const text = [], instanceCounts = {}, instanceText = [], visible = new Set();
  for (const n of nodes) {
    if (n.visible === false || (key(n.guid) !== id && !visible.has(key(n.parentIndex?.guid)))) continue;
    visible.add(key(n.guid));
    if (n.textData?.characters) text.push(n.textData.characters);
    if (n.type !== 'INSTANCE') continue;
    const textValues = (n.componentPropAssignments || []).flatMap(a => {
      const value = a.value?.textValue?.characters;
      return value ? [value] : [];
    });
    instanceCounts[n.name] = (instanceCounts[n.name] || 0) + 1;
    instanceText.push(...textValues);
  }
  return { id, name: root.name, type: root.type, url: nodeUrl(fileKey, id),
    size: root.size ? [root.size.x, root.size.y] : undefined,
    local_nodes: nodes.length, text: [...new Set(text)],
    instance_text_values: [...new Set(instanceText)], instance_counts: instanceCounts,
    remote_interiors_materialized: false };
}

export function query(scene, target, mode, depth = 2) {
  if (!target.nodeId) throw Error('Para detalhes, informe um link com node-id. Um link de arquivo fornece apenas o índice.');
  if (!scene.nodes.has(target.nodeId)) throw Error('Este node-id não está na captura. Não foi inferida outra tela.');
  if (mode === 'node') return nodeStyles(scene, target.nodeId);
  if (mode === 'tree') return layerTree(scene, target.nodeId, depth, 'layout');
  if (mode === 'components') return componentTree(scene, target.nodeId, depth);
  return overview(scene, target.fileKey, target.nodeId);
}

export function pageOutput(items, context, { cursor = 0, limit = 10, maxChars = 6000 } = {}) {
  if (!Number.isSafeInteger(cursor) || cursor < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw Error('Cursor/limite inválido.');
  if (!Number.isSafeInteger(maxChars) || maxChars < 700 || maxChars > 20000) throw Error('Use um limite de saída entre 700 e 20000 caracteres.');
  const out = { ...context, total: items.length, items: [], next: null };
  let i = cursor;
  for (; i < items.length && out.items.length < limit; i++) {
    const candidate = { ...out, items: [...out.items, items[i]], next: i + 1 < items.length ? i + 1 : null };
    if (JSON.stringify(candidate).length + 1 > maxChars) {
      if (!out.items.length) {
        out.items.push({ id: items[i].id, url: items[i].url, detail_omitted: true,
          reason: 'Item excede o limite. Consulte um bloco/nó específico ou aumente max-chars.' });
        i++;
      }
      break;
    }
    out.items.push(items[i]);
  }
  out.next = i < items.length ? i : null;
  if (JSON.stringify(out).length + 1 > maxChars) throw Error('Metadados excedem o limite de saída.');
  return out;
}

export function saveCapture(cacheDir, data, provenance, validate = () => {}) {
  const started = performance.now(), scene = sceneOf(data.buffer, data.meta);
  const roots = listFrames(scene);
  validate(scene, roots);
  if (provenance.scope === 'node') {
    const target = parseLink(provenance.requestedUrl);
    if (roots.length !== 1 || roots[0].node_id !== target.nodeId) {
      throw Error('A cópia não corresponde somente ao node-id pedido. Use escopo selection/page explicitamente para um lote.');
    }
  }
  const digest = createHash('sha256').update(data.buffer).digest('hex');
  const dir = join(cacheDir, data.meta.fileKey);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  let previous;
  try { previous = JSON.parse(readFileSync(join(dir, digest + '.json'), 'utf8')).info; } catch {}
  writeFileSync(join(dir, digest + '.figbin'), data.buffer, { mode: 0o600 });
  const info = { fileKey: data.meta.fileKey, digest, capturedAt: new Date().toISOString(),
    ...provenance, browserUrl: provenance.browserUrl || previous?.browserUrl,
    copiedRoots: roots.length, records: scene.nodes.size, frameCandidates: catalog(scene, data.meta.fileKey).length,
    decodeMs: Math.round(performance.now() - started), format: 'experimental-fig-kiwi' };
  const frames = catalog(scene, data.meta.fileKey);
  const snapshot = { info, ids: [...scene.nodes.keys()], frames,
    summaries: Object.fromEntries(frames.map(frame => [frame.id, overview(scene, data.meta.fileKey, frame.id)])) };
  writeFileSync(join(dir, digest + '.json.tmp'), JSON.stringify(snapshot), { mode: 0o600 });
  renameSync(join(dir, digest + '.json.tmp'), join(dir, digest + '.json'));
  writeFileSync(join(dir, 'latest.json.tmp'), JSON.stringify(info), { mode: 0o600 });
  renameSync(join(dir, 'latest.json.tmp'), join(dir, 'latest.json'));
  return info;
}

export function snapshotsOf(cacheDir, fileKey) {
  let snapshots;
  try {
    snapshots = readdirSync(join(cacheDir, fileKey)).filter(n => /^[a-f0-9]{64}\.json$/.test(n))
      .map(n => JSON.parse(readFileSync(join(cacheDir, fileKey, n), 'utf8')))
      .sort((a, b) => b.info.capturedAt.localeCompare(a.info.capturedAt));
  }
  catch { throw Error('Ainda não há captura local deste arquivo. Faça capture/import primeiro.'); }
  if (!snapshots.length) throw Error('Não há capturas indexadas deste arquivo. Importe novamente.');
  return snapshots;
}

export function isCapturedPage(snapshot, target) {
  return snapshot.info.scope === 'page' && snapshot.info.browserUrl &&
    !snapshot.ids.includes(target.nodeId) &&
    parseLink(snapshot.info.browserUrl).nodeId === target.nodeId;
}

export function selectCapture(snapshots, target) {
  const snapshot = snapshots.find(s => !target.nodeId || s.ids.includes(target.nodeId) || isCapturedPage(s, target));
  if (!snapshot) throw Error('Este node-id não está nas capturas. Copie a página/seção correspondente; o escopo não foi ampliado.');
  return snapshot;
}

export function scopedCatalog(snapshot, target, scene) {
  if (!target.nodeId || isCapturedPage(snapshot, target)) return snapshot.frames;
  const cachedFrame = snapshot.frames.find(n => n.id === target.nodeId);
  if (cachedFrame) return [cachedFrame];
  const node = scene.nodes.get(target.nodeId);
  if (!node) throw Error('Nó ausente na captura.');
  if (!['FRAME', 'SECTION'].includes(node.type)) throw Error('O link aponta para ' + node.type + '. Consulte esse nó ou peça o link do frame/seção.');
  return catalog({ ...scene, roots: [node] }, target.fileKey);
}

export function loadCapture(cacheDir, fileKey, snapshot) {
  const info = snapshot ? snapshot.info : snapshotsOf(cacheDir, fileKey)[0].info;
  if (info.fileKey !== fileKey || !/^[a-f0-9]{64}$/.test(info.digest)) throw Error('Cache inválido. Faça uma nova captura.');
  const buffer = readFileSync(join(cacheDir, fileKey, info.digest + '.figbin'));
  if (createHash('sha256').update(buffer).digest('hex') !== info.digest) throw Error('Captura corrompida. Importe novamente.');
  return { info, scene: sceneOf(buffer, { fileKey }) };
}
