import type {
  DiscrepancySeverity,
  GoodsReceiptStatus,
  ReceiptLineDestination,
} from '../enums';
import type { SupplierRefDTO } from './catalog.dto';
import type { FiscalNcmDTO } from './fiscal.dto';
import type { PurchaseOrderItemDTO } from './purchase-order.dto';
import type { UserRefDTO } from './user.dto';

export interface GoodsReceiptPhysicalLineDTO {
  id: string;
  goods_receipt_id: string;
  description: string;
  quantity_received: number;
  supply_id?: string | null;
  pr_item_id?: string | null;
}

export interface GoodsReceiptInvoiceLineDTO {
  id: string;
  goods_receipt_id: string;
  line_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  destination_type: ReceiptLineDestination;
  supply_id?: string | null;
  ai_suggested_supply_id?: string | null;
  ai_confidence?: number | null;
  ncm_from_invoice?: string | null;
  ncm_id?: string | null;
  fiscal_ncm?: Pick<FiscalNcmDTO, 'id' | 'code' | 'description'> | null;
}

export interface GoodsReceiptDiscrepancyDTO {
  id: string;
  goods_receipt_id: string;
  severity: DiscrepancySeverity;
  layer: string;
  field: string;
  expected_value?: string | null;
  actual_value?: string | null;
  financial_impact?: number | null;
  justification?: string | null;
  supplier_notified: boolean;
  resolved_at?: string | null;
}

export interface GoodsReceiptInventoryEntryDTO {
  id: string;
  goods_receipt_id: string;
  invoice_line_id: string;
  inventory_id: string;
}

export interface GoodsReceiptPurchaseOrderRefDTO {
  id: string;
  display_code: string;
  supplier?: SupplierRefDTO;
  items?: PurchaseOrderItemDTO[];
}

export interface GoodsReceiptSummaryDTO {
  id: string;
  code: number;
  display_code: string;
  purchase_order_id: string;
  status: GoodsReceiptStatus;
  purchase_order_display_code?: string;
  supplier_name?: string;
  discrepancy_count?: number;
  created_at: string;
  updated_at: string;
}

export interface GoodsReceiptDTO {
  id: string;
  code: number;
  display_code: string;
  purchase_order_id: string;
  status: GoodsReceiptStatus;
  started_by_id: string;
  invoice_s3_key?: string | null;
  invoice_file_type?: string | null;
  nfe_access_key?: string | null;
  nfe_number?: string | null;
  nfe_series?: string | null;
  invoice_supplier_name?: string | null;
  document_comparison_at?: string | null;
  director_approved_at?: string | null;
  director_approved_by_id?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  started_by?: UserRefDTO;
  director_approved_by?: UserRefDTO | null;
  purchase_order?: GoodsReceiptPurchaseOrderRefDTO;
  physical_lines: GoodsReceiptPhysicalLineDTO[];
  invoice_lines: GoodsReceiptInvoiceLineDTO[];
  discrepancies: GoodsReceiptDiscrepancyDTO[];
  inventory_entries: GoodsReceiptInventoryEntryDTO[];
}

export interface GoodsReceiptListResult {
  items: GoodsReceiptSummaryDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateGoodsReceiptInput {
  purchase_order_id: string;
}

export interface SavePhysicalLineInput {
  description: string;
  quantity_received: number;
  supply_id?: string;
  pr_item_id?: string;
}

export interface SavePhysicalLinesInput {
  lines: SavePhysicalLineInput[];
}

export interface ClassifyInvoiceLineInput {
  invoice_line_id: string;
  destination_type: ReceiptLineDestination;
  supply_id?: string;
  ncm_id?: string | null;
  supply_ncm_action?: 'KEEP_SUPPLY' | 'USE_LINE_NCM';
}

export interface ClassifyInvoiceLinesInput {
  lines: ClassifyInvoiceLineInput[];
}

export interface SaveInventoryLineInput {
  invoice_line_id: string;
  name: string;
  model: string;
  serial_numbers: string[];
  location_id: string;
  category_id: string;
  subcategory_id: string;
  chart_of_account_id?: string;
  finality?: string;
  acquisition_price?: number;
}

export interface SaveInventoryLinesInput {
  lines: SaveInventoryLineInput[];
}

export type ResolveDiscrepancyAction =
  | 'accept'
  | 'notify_supplier';

export interface ResolveDiscrepancyInput {
  action: ResolveDiscrepancyAction;
  justification?: string;
}

export interface ResolveDiscrepanciesBatchInput {
  action: ResolveDiscrepancyAction; // 'accept' | 'notify_supplier'
  discrepancy_ids: string[];
  justification?: string;
}

export interface ResolveDiscrepancyBatchFailure {
  discrepancy_id: string;
  code: string; // e.g. 'NOT_FOUND' | 'ALREADY_RESOLVED' | 'CRITICAL_NOT_ALLOWED' | 'NOT_IN_RECEIPT' | 'PERSIST_ERROR'
  message: string;
}

export interface ResolveDiscrepanciesBatchResult {
  receipt: GoodsReceiptDTO;
  succeeded_ids: string[];
  failed: ResolveDiscrepancyBatchFailure[];
}

export interface NfeParseLineDTO {
  line_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  ncm?: string;
}

export interface NfeParseResultDTO {
  nfe_access_key: string;
  nfe_number: string;
  nfe_series: string;
  supplier_name?: string;
  lines: NfeParseLineDTO[];
}

export interface SuggestedInvoiceLineDTO {
  line_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  ncm?: string;
}

export interface SuggestedInvoiceMetadataDTO {
  nfe_number?: string;
  nfe_series?: string;
  nfe_access_key?: string;
  supplier_name?: string;
}

export interface ConfirmInvoiceLineInput {
  line_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  ncm?: string;
}

export interface ConfirmInvoiceLinesInput {
  lines: ConfirmInvoiceLineInput[];
  metadata?: SuggestedInvoiceMetadataDTO;
}

export interface UploadInvoiceResultDTO {
  receipt: GoodsReceiptDTO;
  suggested_lines?: SuggestedInvoiceLineDTO[];
  suggested_metadata?: SuggestedInvoiceMetadataDTO;
  ai_extraction_failed?: boolean;
}
