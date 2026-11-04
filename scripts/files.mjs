import { existsSync, readdirSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
export const PACKAGE_PATHS = ['package.json', 'package-lock.json', 'plugin.json', 'reader.mjs', 'lib.mjs', 'service.mjs', 'platform.mjs', 'README.md', 'README.en.md', 'LICENSE', 'CHANGELOG.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'SECURITY.md', 'PRIVACY.md', 'assets', 'THIRD_PARTY_NOTICES.md', 'Instalar.command', 'Instalar.cmd', 'vendor', 'native', 'extension', 'skills', 'scripts', 'docs', 'test'];
export function packageFiles(root) {
  const files = [];
  function visit(path) {
    const full = join(root, path);
    if (!existsSync(full)) return;
    const stat = lstatSync(full);
    if (stat.isSymbolicLink()) throw Error('Links simbólicos não entram no pacote: ' + path);
    if (stat.isDirectory()) for (const name of readdirSync(full)) visit(join(path, name));
    else files.push(path.replaceAll('\\', '/'));
  }
  PACKAGE_PATHS.forEach(visit); return files.sort();
}
