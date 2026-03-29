import { Supplier, Unit } from '@/app/(dashboard)/supplies/utils/types';

export const fetchSuppliers = async (): Promise<Supplier[]> => {
    const token = localStorage.getItem('@ti-assistant:token');
    const response = await fetch('/api/suppliers', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
};

export const fetchUnits = async (): Promise<Unit[]> => {
    const token = localStorage.getItem('@ti-assistant:token');
    const response = await fetch('/api/unit-of-measures', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
};

export const fetchInventory = async (token: string) => {
    const response = await fetch('/api/inventory', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar itens do inventário');
    }

    return response.json();
};

export const fetchAvailableInventory = async (token: string) => {
    const response = await fetch('/api/inventory/available', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar itens disponíveis do inventário');
    }

    return response.json();
};

export const fetchAllocations = async (token: string) => {
    const response = await fetch('/api/inventory-allocations', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar alocações');
    }

    return response.json();
};

export const fetchAllocation = async (id: string, token: string) => {
    const response = await fetch(`/api/inventory-allocations/${id}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar alocação');
    }

    return response.json();
};

export const createAllocation = async (data: any, token: string) => {
    const response = await fetch('/api/inventory-allocations', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error('Erro ao criar alocação');
    }

    return response.json();
};

export const updateAllocation = async (id: string, data: any, token: string) => {
    const response = await fetch(`/api/inventory-allocations/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
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
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao excluir alocação');
    }
};

export const fetchInventoryItemById = async (id: string, token: string) => {
    const response = await fetch(`/api/inventory/${id}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar detalhes do item do inventário');
    }

    return response.json();
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
    const url = tipo 
        ? `/api/chart-of-accounts?tipo=${tipo}`
        : '/api/chart-of-accounts';
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar planos de contas');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
}; 