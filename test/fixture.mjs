import { parseSchema, compileSchema, encodeBinarySchema } from 'kiwi-schema';
import { deflateRawSync } from 'node:zlib';

export function clipboardFixture(fileKey = 'TESTFILE') {
  const schema = parseSchema(`
    struct GUID { uint sessionID; uint localID; }
    struct Vector { float x; float y; }
    enum NodeType { DOCUMENT = 0; CANVAS = 1; FRAME = 2; TEXT = 3; SECTION = 4; }
    message ParentIndex { GUID guid = 1; string position = 2; }
    message TextData { string characters = 1; }
    message NodeChange { GUID guid = 1; NodeType type = 2; string name = 3; ParentIndex parentIndex = 4; Vector size = 5; TextData textData = 6; bool visible = 7; }
    message Message { NodeChange[] nodeChanges = 1; }
  `);
  const guid = n => ({ sessionID: 1, localID: n });
  const nodes = [
    { guid: guid(1), type: 'SECTION', name: 'Fluxo de exemplo' },
    { guid: guid(2), type: 'FRAME', name: 'Mesmo nome', parentIndex: { guid: guid(1), position: 'a' }, size: { x: 1440, y: 900 } },
    { guid: guid(3), type: 'TEXT', name: 'Título', parentIndex: { guid: guid(2), position: 'a' }, textData: { characters: 'Olá, ação ✓' } },
    { guid: guid(4), type: 'FRAME', name: 'Mesmo nome', parentIndex: { guid: guid(1), position: 'b' }, size: { x: 390, y: 844 } },
  ];
  const header = Buffer.alloc(12); header.write('fig-kiwi'); header.writeUInt32LE(106, 8);
  const blocks = [encodeBinarySchema(schema), compileSchema(schema).encodeMessage({ nodeChanges: nodes })].flatMap(raw => {
    const body = deflateRawSync(raw), size = Buffer.alloc(4); size.writeUInt32LE(body.length); return [size, body];
  });
  const buffer = Buffer.concat([header, ...blocks]);
  const meta = { fileKey };
  const html = `data-metadata="&lt;!--(figmeta)${Buffer.from(JSON.stringify(meta)).toString('base64')}(/figmeta)--&gt;" data-buffer="&lt;!--(figma)${buffer.toString('base64')}(/figma)--&gt;"`;
  return { html, buffer, meta };
}
