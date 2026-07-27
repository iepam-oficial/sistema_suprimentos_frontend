import type { SupplierRefDTO } from './catalog.dto';
import type { UserRefDTO } from './user.dto';

export const QuoteStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus];

export interface QuoteItemDTO {
  id: string;
  product_name: string;
  manufacturer: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  final_price: number;
  notes?: string | null;
  link?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface QuoteDTO {
  id: string;
  supplier_id: string;
  supplier_contact?: string | null;
  status: QuoteStatus;
  notes?: string | null;
  total_value: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  approved_by?: string | null;
  supplier?: SupplierRefDTO;
  user?: UserRefDTO;
  approver?: UserRefDTO | null;
  items: QuoteItemDTO[];
}

export interface CreateQuoteItemInput {
  product_name: string;
  manufacturer: string;
  quantity: number;
  unit_price: number;
  final_price?: number;
  notes?: string | null;
  link?: string | null;
}

export interface CreateQuoteInput {
  supplier_id: string;
  supplier_contact?: string | null;
  notes?: string | null;
  items: CreateQuoteItemInput[];
}

export interface UpdateQuoteItemInput {
  id?: string;
  product_name?: string;
  manufacturer?: string;
  quantity?: number;
  unit_price?: number;
  final_price?: number;
  notes?: string | null;
  link?: string | null;
}

export interface UpdateQuoteInput {
  supplier_id?: string;
  supplier_contact?: string | null;
  notes?: string | null;
  items?: UpdateQuoteItemInput[];
}

export interface SmartQuoteItemDTO {
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface SmartQuoteDTO {
  supplier_id: string;
  supplier_name: string;
  items: SmartQuoteItemDTO[];
  total_value: number;
  created_at: string;
}
