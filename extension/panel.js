const $ = id => document.getElementById(id);
let files = [], current, next = null, generation = 0;
const selected = new Map();
async function rpc(action, params) { const response = await chrome.runtime.sendMessage({ action, params }); if (!response?.ok) throw Error(response?.error || 'O leitor não respondeu.'); return response.result; }
function status(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
function selectionChanged() { const n = selected.size; $('selected-count').textContent = `${n} selecionada${n === 1 ? '' : 's'}`; $('copy-request').disabled = $('preview').disabled = !n; }
function busy(value) { for (const id of ['capture-selection', 'capture-page', 'import-manual']) $(id).disabled = value; }
function renderFrame(frame) {
  const row = document.createElement('div'); row.className = 'frame';
  const check = document.createElement('input'); check.type = 'checkbox'; check.checked = selected.has(frame.url); check.id = 'frame-' + crypto.randomUUID();
  const label = document.createElement('label'); label.htmlFor = check.id; label.textContent = frame.name || 'Frame sem nome';
  const small = document.createElement('small'); small.textContent = [frame.size?.map(Math.round).join(' × '), frame.section, frame.id].filter(Boolean).join(' · '); label.append(small);
  const open = document.createElement('a'); open.href = frame.url; open.textContent = 'Abrir ↗'; open.target = '_blank'; open.rel = 'noopener'; open.setAttribute('aria-label', `Abrir ${frame.name}`);
  check.addEventListener('change', () => { if (check.checked) { if (selected.size >= 50) { check.checked = false; status('Escolha até 50 telas por pedido.', true); return; } selected.set(frame.url, frame); } else selected.delete(frame.url); selectionChanged(); });
  row.append(check, label, open); $('frames').append(row);
}
async function loadIndex(append = false) {
  const myGeneration = ++generation;
  if (!current) { $('frames').replaceChildren(); $('count').textContent = '0 frames'; return; }
  const result = await rpc('query', { command: 'index', urls: [current.url], snapshotDigest: current.digest, filter: $('search').value, limit: 20, maxChars: 12000, cursor: append ? next : 0 });
  if (myGeneration !== generation) return;
  if (!append) $('frames').replaceChildren();
  result.items.forEach(renderFrame); next = result.next;
  $('count').textContent = `${result.total} frames candidatos`; $('more').hidden = next === null;
  if (!result.items.length && !append) { const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'Nenhuma tela encontrada nesta captura.'; $('frames').append(empty); }
}
async function loadFiles(preferredKey) {
  files = (await rpc('files')).files; const wanted = preferredKey || current?.fileKey;
  $('files').replaceChildren();
  for (const f of files) { const o = document.createElement('option'); o.value = f.fileKey; o.textContent = `${f.title} · ${f.frameCandidates} frames`; $('files').append(o); }
  current = files.find(f => f.fileKey === wanted) || files[0];
  if (current) { $('files').value = current.fileKey; $('capture-info').textContent = 'Capturada em ' + new Date(current.capturedAt).toLocaleString('pt-BR') + ' · Consulta local'; }
  else { const o = document.createElement('option'); o.textContent = 'Nenhuma captura'; o.value = ''; $('files').append(o); $('capture-info').textContent = 'Capture uma seleção para começar.'; }
  await loadIndex();
}
async function connect() {
  try { const result = await rpc('ping'); $('connection').textContent = 'Leitor conectado'; $('connection').classList.remove('off'); status(result.captureSupported ? 'Pronto para capturar ou consultar.' : 'Consultas disponíveis; a captura está disponível no Mac e Windows.'); await loadFiles(); }
  catch (error) { $('connection').textContent = 'Desconectado'; $('connection').classList.add('off'); status(error.message, true); }
  try { $('source-url').value = (await rpc('context')).url; } catch {}
}
for (const [id, scope] of [['capture-selection', 'selection'], ['capture-page', 'page']]) $(id).addEventListener('click', async () => {
  busy(true);
  try { const result = await rpc('arm_capture', { scope }); $('source-url').value = result.url; status('Confirme a captura no botão que apareceu dentro do Figma.'); }
  catch (error) { status(error.message, true); }
  finally { busy(false); }
});
$('import-manual').addEventListener('click', async () => { busy(true); status('Importando a cópia…'); try { const result = await rpc('import_manual', { url: $('source-url').value, title: 'Arquivo Figma' }); status(`Captura pronta: ${result.frameCandidates} frames candidatos.`); await loadFiles(result.fileKey); } catch (error) { status(error.message, true); } finally { busy(false); } });
$('files').addEventListener('change', async () => { current = files.find(f => f.fileKey === $('files').value); $('capture-info').textContent = current ? 'Capturada em ' + new Date(current.capturedAt).toLocaleString('pt-BR') : ''; try { await loadIndex(); } catch (error) { status(error.message, true); } });
let searchTimer; $('search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => loadIndex().catch(e => status(e.message, true)), 180); });
$('more').onclick = () => loadIndex(true).catch(e => status(e.message, true));
$('refresh').onclick = () => loadFiles().catch(e => status(e.message, true));
$('reconnect').onclick = connect;
$('clear').onclick = () => { selected.clear(); document.querySelectorAll('.frame input').forEach(e => { e.checked = false; }); selectionChanged(); };
$('copy-request').addEventListener('click', async () => {
  const prompt = 'Use $figma-local para consultar estas telas nas capturas locais. Comece pelos resumos e abra detalhes só quando necessário. Informe se faltar conteúdo ou se a captura precisar ser atualizada.\n\n' + [...selected.keys()].map(url => '- ' + url).join('\n');
  try { await navigator.clipboard.writeText(prompt); status('Pedido copiado. Cole no Codex com a skill Figma Local instalada.'); } catch { status('Não consegui copiar. Tente novamente com o painel em foco.', true); }
});
$('preview').addEventListener('click', async () => { status('Consultando as telas selecionadas…'); try { const result = await rpc('query', { command: 'summary', urls: [...selected.keys()], limit: 10, maxChars: 6000 }); $('preview-output').textContent = JSON.stringify(result, null, 2); $('preview-details').hidden = false; $('preview-details').open = true; status(result.next === null ? 'Resumo pronto. Detalhes de bibliotecas podem estar parciais.' : 'Resumo parcial pelo limite de contexto; a skill pode continuar a consulta.'); } catch (error) { status(error.message, true); } });
chrome.runtime.onMessage.addListener(message => { if (message?.kind === 'capture-complete') { status(`Captura pronta: ${message.info.frameCandidates} frames candidatos.`); loadFiles(message.info.fileKey).catch(e => status(e.message, true)); } });
connect();
