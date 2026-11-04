#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { createService } from './api.mjs';
import { serveNative } from './protocol.mjs';
import { APP_ROOT, defaultCache, extensionId } from '../platform.mjs';
const manifest = JSON.parse(readFileSync(new URL('../extension/manifest.json', import.meta.url), 'utf8'));
if (process.argv[2] !== `chrome-extension://${extensionId(manifest.key)}/`) process.exit(1);
serveNative(createService({ cacheDir: defaultCache() }));
