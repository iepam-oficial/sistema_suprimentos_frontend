import type { SupplyDTO } from '../types';

export async function fetchSupplies(token: string): Promise<SupplyDTO[]> {
  const response = await fetch('/api/supplies', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar suprimentos');
  }

  return response.json();
}

export async function fetchSupplyById(token: string, id: string): Promise<SupplyDTO> {
  const response = await fetch(`/api/supplies/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar suprimento');
  }

  return response.json();
}

export async function fetchSupplyBatches(token: string) {
  const response = await fetch('/api/supply-batches', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar lotes');
  }

  return response.json();
}

export async function fetchSupplyBatchById(token: string, id: string) {
  const response = await fetch(`/api/supply-batches/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar lote');
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
