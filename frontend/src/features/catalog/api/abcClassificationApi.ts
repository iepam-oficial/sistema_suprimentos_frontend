import type {
  AbcClassificationConfigDTO,
  AbcClassificationConfigUpdateDTO,
} from '@ti-assistant/contracts';

export interface AbcRecalculateResult {
  status: 'accepted';
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

export async function fetchAbcClassificationConfig(): Promise<AbcClassificationConfigDTO> {
  const token = getToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch('/api/supplies/abc-classification/config', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<AbcClassificationConfigDTO>(response);
}

export async function updateAbcClassificationConfig(
  data: AbcClassificationConfigUpdateDTO,
): Promise<AbcClassificationConfigDTO> {
  const token = getToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch('/api/supplies/abc-classification/config', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<AbcClassificationConfigDTO>(response);
}

export async function recalculateAbcClassification(): Promise<AbcRecalculateResult> {
  const token = getToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch('/api/supplies/abc-classification/recalculate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<AbcRecalculateResult>(response);
}
