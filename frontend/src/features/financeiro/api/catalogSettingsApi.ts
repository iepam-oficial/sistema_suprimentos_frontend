import type {
  CatalogSettingsDTO,
  UpdateCatalogSettingsInput,
} from '@ti-assistant/contracts';

export interface InternalCodeMigrationResult {
  supplies_updated: number;
  inventory_updated: number;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('@ti-assistant:token');
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { message?: string; error?: string }).message ||
        (errData as { error?: string }).error ||
        'Erro ao processar solicitação',
    );
  }
  return response.json();
}

export async function fetchCatalogSettings(): Promise<CatalogSettingsDTO> {
  const token = getToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch('/api/catalog-settings', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<CatalogSettingsDTO>(response);
}

export async function updateCatalogSettings(
  data: UpdateCatalogSettingsInput,
): Promise<CatalogSettingsDTO> {
  const token = getToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch('/api/catalog-settings', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<CatalogSettingsDTO>(response);
}

export async function migrateInternalCodes(): Promise<InternalCodeMigrationResult> {
  const token = getToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch('/api/internal-codes/migrate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<InternalCodeMigrationResult>(response);
}
