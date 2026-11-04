(() => {
  if (globalThis.__figmaLocalCaptureInstalled) return;
  globalThis.__figmaLocalCaptureInstalled = true;
  let overlay;
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const menuItem = names => [...document.querySelectorAll('[role=menuitem]')].find(e => names.includes(e.innerText.trim().split('\n')[0].trim()));
  async function waitFor(fn, timeout = 2500) { const end = Date.now() + timeout; do { const value = fn(); if (value) return value; await pause(30); } while (Date.now() < end); throw Error('A interface do Figma não respondeu. Use Copiar no Figma e Importar cópia manual no painel.'); }
  async function rpc(action, params) {
    const reply = await chrome.runtime.sendMessage({ action, params });
    if (!reply?.ok) throw Error(reply?.error || 'O leitor não respondeu.');
    return reply.result;
  }
  function selectionInfo(scope) {
    const selectedIds = [...document.querySelectorAll('[data-fpl-selected-root=true]')].map(e => e.querySelector('[data-testid$="-layers-panel-row"]')?.dataset.testid?.replace('-layers-panel-row', '')).filter(Boolean);
    const label = document.querySelector('[role=application]')?.getAttribute('aria-label') || document.querySelector('[role=main]')?.getAttribute('aria-label') || '';
    const match = label.match(/(\d+)\s+(?:itens?|items?)\s+(?:selecionad[oa]s?|selected)/i) || label.match(/(\d+)\s+(?:selected|selecionad[oa]s?)/i);
    const count = match ? Number(match[1]) : selectedIds.length;
    if (!count) throw Error('Selecione um frame ou seção no Figma antes de capturar.');
    return { url: location.href, title: document.title.replace(/\s*[–—-]\s*Figma$/, ''), scope,
      expectedCount: count, ...(selectedIds.length <= 100 ? { selectedIds } : {}) };
  }
  async function selectPage() {
    const main = document.querySelector('button[aria-label="Menu principal"],button[aria-label="Main menu"]');
    if (!main) throw Error('Não encontrei o menu do Figma. Selecione a página com ⌘A e use Capturar seleção.');
    main.click();
    const edit = await waitFor(() => menuItem(['Editar', 'Edit']));
    edit.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    edit.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
    edit.click();
    const all = await waitFor(() => menuItem(['Selecionar tudo', 'Select all']));
    all.click();
    await pause(150);
  }
  async function copySelection() {
    const row = [...document.querySelectorAll('[data-fpl-selected-root=true]')].find(e => {
      const r = e.getBoundingClientRect(); return r.height > 0 && r.top > 90 && r.bottom < innerHeight;
    });
    if (!row) throw Error('A seleção precisa aparecer no painel de camadas. Use Copiar no Figma e Importar cópia manual.');
    const rect = row.getBoundingClientRect();
    row.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, button: 2, clientX: rect.x + 100, clientY: rect.y + rect.height / 2 }));
    const copy = await waitFor(() => menuItem(['Copiar', 'Copy']));
    if (copy.getAttribute('aria-disabled') === 'true') throw Error('O arquivo não permite copiar esta seleção.');
    copy.click();
  }
  function arm(scope) {
    overlay?.remove();
    overlay = document.createElement('div'); overlay.dataset.figmaLocalOverlay = 'true';
    const shadow = overlay.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ':host{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:2147483647;font:13px system-ui;color:#172722}section{background:#fff;border:1px solid #c8d9d1;border-radius:16px;padding:14px 16px;box-shadow:0 8px 40px #102b2633;max-width:430px}p{margin:0 0 10px;line-height:1.45}button{font:600 13px system-ui;border:0;border-radius:8px;padding:9px 12px;background:#166b4f;color:white;cursor:pointer}button+button{background:#edf4f0;color:#294b3c;margin-left:8px}button:focus-visible{outline:3px solid #70b9a0;outline-offset:2px}button:disabled{opacity:.6}';
    const section = document.createElement('section'); section.setAttribute('role', 'region'); section.setAttribute('aria-label', 'Captura Figma Local');
    const message = document.createElement('p'); message.textContent = scope === 'page' ? 'Capturar todos os objetos da página atual. Confirme para continuar.' : 'Selecione os frames ou a seção desejada e confirme a captura.';
    const capture = document.createElement('button'); capture.textContent = scope === 'page' ? 'Confirmar captura da página' : 'Confirmar captura da seleção';
    const close = document.createElement('button'); close.textContent = 'Fechar'; close.onclick = () => overlay.remove();
    for (const event of ['pointerdown', 'mousedown', 'click', 'keydown']) overlay.addEventListener(event, e => e.stopPropagation());
    capture.addEventListener('click', async () => {
      capture.disabled = true; message.textContent = 'Preparando captura…';
      try {
        const ticket = await rpc('prepare_capture', { url: location.href, scope });
        if (scope === 'page') await selectPage();
        const context = selectionInfo(scope);
        await copySelection();
        message.textContent = 'Organizando as telas no leitor local…';
        const result = await rpc('import_clipboard', { ...context, token: ticket.token });
        message.textContent = `Captura pronta: ${result.frameCandidates} frames candidatos. Volte ao painel Figma Local.`;
        capture.remove();
      } catch (error) { message.textContent = error.message; capture.disabled = false; }
    });
    section.append(message, capture, close); shadow.append(style, section); document.documentElement.append(overlay);
  }
  chrome.runtime.onMessage.addListener((message, _sender, reply) => {
    if (message?.kind !== 'arm-capture') return;
    arm(message.scope); reply({ ok: true });
  });
})();
