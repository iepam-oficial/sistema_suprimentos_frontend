import { fetchSupplies } from '@/features/catalog/api/catalogApi';
import type { Supply } from '@/features/catalog/types';
import type { SupplyRequest } from '../types';
import { filterAvailableSupplies } from '../utils/cartStockUtils';

export type { Supply };
export { fetchSupplies };

export const fetchRequests = async (token: string) => {
  const response = await fetch('/api/supply-requests/my-requests', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar requisições');
  }

  return response.json();
};

export const handleRequesterConfirmation = async (
  requestId: string,
  confirmation: boolean,
  token: string
) => {
  const response = await fetch(`/api/supply-requests/${requestId}/requester-confirmation`, {
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

export const cancelRequest = async (requestId: string, token: string) => {
  const response = await fetch(`/api/supply-requests/${requestId}/cancel`, {
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

export const filterSupplies = (supplies: Supply[], search: string): Supply[] => {
  const available = filterAvailableSupplies(supplies);
  if (!search) return available;

  return available.filter(
    (supply) =>
      supply.name.toLowerCase().includes(search.toLowerCase()) ||
      (supply.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (supply.category?.label.toLowerCase().includes(search.toLowerCase()) ?? false)
  );
};

export const filterRequests = (requests: SupplyRequest[], search: string, statusFilter: string) => {
  if (!search && !statusFilter) return requests;

  return requests.filter((request) => {
    const matchesSearch =
      (request.supply?.name.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      request.user.name.toLowerCase().includes(search.toLowerCase()) ||
      request.user.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
};
