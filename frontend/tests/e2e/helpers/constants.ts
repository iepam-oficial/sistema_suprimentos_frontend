export const E2E_ITEM_DESCRIPTION = 'Parafuso sextavado M8';
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

export function getE2ePassword(): string {
  return process.env.DEV_SEED_PASSWORD ?? 'e2e-dev-password-min12';
}

export function getBaseUrl(): string {
  return process.env.E2E_BASE_URL ?? 'http://localhost:3002';
}

export function getApiUrl(): string {
  return process.env.E2E_API_URL ?? 'http://localhost:4000';
}

export function getE2eSecret(): string {
  const secret = process.env.E2E_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('E2E_SECRET deve ter pelo menos 32 caracteres');
  }
  return secret;
}

export function shouldSkipE2E(): boolean {
  return process.env.E2E_SKIP === '1';
}
