const HOST = 'com.figmalocal.reader';
let port, serial = 0;
const pending = new Map();
const isFigma = value => { try { const u = new URL(value); return u.protocol === 'https:' && ['figma.com', 'www.figma.com'].includes(u.hostname) && /^\/(design|file)\//.test(u.pathname); } catch { return false; } };
const fileKey = value => { const parts = new URL(value).pathname.split('/').filter(Boolean); return parts[2] === 'branch' && parts[3] ? parts[3] : parts[1]; };

function native(method, params = {}) {
  if (!port) {
    port = chrome.runtime.connectNative(HOST);
    port.onMessage.addListener(message => {
      const task = pending.get(message.id); if (!task) return;
      clearTimeout(task.timer); pending.delete(message.id);
      if (message.ok) task.resolve(message.result); else task.reject(Error(message.error || 'Falha no leitor.'));
    });
    port.onDisconnect.addListener(() => {
      const detail = chrome.runtime.lastError?.message || '';
      port = null;
      for (const task of pending.values()) { clearTimeout(task.timer); task.reject(Error('Leitor desconectado. Conclua a instalação e reconecte. ' + detail)); }
      pending.clear();
    });
  }
  return new Promise((resolve, reject) => {
    const id = ++serial;
    const timer = setTimeout(() => { pending.delete(id); reject(Error('O leitor demorou para responder. Tente novamente.')); }, 45000);
    pending.set(id, { resolve, reject, timer });
    try { port.postMessage({ id, method, params }); } catch (error) { clearTimeout(timer); pending.delete(id); reject(error); }
  });
}

async function figmaTab() {
  const tabs = (await chrome.tabs.query({ url: ['https://www.figma.com/*', 'https://figma.com/*'] })).filter(t => isFigma(t.url));
  const tab = tabs.find(t => t.active) || tabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
  if (!tab) throw Error('Abra um arquivo Figma Design no Chrome.');
  return tab;
}
async function dispatch(message, sender) {
  if (sender.id !== chrome.runtime.id) throw Error('Origem inválida.');
  const ownPage = sender.url?.startsWith(chrome.runtime.getURL(''));
  if (!ownPage) {
    if (!isFigma(sender.url) || !['prepare_capture', 'import_clipboard'].includes(message.action)) throw Error('Pedido inválido.');
    if (!isFigma(message.params?.url) || fileKey(sender.url) !== fileKey(message.params.url)) throw Error('O arquivo mudou durante a captura.');
    if (message.params?.manual) throw Error('Importação manual requer o painel da extensão.');
    const result = await native(message.action, message.params);
    if (message.action === 'import_clipboard') {
      await chrome.storage.session.set({ lastCapture: result });
      chrome.runtime.sendMessage({ kind: 'capture-complete', info: result }).catch(() => {});
    }
    return result;
  }
  if (['ping', 'files', 'query'].includes(message.action)) return native(message.action, message.params);
  if (message.action === 'context') { const tab = await figmaTab(); return { url: tab.url, title: tab.title }; }
  if (message.action === 'arm_capture') {
    if (!['selection', 'page'].includes(message.params?.scope)) throw Error('Escopo inválido.');
    await native('ping');
    const tab = await figmaTab();
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['capture.js'] });
    await chrome.tabs.sendMessage(tab.id, { kind: 'arm-capture', scope: message.params.scope });
    return { armed: true, url: tab.url };
  }
  if (message.action === 'import_manual') return native('import_clipboard', { ...message.params, scope: 'selection', manual: true });
  throw Error('Ação inválida.');
}

chrome.runtime.onInstalled.addListener(() => chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }));
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.action) return;
  dispatch(message, sender).then(result => sendResponse({ ok: true, result }), error => sendResponse({ ok: false, error: error.message }));
  return true;
});
