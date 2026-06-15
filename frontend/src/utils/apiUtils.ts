import { Supplier, Unit } from '@/app/(dashboard)/supplies/utils/types';

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  const token = localStorage.getItem('@ti-assistant:token');
  const response = await fetch('/api/suppliers', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export const fetchUnits = async (): Promise<Unit[]> => {
  const token = localStorage.getItem('@ti-assistant:token');
  if (!token) return [];
  const { fetchUnitOfMeasures } = await import('@/features/reference-data');
  const units = await fetchUnitOfMeasures(token);
  return units.map((u) => ({
    id: u.id,
    name: u.name,
    symbol: u.symbol,
    description: u.description ?? '',
    created_at: u.created_at ?? '',
    updated_at: u.updated_at ?? '',
  }));
};

export type { ChartOfAccount } from '@/features/financeiro/types';
export { fetchChartOfAccounts } from '@/features/financeiro/api/chartOfAccountApi';
