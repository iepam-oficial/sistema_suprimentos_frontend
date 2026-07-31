import type { MovementType, SupplyBatchOrigin, SupplyMovementType, SupplyTransactionType } from '../enums';
import type { FiscalNcmDTO } from './fiscal.dto';
import type { InvoiceLineFiscalSnapshot } from './invoice-fiscal.dto';
import type {
  CategoryDTO,
  SubcategoryDTO,
  UnitOfMeasureDTO,
} from './reference-data.dto';

/** @deprecated Use CategoryDTO from reference-data */
export type CategoryRefDTO = Pick<CategoryDTO, 'id' | 'value' | 'label' | 'created_at' | 'updated_at'>;

/** @deprecated Use SubcategoryDTO from reference-data */
export type SubcategoryRefDTO = Pick<
  SubcategoryDTO,
  'id' | 'value' | 'label' | 'category_id' | 'created_at' | 'updated_at'
>;

/** @deprecated Use UnitOfMeasureDTO from reference-data */
export type UnitRefDTO = Pick<
  UnitOfMeasureDTO,
  'id' | 'name' | 'symbol' | 'description' | 'created_at' | 'updated_at'
>;

export interface SupplierRefDTO {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  cnpj?: string;
  contact_person?: string;
  created_at?: string;
}

export interface SupplierDTO {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  cnpj: string;
  contact_person: string;
  created_at?: string;
}

export interface SupplyDTO {
  id: string;
  name: string;
  description: string | null;
  available_quantity: number;
  visible_to_requesters: boolean;
  minimum_quantity: number;
  category_id: string;
  subcategory_id: string | null;
  unit_id: string;
  image_url: string | null;
  chart_of_account_id?: string | null;
  /** Omitido quando audience=requester */
  internal_code?: string | null;
  ncm_id?: string | null;
  ncm?: Pick<FiscalNcmDTO, 'id' | 'code' | 'description'> | null;
  created_at: string;
  updated_at: string;
  category?: CategoryRefDTO;
  subcategory?: SubcategoryRefDTO | null;
  unit?: UnitRefDTO;
}

export type SupplyBatchInvoiceFileType = 'image' | 'pdf' | 'xml';

/** Linha fiscal exibida no detalhe do lote (PROCUREMENT ou MANUAL). */
export interface SupplyBatchFiscalLineDTO extends InvoiceLineFiscalSnapshot {
  id?: string;
  line_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  ncm_from_invoice?: string | null;
}

/** Entidade de linha de NF vinculada a lote manual. */
export type SupplyBatchInvoiceLineDTO = SupplyBatchFiscalLineDTO;

export interface SupplyBatchDTO {
  id: string;
  supply_id: string;
  supplier_id: string;
  purchased_quantity: number;
  computed_balance: number;
  unit_price: number;
  freight: number;
  total_price: number;
  purchased_at: string;
  expires_at: string | null;
  notes: string | null;
  invoice_url: string | null;
  invoice_file_type?: SupplyBatchInvoiceFileType | null;
  origin?: SupplyBatchOrigin | null;
  goods_receipt_id?: string | null;
  goods_receipt_invoice_line_id?: string | null;
  fiscal_lines?: SupplyBatchFiscalLineDTO[];
  fiscal_incomplete?: boolean;
  invoice_recommended?: boolean;
  created_at?: string;
  updated_at?: string;
  supply?: SupplyDTO;
  supplier?: SupplierRefDTO;
}

export interface StockMovementUserRefDTO {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface StockMovementSectorRefDTO {
  id: string;
  name: string;
  location: {
    id: string;
    name: string;
    branch: string;
  };
}

export interface StockMovementDTO {
  id: string;
  supply_id: string;
  batch_id: string;
  supply_request_id: string | null;
  movement_type: SupplyMovementType;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  justification: string | null;
  notes: string | null;
  from_user_id: string;
  to_user_id: string;
  sector_id: string | null;
  reversed_movement_id: string | null;
  created_at: string;
  batch?: SupplyBatchDTO;
  supply?: Pick<SupplyDTO, 'id' | 'name' | 'available_quantity' | 'unit'>;
  from_user?: StockMovementUserRefDTO;
  to_user?: StockMovementUserRefDTO;
  sector?: StockMovementSectorRefDTO | null;
}

export interface CreateSupplyInput {
  name: string;
  description?: string;
  minimum_quantity: number;
  unit_id: string;
  category_id: string;
  subcategory_id?: string;
  image_url?: string;
  chart_of_account_id?: string;
  ncm_id?: string;
}

export interface CreateSupplyBatchInput {
  supply_id: string;
  supplier_id: string;
  purchased_quantity: number;
  unit_price: number;
  freight?: number;
  purchased_at?: string;
  expires_at?: string | null;
  notes?: string | null;
  invoice_url?: string | null;
  invoice_file_type?: SupplyBatchInvoiceFileType | null;
}

export interface SupplyBatchInvoiceUploadResponseDTO {
  key: string;
  file_type: SupplyBatchInvoiceFileType;
}

export interface CreateLossInput {
  supply_id: string;
  quantity: number;
  justification: string;
  sector_id?: string | null;
}

export interface CreateReturnInput {
  supply_id: string;
  quantity: number;
  supply_request_id?: string | null;
  notes?: string | null;
  sector_id?: string | null;
}

/** @deprecated Use StockMovementDTO */
export interface SupplyTransactionUserRefDTO {
  id: string;
  name: string;
  email: string;
  role: string;
}

/** @deprecated Use StockMovementSectorRefDTO */
export interface SupplyTransactionSectorRefDTO {
  id: string;
  name: string;
  location: {
    id: string;
    name: string;
    branch: string;
  };
}

/** @deprecated Use StockMovementDTO supply ref */
export interface SupplyTransactionSupplyRefDTO {
  id: string;
  name: string;
  description?: string | null;
  available_quantity: number;
  unit?: UnitRefDTO;
}

/** @deprecated Use StockMovementDTO */
export interface SupplyTransactionDTO {
  id: string;
  supply_id: string;
  from_user_id: string;
  to_user_id: string;
  quantity: number;
  transaction_type: SupplyTransactionType | string;
  movement_type: MovementType;
  notes: string | null;
  sector_id: string | null;
  created_at: string;
  supply?: SupplyTransactionSupplyRefDTO;
  from_user?: SupplyTransactionUserRefDTO;
  to_user?: SupplyTransactionUserRefDTO;
  sector?: SupplyTransactionSectorRefDTO | null;
}

export interface CreateDeliveryTransactionInput {
  supply_id: string;
  from_user_id: string;
  to_user_id: string;
  quantity: number;
  notes?: string;
  sector_id?: string | null;
  supply_request_id?: string;
}
