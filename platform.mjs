import { homedir } from 'node:os';
import { join, dirname, win32 } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export const APP_ROOT = dirname(fileURLToPath(import.meta.url));
export const HOST_NAME = 'com.figmalocal.reader';
export function userPaths(home = homedir(), platform = process.platform, env = process.env) {
  const path = platform === 'win32' ? win32 : { join };
  const base = platform === 'darwin' ? join(home, 'Library', 'Application Support', 'FigmaLocal')
    : platform === 'win32' ? win32.join(env.LOCALAPPDATA || win32.join(home, 'AppData', 'Local'), 'FigmaLocal')
    : join(home, '.local', 'share', 'figma-local');
  return { base, app: path.join(base, 'app'), cache: path.join(base, 'cache'), config: path.join(base, 'install.json'), skills: path.join(home, '.codex', 'skills') };
}
export function readInstall() {
  try { return JSON.parse(readFileSync(process.env.FIGMA_LOCAL_CONFIG || userPaths().config, 'utf8')); } catch { return null; }
}
export function extensionId(key) {
  return [...createHash('sha256').update(Buffer.from(key, 'base64')).digest().subarray(0, 16)]
    .map(n => String.fromCharCode(97 + (n >> 4), 97 + (n & 15))).join('');
}
export function defaultCache() { return process.env.FIGMA_READER_CACHE_DIR || readInstall()?.cacheDir || join(APP_ROOT, '.cache'); }
