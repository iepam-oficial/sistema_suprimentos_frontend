import type { CatalogSupply } from '../context/CartContext';
import type { SupplyRequest } from '../types';

export type Supply = CatalogSupply;

export const fetchSupplies = async (token: string) => {
  const response = await fetch('/api/supplies', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar suprimentos');
  }

  return response.json();
};

export const fetchRequests = async (token: string) => {
  const regularResponse = await fetch('/api/supply-requests/my-requests', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!regularResponse.ok) {
    throw new Error('Erro ao carregar requisições regulares');
  }

  const regularData = await regularResponse.json();

  const customResponse = await fetch('/api/custom-supply-requests/user', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!customResponse.ok) {
    throw new Error('Erro ao carregar requisições customizadas');
  }

  const customData = await customResponse.json();

  return [
    ...regularData,
    ...customData.map((request: Record<string, unknown>) => ({
      ...request,
      is_custom: true,
    })),
  ];
};

export const handleRequesterConfirmation = async (
  requestId: string,
  confirmation: boolean,
  token: string,
  isCustom: boolean
) => {
  const endpoint = isCustom
    ? `/api/custom-supply-requests/${requestId}/requester-confirmation`
    : `/api/supply-requests/${requestId}/requester-confirmation`;

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ confirmation }),
  });

  if (!response.ok) {
    throw new Error('Erro ao atualizar confirmação');
  }

  return response.json();
};

export const cancelRequest = async (requestId: string, token: string, isCustom: boolean) => {
  const endpoint = isCustom
    ? `/api/custom-supply-requests/${requestId}/cancel`
    : `/api/supply-requests/${requestId}/cancel`;

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao cancelar requisição');
  }

  return response.json();
};

export const submitRequest = async (
  cart: { supply: Supply; quantity: number }[],
  deliveryDeadline: string,
  destination: string,
  token: string,
  localeId?: string
) => {
  const payload = {
    items: cart.map((item) => ({
      supply_id: item.supply.id,
      quantity: item.quantity,
      delivery_deadline: new Date(deliveryDeadline).toISOString(),
      destination,
      notes: `Pedido do carrinho - ${item.supply.name}`,
      locale_id: localeId || null,
    })),
  };

  const response = await fetch('/api/supply-requests/many', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Erro ao enviar pedido');
  }

  return response.json();
};

export const handleCustomRequest = async (
  data: { items: Array<Record<string, unknown>> },
  token: string
) => {
  const response = await fetch('/api/supply-requests/custom/many', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Erro ao criar requisições customizadas');
  }

  return response.json();
};

export const filterSupplies = (supplies: Supply[], search: string): Supply[] => {
  if (!search) return supplies;

  return supplies.filter(
    (supply) =>
      supply.name.toLowerCase().includes(search.toLowerCase()) ||
      supply.description.toLowerCase().includes(search.toLowerCase()) ||
      supply.category.label.toLowerCase().includes(search.toLowerCase())
  );
};

export const filterRequests = (requests: SupplyRequest[], search: string, statusFilter: string) => {
  if (!search && !statusFilter) return requests;

  return requests.filter((request) => {
    const matchesSearch =
      (request.is_custom
        ? request.item_name?.toLowerCase().includes(search.toLowerCase())
        : request.supply?.name.toLowerCase().includes(search.toLowerCase())) ||
      request.user.name.toLowerCase().includes(search.toLowerCase()) ||
      request.user.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
};

export const allocateInventoryItem = async (
  itemId: string,
  return_date: string,
  destination: string,
  notes: string,
  token: string
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
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao criar alocação');
  }

  return response.json();
};
