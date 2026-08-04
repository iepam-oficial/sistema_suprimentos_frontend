export const E2E_ITEM_DESCRIPTION = 'Parafuso sextavado M8';
/** NCM sugerido pelo stub de IA da NF; deve bater com o seed E2E (`ensureFiscalNcm`). */
export const E2E_ITEM_NCM = '39191000';
/** Snapshot fiscal do stub / fixture `nfe-sample.xml` (linha 1). */
export const E2E_ITEM_CFOP = '5102';
export const E2E_ITEM_CST = '00';
export const E2E_ITEM_COMMERCIAL_UNIT = 'UN';
export const E2E_SUPPLIER_NAMES = [
  'Fornecedor E2E A',
  'Fornecedor E2E B',
  'Fornecedor E2E C',
] as const;

export const E2E_USERS = {
  COORDINATOR: { email: 'coordenador@example.com', role: 'COORDINATOR' },
  DIRECTOR: { email: 'diretor@example.com', role: 'DIRECTOR' },
  MANAGER: { email: 'gerente@example.com', role: 'MANAGER' },
  EMPLOYEE: { email: 'usuario@example.com', role: 'EMPLOYEE' },
} as const;

export type E2eRole = keyof typeof E2E_USERS;

function env(key: string): string | undefined {
  const fromCypress = Cypress.env(key);
  if (typeof fromCypress === 'string' && fromCypress.length > 0) {
    return fromCypress;
  }
  return undefined;
}

export function getE2ePassword(): string {
  return env('DEV_SEED_PASSWORD') ?? 'e2e-dev-password-min12';
}

export function getBaseUrl(): string {
  return env('E2E_BASE_URL') ?? 'http://localhost:3002';
}

export function getApiUrl(): string {
  return env('E2E_API_URL') ?? 'http://localhost:4000';
}

export function getE2eSecret(): string {
  const secret = env('E2E_SECRET');
  if (!secret || secret.length < 32) {
    throw new Error('E2E_SECRET deve ter pelo menos 32 caracteres');
  }
  return secret;
}

export function shouldSkipE2E(): boolean {
  return env('E2E_SKIP') === '1';
}
