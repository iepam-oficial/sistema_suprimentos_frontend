import type { SupplyRequestStatus } from '../enums';
import type { UserDTO } from './user.dto';

export interface SupplyUnitDTO {
  id: string;
  name: string;
  symbol: string;
}

export interface SupplySummaryDTO {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: SupplyUnitDTO;
}

export interface SupplyRequestDTO {
  id: string;
  supply?: SupplySummaryDTO;
  user: UserDTO;
  quantity: number;
  status: SupplyRequestStatus;
  notes: string;
  created_at: string;
  requester_confirmation: boolean;
  manager_delivery_confirmation: boolean;
  delivery_deadline: string;
  destination: string;
  demand_supply_id?: string | null;
  demand_supply_approval_id?: string | null;
  demand_supply_code?: string;
}
