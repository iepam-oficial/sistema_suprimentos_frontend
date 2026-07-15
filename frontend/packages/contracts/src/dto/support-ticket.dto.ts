import type { UserRefDTO } from './user.dto';

export const TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const PriorityLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type PriorityLevel = (typeof PriorityLevel)[keyof typeof PriorityLevel];

export const SupportTicketKind = {
  INCIDENT: 'INCIDENT',
  SERVICE_REQUEST: 'SERVICE_REQUEST',
  QUESTION: 'QUESTION',
  OTHER: 'OTHER',
} as const;

export type SupportTicketKind =
  (typeof SupportTicketKind)[keyof typeof SupportTicketKind];

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
