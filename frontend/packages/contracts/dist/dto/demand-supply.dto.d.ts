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