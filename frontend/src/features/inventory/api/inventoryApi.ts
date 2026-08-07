import { InventoryResponse, RateLimitResponse } from '@/app/interfaces';
import type { InventoryItem } from '@/features/inventory/types';

export const fetchItems = async (): Promise<RateLimitResponse | InventoryResponse[]> => {
  const token = localStorage.getItem('@ti-assistant:token');
  const response = await fetch('/api/inventory', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 429) {
    return { status: 429, message: 'Rate limit exceeded' };
  }

  return response.json();
};

export const fetchCategories = async () => {
  const token = localStorage.getItem('@ti-assistant:token');
  if (!token) return [];
  const { fetchCategories: fetchCats } = await import('@/features/reference-data');
  return fetchCats(token);
};

export const fetchSubcategories = async (categoryId: string) => {
  const token = localStorage.getItem('@ti-assistant:token');
  if (!token) return [];
  const { fetchSubcategoriesByCategory } = await import('@/features/reference-data');
  return fetchSubcategoriesByCategory(token, categoryId);
};

export const createItem = async (data: Record<string, unknown>) => {
  const token = localStorage.getItem('@ti-assistant:token');
  return fetch('/api/inventory', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

export const updateItem = async (id: string, data: Record<string, unknown>) => {
  const token = localStorage.getItem('@ti-assistant:token');
  return fetch(`/api/inventory/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

export const deleteItem = async (id: string) => {
  const token = localStorage.getItem('@ti-assistant:token');
  return fetch(`/api/inventory/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

export async function generateInventoryInternalCode(
  token: string,
  id: string,
): Promise<InventoryItem> {
  const response = await fetch(`/api/inventory/${id}/generate-internal-code`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let message = 'Erro ao gerar código interno';
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

export const depreciateAll = async () => {
  const token = localStorage.getItem('@ti-assistant:token');
  const response = await fetch('/api/inventory', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

export const fetchInventory = async (token: string) => {
  const response = await fetch('/api/inventory', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar itens do inventário');
  }

  return response.json();
};

export const fetchAvailableInventory = async (token: string) => {
  const response = await fetch('/api/inventory/available', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar itens disponíveis do inventário');
  }

  return response.json();
};

export const fetchAllocations = async (token: string) => {
  const response = await fetch('/api/inventory-allocations', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar alocações');
  }

  return response.json();
};

export const fetchAllocation = async (id: string, token: string) => {
  const response = await fetch(`/api/inventory-allocations/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar alocação');
  }

  return response.json();
};

export const createAllocation = async (data: Record<string, unknown>, token: string) => {
  const response = await fetch('/api/inventory-allocations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Erro ao criar alocação');
  }

  return response.json();
};

export const updateAllocation = async (id: string, data: Record<string, unknown>, token: string) => {
  const response = await fetch(`/api/inventory-allocations/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Erro ao atualizar alocação');
  }

  return response.json();
};

export const deleteAllocation = async (id: string, token: string) => {
  const response = await fetch(`/api/inventory-allocations/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao excluir alocação');
  }
};

export const fetchInventoryItemById = async (id: string, token: string) => {
  const response = await fetch(`/api/inventory/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar detalhes do item do inventário');
  }

  return response.json();
};

export const fetchInventoryTransactions = async (token: string) => {
  const response = await fetch('/api/inventory-transactions', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar transações de inventário');
  }

  return response.json();
};

export const allocateInventoryItem = async (
  itemId: string,
  return_date: string,
  destination: string,
  notes: string,
  token: string,
  delivery_deadline: string = ''
) => {
  const response = await fetch('/api/inventory-allocations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inventory_id: itemId,
      return_date,
      destination,
      notes,
      delivery_deadline,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message || 'Erro ao criar alocação'
    );
  }

  return response.json();
};

export const updateAllocationStatus = async (
  allocationId: string,
  newStatus: 'APPROVED' | 'REJECTED',
  token: string
) => {
  const response = await fetch(`/api/inventory-allocations/${allocationId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: newStatus }),
  });

  if (!response.ok) {
    throw new Error('Erro ao atualizar status da alocação');
  }

  return response.json();
};

export const confirmAllocationDelivery = async (
  allocationId: string,
  confirmation: boolean,
  token: string
) => {
  const response = await fetch(
    `/api/inventory-allocations/${allocationId}/delivery-confirmation`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmation }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error || 'Erro ao confirmar entrega'
    );
  }

  return response.json();
};

export const markAllocationLost = async (allocationId: string, token: string) => {
  const response = await fetch(
    `/api/inventory-allocations/${allocationId}/mark-lost`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error || 'Erro ao marcar item como perdido'
    );
  }

  return response.json();
};

export const confirmManagerReturn = async (allocationId: string, token: string) => {
  const response = await fetch(
    `/api/inventory-allocations/${allocationId}/manager-return-confirmation`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error || 'Erro ao confirmar devolução'
    );
  }

  return response.json();
};
