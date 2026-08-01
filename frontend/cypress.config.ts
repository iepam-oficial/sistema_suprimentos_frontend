import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'cypress';

/** Monorepo root: frontend/ → ../ → ../../.env.e2e */
const ROOT_ENV_PATH = path.resolve(__dirname, '../../.env.e2e');

function loadRootEnvE2e(): void {
  if (!fs.existsSync(ROOT_ENV_PATH)) {
    return;
  }
  const content = fs.readFileSync(ROOT_ENV_PATH, 'utf8');
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

export default defineConfig({
  video: true,
  screenshotOnRunFailure: true,
  viewportWidth: 1440,
  viewportHeight: 900,
  defaultCommandTimeout: 30000,
  requestTimeout: 60000,
  e2e: {
    baseUrl: process.env.E2E_BASE_URL ?? 'http://localhost:3002',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on, config) {
      loadRootEnvE2e();

      config.baseUrl = process.env.E2E_BASE_URL ?? config.baseUrl ?? 'http://localhost:3002';
      config.env = {
        ...config.env,
        E2E_BASE_URL: process.env.E2E_BASE_URL ?? 'http://localhost:3002',
        E2E_API_URL: process.env.E2E_API_URL ?? 'http://localhost:4000',
        E2E_SECRET: process.env.E2E_SECRET ?? '',
        DEV_SEED_PASSWORD: process.env.DEV_SEED_PASSWORD ?? '',
        E2E_SKIP: process.env.E2E_SKIP ?? '',
      };

      if (process.env.E2E_SKIP === '1') {
        // eslint-disable-next-line no-console
        console.warn('[E2E] E2E_SKIP=1 — specs serão ignoradas via support.');
      }

      return config;
    },
  },
});
