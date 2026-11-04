import { test } from 'node:test';
import assert from 'node:assert/strict';
import { userPaths } from '../platform.mjs';
import { launcherText, windowsRegistryKeys } from '../scripts/install-platform.mjs';

test('Windows usa LocalAppData e mantém as skills no perfil do usuário', () => {
  const paths = userPaths('C:\\Users\\Teste', 'win32', { LOCALAPPDATA: 'D:\\Dados locais' });
  assert.equal(paths.base, 'D:\\Dados locais\\FigmaLocal');
  assert.equal(paths.skills, 'C:\\Users\\Teste\\.codex\\skills');
  assert.equal(userPaths('C:\\Users\\Teste', 'win32', {}).base, 'C:\\Users\\Teste\\AppData\\Local\\FigmaLocal');
  assert.ok(windowsRegistryKeys('com.figmalocal.reader').every(key => key.startsWith('HKCU\\') && !key.includes('HKLM')));
});

test('launcher mantém caminhos entre aspas e não interpreta porcentagens de nomes', () => {
  const launcher = launcherText({ config: "C:\\Users\\D'Ávila & 50%!\\install.json", app: 'C:\\Figma Local' }, 'C:\\Program Files\\nodejs\\node.exe', 'win32');
  assert.ok(launcher.includes('DisableDelayedExpansion'));
  assert.ok(launcher.includes('50%%!'));
  assert.ok(launcher.includes('"C:\\Program Files\\nodejs\\node.exe"'));
  assert.throws(() => launcherText({ config: 'bad\npath', app: 'safe' }, 'node.exe', 'win32'));
});
