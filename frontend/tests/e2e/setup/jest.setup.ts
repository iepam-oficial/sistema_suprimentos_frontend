import fs from 'node:fs';
import path from 'node:path';

const rootEnvPath = path.resolve(__dirname, '../../../../.env.e2e');
if (fs.existsSync(rootEnvPath)) {
  const content = fs.readFileSync(rootEnvPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

if (process.env.E2E_SKIP === '1') {
  // eslint-disable-next-line no-console
  console.warn('[E2E] E2E_SKIP=1 — specs serão ignoradas.');
}

jest.setTimeout(180000);
