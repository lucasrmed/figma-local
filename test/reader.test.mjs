import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLink, unpackClipboard, pageOutput, scopedCatalog, selectCapture } from '../lib.mjs';

test('links de arquivo não ganham node-id e links percent-encoded mantêm o alvo', () => {
  assert.equal(parseLink('https://www.figma.com/design/ABC123/name').nodeId, null);
  assert.equal(parseLink('https://www.figma.com/design/ABC123/branch').fileKey, 'ABC123');
  assert.equal(parseLink('https://www.figma.com/design/ABC123/name?node-id=12%3A345&t=tracking').nodeId, '12:345');
  assert.equal(parseLink('https://www.figma.com/design/ABC123/name?node-id=12-345').nodeId, '12:345');
  assert.equal(parseLink('https://www.figma.com/proto/ABC123/name?starting-point-node-id=1-2').nodeId, '1:2');
  assert.equal(parseLink('https://www.figma.com/design/ABC123/branch/BRANCH1/name?node-id=1-2').fileKey, 'BRANCH1');
  assert.equal(parseLink('https://www.figma.com/design/ABC123/name?node-id=I1%3A2%3B3%3A4').nodeId, 'I1:2;3:4');
  assert.throws(() => parseLink('https://figma.com.evil.example/design/ABC123/name'));
});

test('cópia com marcadores escapados é reconhecida, arquivo incorreto é rejeitado', () => {
  const meta = Buffer.from(JSON.stringify({ fileKey: 'ABC123' })).toString('base64');
  const html = `data-metadata="&lt;!--(figmeta)${meta}(/figmeta)--&gt;" data-buffer="&lt;!--(figma)YWJj(/figma)--&gt;"`;
  assert.equal(unpackClipboard(html, 'ABC123').buffer.toString(), 'abc');
  assert.throws(() => unpackClipboard(html, 'OTHERFILE'), /outro arquivo/);
  assert.throws(() => unpackClipboard('<p>not figma</p>', 'ABC123'));
});

test('saída limitada continua sendo JSON válido e preserva paginação', () => {
  const items = Array.from({ length: 40 }, (_, i) => ({ id: String(i), name: 'tela '.repeat(30), url: `https://www.figma.com/design/ABC123/?node-id=${i}-1` }));
  const first = pageOutput(items, { live: false }, { maxChars: 1100 });
  assert.ok(JSON.stringify(first).length + 1 <= 1100);
  assert.ok(first.next > 0 && first.next < items.length);
  const second = pageOutput(items, { live: false }, { cursor: first.next, maxChars: 1100 });
  assert.notEqual(first.items[0].id, second.items[0].id);
  const huge = pageOutput([{ id: '1', text: 'x'.repeat(30000) }], {}, { maxChars: 1000 });
  assert.equal(huge.items[0].detail_omitted, true);
});

test('um frame não inclui irmãos, página requer origem conhecida e cache preserva outras páginas', () => {
  const frame1 = { id: '1:1', name: 'Mesmo nome' }, frame2 = { id: '1:2', name: 'Mesmo nome' };
  const first = { info: { scope: 'page', browserUrl: 'https://www.figma.com/design/ABC123/?node-id=0-10' }, ids: ['1:1', '1:2'], frames: [frame1, frame2] };
  const second = { info: { scope: 'page', browserUrl: 'https://www.figma.com/design/ABC123/?node-id=0-20' }, ids: ['2:1'], frames: [{ id: '2:1' }] };
  assert.deepEqual(scopedCatalog(first, { nodeId: '1:1' }), [frame1]);
  assert.deepEqual(scopedCatalog({ ...first, info: { scope: 'page', browserUrl: 'https://www.figma.com/design/ABC123/?node-id=1-1' } }, { nodeId: '1:1' }), [frame1]);
  assert.equal(scopedCatalog(first, { nodeId: '0:10' }).length, 2);
  assert.equal(selectCapture([second, first], { nodeId: '1:2' }), first);
  assert.throws(() => selectCapture([second, first], { nodeId: '99:99' }));
});
