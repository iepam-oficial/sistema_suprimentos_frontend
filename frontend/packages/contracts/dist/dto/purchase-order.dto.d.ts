import type { PurchaseOrderStatus } from '../enums';
import type { SupplierRefDTO } from './catalog.dto';
export interface PurchaseOrderItemDTO {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    pr_item_id?: string | null;
}
export interface PurchaseOrderDTO {
    id: string;
    code: number;
    display_code: string;
    procurement_quote_id: string;
    invite_id: string;
    status: PurchaseOrderStatus;
    expires_at: string;
    decline_reason?: string | null;
    sent_at?: string | null;
    responded_at?: string | null;
    created_at: string;
    items: PurchaseOrderItemDTO[];
    supplier?: SupplierRefDTO;
    quote_display_code?: string;
    payment_method_code?: string | null;
    payment_method_label?: string | null;
    boleto_grace_days?: number | null;
    boleto_installments?: number | null;
}
export interface CreatePurchaseOrderInput {
    procurement_quote_id: string;
    payment_method_code?: string;
}
export interface PurchaseOrderListResult {
    items: PurchaseOrderDTO[];
    total: number;
    page: number;
    limit: number;
}
export interface PortalPurchaseOrderContextDTO {
    purchase_order_id: string;
    status: PurchaseOrderStatus;
    expires_at: string;
    display_code: string;
    supplier_name: string;
    quote_display_code: string;
    total_value: number;
    delivery_days: number;
    payment_days: number;
    items: PurchaseOrderItemDTO[];
}
export interface RespondPurchaseOrderInput {
    action: 'accept' | 'decline';
    reason?: string;
}
//# sourceMappingURL=purchase-order.dto.d.ts.map