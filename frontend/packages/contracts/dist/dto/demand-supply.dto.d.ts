import type { DemandSupplyAggregateStatus, DemandSupplyApprovalAction } from '../enums';
import type { LocationRefDTO } from './reference-data.dto';
import type { SupplyRequestDTO } from './supply-request.dto';
import type { UserRefDTO } from './user.dto';
export interface DemandSupplySummaryDTO {
    id: string;
    code: number;
    demand_supply_code: string;
    user: UserRefDTO;
    destination: string;
    delivery_deadline: string;
    purchase_request_id?: string | null;
    aggregate_status: DemandSupplyAggregateStatus;
    total_items: number;
    decided_items: number;
    sector?: {
        id: string;
        name: string;
    } | null;
    location?: LocationRefDTO | null;
    locale?: {
        id: string;
        name: string;
    } | null;
    created_at: string;
    updated_at: string;
}
/** List/query filters for demand-supplies; SC-origin queue uses purchase_request_id / origin. */
export interface DemandSupplyListQueryFilters {
    user_id?: string;
    sector_id?: string;
    location_id?: string;
    locale_id?: string;
    search?: string;
    delivery_deadline_from?: string;
    delivery_deadline_to?: string;
    /** When set, only demand-supplies linked to this purchase request */
    purchase_request_id?: string;
    /** `purchase_request` / `sc` → only rows with purchase_request_id not null */
    origin?: 'purchase_request' | 'sc';
    page?: number;
    limit?: number;
}
export interface DemandSupplyApprovalDTO {
    id: string;
    demand_supply_id: string;
    sequence: number;
    action: DemandSupplyApprovalAction;
    report_id: string;
    approved_at: string;
    approved_by: UserRefDTO;
    item_count: number;
    items?: SupplyRequestDTO[];
}
export interface DemandSupplyDetailDTO extends DemandSupplySummaryDTO {
    items: SupplyRequestDTO[];
    approvals: DemandSupplyApprovalDTO[];
}
export interface DeliveryReportItemDTO {
    name: string;
    quantity: number;
    unit: string;
}
export interface DeliveryReportPayloadDTO {
    report_id: string;
    demand_supply_code: string;
    approved_at: string;
    approver: {
        name: string;
    };
    requester: {
        name: string;
        sector?: string;
        location?: string;
    };
    destination: string;
    locale?: string;
    delivery_deadline: string;
    items: DeliveryReportItemDTO[];
}
//# sourceMappingURL=demand-supply.dto.d.ts.map