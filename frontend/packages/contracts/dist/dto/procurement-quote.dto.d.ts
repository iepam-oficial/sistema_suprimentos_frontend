import type { PurchaseRequestPriority } from '../enums';
import type { ProcurementQuoteEventType, ProcurementQuoteStatus, ProposalReviewAction, ProposalReviewStatus, QuoteInviteStatus } from '../enums';
import type { SupplierRefDTO } from './catalog.dto';
import type { PurchaseRequestItemDTO } from './purchase-request.dto';
import type { UserRefDTO } from './user.dto';
export interface ProcurementQuoteProposalItemDTO {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}
export interface ProposalPaymentMethodDTO {
    code: string;
    label: string;
    requires_boleto_terms: boolean;
}
export interface PaymentMethodDTO {
    id?: string;
    code: string;
    label: string;
    requires_boleto_terms: boolean;
    active?: boolean;
    sort_order?: number;
}
export interface ProcurementQuoteProposalDTO {
    id: string;
    invite_id: string;
    total_value: number;
    delivery_days: number;
    payment_days: number;
    freight: number;
    taxes: number;
    proposal_pdf_key?: string | null;
    proposal_pdf_url?: string | null;
    submitted_at: string;
    items: ProcurementQuoteProposalItemDTO[];
    payment_methods?: ProposalPaymentMethodDTO[];
    boleto_grace_days?: number | null;
    boleto_installments?: number | null;
}
export interface ProposalCorrectionRequestDTO {
    message: string;
    flagged_items: ProcurementQuoteProposalItemDTO[];
}
export interface ProcurementQuoteProposalReviewDTO {
    id: string;
    invite_id: string;
    action: ProposalReviewAction;
    message?: string | null;
    flagged_item_ids: string[];
    flagged_items?: ProcurementQuoteProposalItemDTO[];
    reviewed_by: UserRefDTO;
    created_at: string;
}
export interface ProcurementQuoteInviteDTO {
    id: string;
    procurement_quote_id: string;
    supplier_id: string;
    status: QuoteInviteStatus;
    expires_at: string;
    decline_reason?: string | null;
    sent_at?: string | null;
    first_accessed_at?: string | null;
    created_at: string;
    supplier?: SupplierRefDTO;
    proposal?: ProcurementQuoteProposalDTO | null;
    proposal_review_status?: ProposalReviewStatus | null;
    pending_correction?: ProposalCorrectionRequestDTO | null;
}
export interface ProcurementQuoteRankingDTO {
    id: string;
    procurement_quote_id: string;
    invite_id: string;
    rank: number;
    score_price: number;
    score_delivery: number;
    score_payment: number;
    score_freight: number;
    score_taxes: number;
    total_score: number;
    computed_at: string;
    invite?: ProcurementQuoteInviteDTO;
}
export interface ProcurementQuotePurchaseRequestRefDTO {
    id: string;
    display_code: string;
    justification: string;
    priority: PurchaseRequestPriority;
    items: PurchaseRequestItemDTO[];
    created_by: UserRefDTO;
}
export interface ProcurementQuoteDTO {
    id: string;
    code: number;
    display_code: string;
    purchase_request_id: string;
    status: ProcurementQuoteStatus;
    response_deadline: string;
    notes?: string | null;
    created_by_id: string;
    winner_invite_id?: string | null;
    winner_justification?: string | null;
    approved_by_id?: string | null;
    approved_at?: string | null;
    closed_at?: string | null;
    created_at: string;
    updated_at: string;
    created_by?: UserRefDTO;
    approved_by?: UserRefDTO | null;
    purchase_request?: ProcurementQuotePurchaseRequestRefDTO;
    invites?: ProcurementQuoteInviteDTO[];
    rankings?: ProcurementQuoteRankingDTO[];
    winner_invite?: ProcurementQuoteInviteDTO | null;
    selected_payment_method_code?: string | null;
    selected_payment_method_label?: string | null;
    selected_payment_by_user_id?: string | null;
    selected_payment_at?: string | null;
}
export interface CreateProcurementQuoteInput {
    purchase_request_id: string;
    supplier_ids: string[];
    notes?: string;
    response_deadline?: string;
}
export interface ApproveProcurementQuoteInput {
    winner_invite_id: string;
    winner_justification?: string;
}
export interface DeclineQuoteInviteInput {
    reason?: string;
}
export interface SubmitProcurementProposalItemInput {
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}
export interface SubmitProcurementProposalInput {
    total_value: number;
    delivery_days: number;
    /** @deprecated Prefer payment_method_codes + boleto_*; synced from boleto_grace_days when present */
    payment_days?: number;
    freight?: number;
    taxes?: number;
    items: SubmitProcurementProposalItemInput[];
    payment_method_codes: string[];
    boleto_grace_days?: number | null;
    boleto_installments?: number | null;
}
export interface PortalQuoteItemDTO {
    description: string;
    quantity: number;
    unit?: string | null;
}
export interface ProcurementQuoteEventDTO {
    id: string;
    procurement_quote_id: string;
    invite_id?: string | null;
    event_type: ProcurementQuoteEventType;
    metadata?: Record<string, unknown> | null;
    created_at: string;
    supplier_name?: string | null;
}
export interface PortalQuotePdfSuggestionsDTO {
    total_value?: number;
    delivery_days?: number;
    payment_days?: number;
    freight?: number;
    taxes?: number;
    items?: SubmitProcurementProposalItemInput[];
}
export interface PortalQuoteInviteContextDTO {
    invite_id: string;
    status: QuoteInviteStatus;
    expires_at: string;
    response_deadline: string;
    supplier_name: string;
    quote_display_code: string;
    purchase_request_display_code: string;
    items: PortalQuoteItemDTO[];
    proposal?: ProcurementQuoteProposalDTO | null;
    ai_extraction_available: boolean;
    correction_request?: ProposalCorrectionRequestDTO | null;
    available_payment_methods: PaymentMethodDTO[];
}
export interface CreatePaymentMethodInput {
    code: string;
    label: string;
    requires_boleto_terms?: boolean;
    sort_order?: number;
}
export interface UpdatePaymentMethodInput {
    label?: string;
    requires_boleto_terms?: boolean;
    sort_order?: number;
}
export interface SetQuoteSelectedPaymentMethodInput {
    payment_method_code: string;
}
export interface RequestProposalCorrectionInput {
    message: string;
    flagged_item_ids?: string[];
}
export interface CloseProcurementQuoteInput {
    confirm_exclude_pending?: boolean;
}
//# sourceMappingURL=procurement-quote.dto.d.ts.map