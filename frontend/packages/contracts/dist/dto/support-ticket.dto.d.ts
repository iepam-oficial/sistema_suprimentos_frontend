import type { UserRefDTO } from './user.dto';
export declare const TicketStatus: {
    readonly OPEN: "OPEN";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly RESOLVED: "RESOLVED";
    readonly CLOSED: "CLOSED";
};
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];
export declare const PriorityLevel: {
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
    readonly URGENT: "URGENT";
};
export type PriorityLevel = (typeof PriorityLevel)[keyof typeof PriorityLevel];
export declare const SupportTicketKind: {
    readonly INCIDENT: "INCIDENT";
    readonly SERVICE_REQUEST: "SERVICE_REQUEST";
    readonly QUESTION: "QUESTION";
    readonly OTHER: "OTHER";
};
export type SupportTicketKind = (typeof SupportTicketKind)[keyof typeof SupportTicketKind];
/** @deprecated Use UserRefDTO from user.dto */
export type TicketUserRefDTO = UserRefDTO;
export interface TicketLocationRefDTO {
    id: string;
    name: string;
}
export interface TicketSectorRefDTO {
    id: string;
    name: string;
}
export interface SupportTicketDTO {
    id: string;
    subject: string;
    description: string;
    status: TicketStatus;
    priority: PriorityLevel;
    ticket_type: SupportTicketKind;
    requester_id: string;
    assigned_to_id: string | null;
    location_id: string | null;
    sector_id: string | null;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
    image_url?: string | null;
    requester?: TicketUserRefDTO;
    assigned_to?: TicketUserRefDTO | null;
    location?: TicketLocationRefDTO | null;
    sector?: TicketSectorRefDTO | null;
}
export interface CreateSupportTicketInput {
    subject: string;
    description: string;
    ticket_type: SupportTicketKind;
    status?: TicketStatus;
    priority?: PriorityLevel;
    requester_id?: string;
    assigned_to_id?: string | null;
    location_id?: string | null;
    sector_id?: string | null;
    image_url?: string;
}
export interface UpdateSupportTicketInput {
    subject?: string;
    description?: string;
    status?: TicketStatus;
    priority?: PriorityLevel;
    assigned_to_id?: string | null;
    location_id?: string | null;
    sector_id?: string | null;
    ticket_type?: SupportTicketKind;
}
//# sourceMappingURL=support-ticket.dto.d.ts.map