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
  const response = await fetch('/api/unit-of-measures', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export interface ChartOfAccount {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'ATIVO' | 'PASSIVO' | 'PATRIMONIO' | 'RECEITA' | 'DESPESA';
  created_at: string;
  updated_at: string;
}

export const fetchChartOfAccounts = async (tipo?: string): Promise<ChartOfAccount[]> => {
  const token = localStorage.getItem('@ti-assistant:token');
  const url = tipo ? `/api/chart-of-accounts?tipo=${tipo}` : '/api/chart-of-accounts';

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar planos de contas');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};
