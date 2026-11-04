import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { clipboardFixture } from './fixture.mjs';
import { createService } from '../native/api.mjs';
import { encodeMessage, serveNative } from '../native/protocol.mjs';

test('captura nativa verifica arquivo, seleção, nova cópia e ticket de uso único', async t => {
  const cacheDir = mkdtempSync(join(tmpdir(), 'figma-local-test-'));
  t.after(() => rmSync(cacheDir, { recursive: true, force: true }));
  let counter = 1, html = clipboardFixture().html;
  const handle = createService({ cacheDir, platform: 'darwin', readClipboard: () => html, changeCount: () => counter });
  const params = { url: 'https://www.figma.com/design/TESTFILE/?node-id=1-1', scope: 'selection', expectedCount: 1, selectedIds: ['1:1'] };
  const ticket = await handle('prepare_capture', params);
  setTimeout(() => { counter++; }, 30);
  const captured = await handle('import_clipboard', { ...params, token: ticket.token });
  assert.equal(captured.frameCandidates, 2);
  assert.equal(captured.live, false);
  await assert.rejects(handle('import_clipboard', { ...params, token: ticket.token }), /expirou/);
  const index = await handle('query', { command: 'index', urls: [params.url] });
  assert.equal(index.items.length, 2);
  assert.notEqual(index.items[0].id, index.items[1].id);
  const single = await handle('query', { command: 'summary', urls: ['https://www.figma.com/design/TESTFILE/?node-id=1-2'] });
  assert.deepEqual(single.items[0].text, ['Olá, ação ✓']);
  await assert.rejects(handle('import_clipboard', { ...params, manual: true, expectedCount: 2 }), /não corresponde/);
  await assert.rejects(handle('import_clipboard', { ...params, manual: true, selectedIds: ['9:9'] }), /não correspondem/);
  await assert.rejects(handle('import_clipboard', { ...params, manual: true, scope: 'node', url: 'https://www.figma.com/design/TESTFILE/?node-id=1-2' }), /node-id/);
  html = clipboardFixture('OTHERFILE').html;
  await assert.rejects(handle('import_clipboard', { ...params, manual: true }), /outro arquivo/);
  assert.deepEqual(readdirSync(cacheDir), ['TESTFILE']);
  const another = await handle('prepare_capture', params); counter++;
  await assert.rejects(handle('import_clipboard', { ...params, token: another.token, scope: 'page' }), /escopo mudou/);
  await assert.rejects(handle('query', { urls: ['https://example.com/'] }));
});

test('protocolo aceita pacotes fragmentados, preserva UTF-8 e isola erros', async () => {
  const input = new PassThrough(), output = new PassThrough(), chunks = [];
  output.on('data', chunk => chunks.push(chunk));
  const done = serveNative(async (method, params) => { if (method === 'fail') throw Error('Falha esperada'); return params; }, input, output);
  const encoded = Buffer.concat([encodeMessage({ id: 1, method: 'query', params: { text: 'ação ✓' } }), encodeMessage({ id: 2, method: 'fail' }), encodeMessage({ id: 3, method: 'ping', params: {} })]);
  input.write(encoded.subarray(0, 2)); input.write(encoded.subarray(2, 9)); input.write(encoded.subarray(9));
  await done();
  const bytes = Buffer.concat(chunks), results = []; let offset = 0;
  while (offset < bytes.length) { const size = bytes.readUInt32LE(offset); results.push(JSON.parse(bytes.subarray(offset + 4, offset + 4 + size).toString('utf8'))); offset += size + 4; }
  assert.equal(results[0].result.text, 'ação ✓'); assert.equal(results[1].ok, false); assert.equal(results[2].ok, true);
  assert.throws(() => encodeMessage({ data: 'x'.repeat(1024 * 1024) }), /limite/);
  const invalid = new PassThrough(); serveNative(() => ({}), invalid, new PassThrough());
  const huge = Buffer.alloc(4); huge.writeUInt32LE(300000); invalid.write(huge); assert.equal(invalid.destroyed, true);
});
