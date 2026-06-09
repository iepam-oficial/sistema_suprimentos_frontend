import { InventoryResponse, RateLimitResponse } from '@/app/interfaces';

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
  const response = await fetch('/api/categories', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

export const fetchSubcategories = async (categoryId: string) => {
  const token = localStorage.getItem('@ti-assistant:token');
  const response = await fetch(`/api/subcategories/category/${categoryId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.json();
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
