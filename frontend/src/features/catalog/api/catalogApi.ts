import type {
  CreateSupplyBatchInput,
  CreateSupplyInput,
  StockMovement,
  SupplyBatchDTO,
  SupplyDTO,
} from '../types';

export async function fetchSupplies(
  token: string,
  options?: { audience?: 'requester' | 'manager' },
): Promise<SupplyDTO[]> {
  const params = options?.audience ? `?audience=${options.audience}` : '';
  const response = await fetch(`/api/supplies${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar suprimentos');
  }

  return response.json();
}

export async function fetchSupplyById(
  token: string,
  id: string,
  options?: { audience?: 'requester' | 'manager' },
): Promise<SupplyDTO> {
  const params = options?.audience ? `?audience=${options.audience}` : '';
  const response = await fetch(`/api/supplies/${id}${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar suprimento');
  }

  return response.json();
}

export async function searchSupplies(
  token: string,
  query: string,
  options?: { includeHidden?: boolean },
): Promise<SupplyDTO[]> {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }

  const params = new URLSearchParams({ q });
  if (options?.includeHidden) {
    params.set('include_hidden', 'true');
  }

  const response = await fetch(`/api/supplies/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar suprimentos');
  }

  return response.json();
}

export async function createSupply(
  token: string,
  input: CreateSupplyInput,
): Promise<SupplyDTO> {
  const response = await fetch('/api/supplies', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = 'Erro ao criar suprimento';
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error || body.message || message;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return response.json();
}

export async function fetchSupplyBatches(token: string): Promise<SupplyBatchDTO[]> {
  const response = await fetch('/api/supply-batches', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar lotes');
  }

  return response.json();
}

export async function fetchSupplyBatchById(token: string, id: string): Promise<SupplyBatchDTO> {
  const response = await fetch(`/api/supply-batches/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar lote');
  }

  return response.json();
}

export async function createBatch(
  token: string,
  input: CreateSupplyBatchInput,
): Promise<SupplyBatchDTO> {
  const response = await fetch('/api/supply-batches', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Erro ao criar lote');
  }

  return response.json();
}

export async function fetchSupplyTransactions(token: string) {
  const response = await fetch('/api/supply-transactions', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar transações');
  }

  return response.json();
}

export async function fetchStockMovements(token: string): Promise<StockMovement[]> {
  const response = await fetch('/api/stock-movements', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar movimentações');
  }

  return response.json();
}

export async function fetchSuppliers(token: string) {
  const response = await fetch('/api/suppliers', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar fornecedores');
  }

  return response.json();
}

export async function searchSupplierByCnpj(token: string, search: string) {
  const response = await fetch(`/api/suppliers/search?search=${encodeURIComponent(search)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}
