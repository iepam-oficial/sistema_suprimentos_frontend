import type { PurchaseRequestPriority, PurchaseRequestStatus } from '../enums';
import type { ChartOfAccountDTO } from './finance.dto';
import type { UserDTO, UserRefDTO } from './user.dto';
export interface PurchaseRequestItemDTO {
    id: string;
    description: string;
    quantity: number;
    unit?: string | null;
    supply_id?: string | null;
    inventory_id?: string | null;
    sort_order: number;
}
export interface PurchaseRequestApprovalDTO {
    id: string;
    action: string;
    reason?: string | null;
    approved_by: UserRefDTO | UserDTO;
    approved_at: string;
}
export interface PurchaseRequestDTO {
    id: string;
    code: number;
    display_code: string;
    status: PurchaseRequestStatus;
    priority: PurchaseRequestPriority;
    justification: string;
    notes?: string | null;
    chart_of_account_id?: string | null;
    chart_of_account?: Pick<ChartOfAccountDTO, 'codigo' | 'nome'> | null;
    created_by: UserRefDTO | UserDTO;
    items: PurchaseRequestItemDTO[];
    approvals: PurchaseRequestApprovalDTO[];
    created_at: string;
    updated_at: string;
}
export interface ProcurementSettingsDTO {
    quote_response_days: number;
    allow_edit_approved_pr: boolean;
    ai_confidence_threshold: number;
    updated_at: string;
}
export interface CatalogSearchResultDTO {
    type: 'SUPPLY' | 'INVENTORY';
    id: string;
    label: string;
    description?: string | null;
    unit?: string | null;
}
export interface PurchaseRequestListQueryFilters {
    status?: PurchaseRequestStatus;
    created_by_id?: string;
    awaiting_quote?: boolean;
    priority?: PurchaseRequestPriority;
    created_from?: string;
    created_to?: string;
    page?: number;
    limit?: number;
}
export interface PurchaseRequestListResult {
    items: PurchaseRequestDTO[];
    total: number;
    page: number;
    limit: number;
}
export interface CatalogSearchOptions {
    scope?: 'supply' | 'all';
}
export interface CreatePurchaseRequestItemInput {
    description: string;
    quantity: number;
    unit?: string;
    supply_id?: string;
    inventory_id?: string;
}
export interface CreatePurchaseRequestInput {
    justification: string;
    priority?: PurchaseRequestPriority;
    notes?: string;
    /** @deprecated Ignored — COA is set on goods-receipt invoice lines */
    chart_of_account_id?: string;
    items: CreatePurchaseRequestItemInput[];
}
export interface UpdatePurchaseRequestInput {
    justification?: string;
    priority?: PurchaseRequestPriority;
    notes?: string;
    chart_of_account_id?: string;
    items?: CreatePurchaseRequestItemInput[];
}
export interface UpdatePurchaseRequestPriorityInput {
    priority: PurchaseRequestPriority;
}
export interface ApprovePurchaseRequestInput {
    reason?: string;
}
export interface RejectPurchaseRequestInput {
    reason: string;
}
export interface UpdateProcurementSettingsInput {
    quote_response_days?: number;
    allow_edit_approved_pr?: boolean;
    ai_confidence_threshold?: number;
}
//# sourceMappingURL=purchase-request.dto.d.ts.map