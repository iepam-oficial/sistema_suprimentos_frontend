import type { InventoryAllocationDTO, InventoryStatus } from '@ti-assistant/contracts';

export type { InventoryStatus };
export type AllocationStatus = InventoryAllocationDTO['status'];

/** Item de inventário — alinhado ao contrato da API, sem campos internos */
export interface InventoryItem {
  id: string;
  internal_code?: string | null;
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
  sector?: {
    id: string;
    name: string;
  };
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

/** Alocação com campos extras e relações expandidas usados na UI admin e colaborador */
export type InventoryAllocation = Omit<
  InventoryAllocationDTO,
  'inventory' | 'requester' | 'notes' | 'return_date'
> & {
  destination_name?: string;
  destination_id?: string;
  locale_name?: string;
  location_name?: string;
  requester_sector?: string;
  notes: string;
  return_date: string;
  requester_delivery_confirmation: boolean;
  manager_delivery_confirmation: boolean;
  manager_return_confirmation: boolean;
  inventory: NonNullable<InventoryAllocationDTO['inventory']> & {
    description?: string;
  };
  requester: NonNullable<InventoryAllocationDTO['requester']>;
};

export interface InventoryTransaction {
  id: string;
  inventory: {
    id: string;
    name: string;
    model: string;
    serial_number: string;
    status: string;
  };
  from_user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  to_user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  transaction_type: 'ALLOCATION' | 'RETURN' | 'MAINTENANCE' | 'DISCARD' | 'TRANSFER';
  movement_type: 'IN' | 'OUT';
  quantity: number;
  supply?: {
    unit?: {
      symbol?: string;
    };
  };
  notes?: string;
  sector?: {
    id: string;
    name: string;
    location: {
      id: string;
      name: string;
    };
  };
  destination: string;
  destination_locale?: {
    id: string;
    name: string;
    location: {
      id: string;
      name: string;
    };
  };
  expected_return_date?: string;
  actual_return_date?: string;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  created_at: string;
}

export type GroupByOption = 'none' | 'location' | 'category' | 'status' | 'subcategory';
