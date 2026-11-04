export function encodeMessage(value) {
  const body = Buffer.from(JSON.stringify(value), 'utf8');
  if (body.length > 1024 * 1024) throw Error('Resposta excede o limite do Chrome.');
  const header = Buffer.alloc(4); header.writeUInt32LE(body.length);
  return Buffer.concat([header, body]);
}

export function serveNative(handle, input = process.stdin, output = process.stdout) {
  let buffered = Buffer.alloc(0), queue = Promise.resolve();
  input.on('data', chunk => {
    buffered = Buffer.concat([buffered, chunk]);
    while (buffered.length >= 4) {
      const size = buffered.readUInt32LE(0);
      if (size < 2 || size > 256 * 1024) { input.destroy(); return; }
      if (buffered.length < size + 4) break;
      const body = buffered.subarray(4, size + 4); buffered = buffered.subarray(size + 4);
      queue = queue.then(async () => {
        let request;
        try {
          request = JSON.parse(body.toString('utf8'));
          if (!Number.isSafeInteger(request.id) || typeof request.method !== 'string') throw Error('Pedido inválido.');
          const result = await handle(request.method, request.params);
          output.write(encodeMessage({ id: request.id, ok: true, result }));
        } catch (error) {
          output.write(encodeMessage({ id: request?.id ?? null, ok: false, error: String(error.message).slice(0, 500) }));
        }
      }).catch(() => input.destroy());
    }
  });
  return () => queue;
}
