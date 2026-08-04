import type { SupplierRefDTO } from './catalog.dto';
import type { UserRefDTO } from './user.dto';

export interface PurchaseSupplyRefDTO {
  id: string;
  name: string;
}

export interface PurchaseDTO {
  id: string;
  item_id: string;
  item_type: string;
  supplier_id: string;
  quantity: number;
  price: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  supply?: PurchaseSupplyRefDTO;
  supplier?: SupplierRefDTO;
  user?: UserRefDTO;
}

export interface CreatePurchaseInput {
  item_id: string;
  item_type: string;
  supplier_id: string;
  quantity: number;
  price: number;
}

export interface BestSupplierSummaryDTO {
  supplier_id: string;
  avg_price: number | null;
  total_quantity: number | null;
}
