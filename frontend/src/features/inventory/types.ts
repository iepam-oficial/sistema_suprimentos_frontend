import type { InventoryAllocationDTO, InventoryStatus } from '@ti-assistant/contracts';

export type { InventoryStatus };
export type AllocationStatus = InventoryAllocationDTO['status'];

/** Item de inventário — alinhado ao contrato da API, sem campos internos */
export interface InventoryItem {
  id: string;
  item: string;
  name: string;
  model: string;
  serial_number: string;
  finality: string;
  acquisition_price: number;
  freight: number;
  residual_value: number;
  depreciated_value: number;
  service_life: number;
  image_url?: string | null;
  supplier_id?: string;
  acquisition_date: string;
  location_id: string;
  user_id: string;
  created_at: string;
  category_id: string;
  description?: string | null;
  locale_id?: string | null;
  subcategory_id: string;
  status: InventoryStatus;
  sector_id?: string | null;
  location: {
    id: string;
    name: string;
    address: string;
    branch: string;
    user_id: string;
    created_at: string;
  };
  locale?: {
    id: string;
    name: string;
    description?: string | null;
    created_at: string;
    updated_at: string;
    location_id: string;
  };
  supplier?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    cnpj: string;
    contact_person: string;
    created_at: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
    role: string;
    sector_id: string | null;
  };
  category: {
    id: string;
    value: string;
    label: string;
    created_at: string;
    updated_at: string;
  };
  subcategory: {
    id: string;
    value: string;
    label: string;
    category_id: string;
    created_at: string;
    updated_at: string;
  };
}

export type InventoryAllocation = InventoryAllocationDTO;

export type GroupByOption = 'none' | 'location' | 'category' | 'status' | 'subcategory';
