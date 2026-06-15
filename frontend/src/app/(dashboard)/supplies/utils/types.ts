export type { SupplyDTO as Supply } from '@/features/catalog/types';

export interface Category {
    id: string;
    label: string;
}

export interface Supplier {
    id: string;
    name: string;
}

export interface Unit {
    id: string;
    name: string;
    symbol: string;
    description: string;
    created_at: string;
    updated_at: string;
} 