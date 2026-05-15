export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type SupportTicketKind = 'INCIDENT' | 'SERVICE_REQUEST' | 'QUESTION' | 'OTHER';

export interface TicketUserRef {
  id: string;
  name: string;
  email?: string;
}

export interface TicketLocationRef {
  id: string;
  name: string;
}

export interface TicketSectorRef {
  id: string;
  name: string;
}

export interface SupportTicket {
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
  requester?: TicketUserRef;
  assigned_to?: TicketUserRef | null;
  location?: TicketLocationRef | null;
  sector?: TicketSectorRef | null;
}

export const ROLES_TICKETS_VIEW = [
  'EMPLOYEE',
  'ORGANIZER',
  'SUPPORT',
  'ADMIN',
  'MANAGER',
  'TECHNICIAN',
] as const;

export const ROLES_TICKETS_CREATE = [
  'EMPLOYEE',
  'ORGANIZER',
  'SUPPORT',
  'ADMIN',
  'MANAGER',
] as const;

export function canViewSupportTickets(role: string): boolean {
  return (ROLES_TICKETS_VIEW as readonly string[]).includes(role);
}

export function canCreateSupportTicket(role: string): boolean {
  return (ROLES_TICKETS_CREATE as readonly string[]).includes(role);
}

const ROLES_TICKETS_KANBAN = ['ADMIN', 'MANAGER'] as const;

/** Vista em quadro (Kanban) na listagem de chamados. */
export function canUseSupportTicketsKanban(role: string): boolean {
  return (ROLES_TICKETS_KANBAN as readonly string[]).includes(role);
}

/** Timezone exibido nas datas da lista (evita drift servidor vs cliente). */
export const DISPLAY_TIMEZONE = 'America/Belem';

export const STATUS_COLOR_SCHEME: Record<string, string> = {
  OPEN: 'blue',
  IN_PROGRESS: 'orange',
  RESOLVED: 'green',
};

export const PRIORITY_COLOR_SCHEME: Record<string, string> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

export const TICKET_TYPE_COLOR_SCHEME: Record<string, string> = {
  INCIDENT: 'red',
  SERVICE_REQUEST: 'blue',
  QUESTION: 'cyan',
  OTHER: 'gray',
};

export function ticketStatusColorScheme(status: string): string {
  return STATUS_COLOR_SCHEME[status] ?? 'gray';
}

export function ticketPriorityColorScheme(priority: string): string {
  return PRIORITY_COLOR_SCHEME[priority] ?? 'gray';
}

export function ticketTypeColorScheme(kind: string): string {
  return TICKET_TYPE_COLOR_SCHEME[kind] ?? 'gray';
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'Aberto';
    case 'IN_PROGRESS':
      return 'Em andamento';
    case 'RESOLVED':
      return 'Resolvido';
    default:
      return status;
  }
}

export function priorityLabel(priority: string): string {
  switch (priority) {
    case 'LOW':
      return 'Baixa';
    case 'MEDIUM':
      return 'Média';
    case 'HIGH':
      return 'Alta';
    case 'URGENT':
      return 'Urgente';
    default:
      return priority;
  }
}

export function ticketTypeLabel(kind: string): string {
  switch (kind) {
    case 'INCIDENT':
      return 'Incidente';
    case 'SERVICE_REQUEST':
      return 'Requisição de serviço';
    case 'QUESTION':
      return 'Dúvida / informação';
    case 'OTHER':
      return 'Outro';
    default:
      return kind;
  }
}

/** Formata instante ISO para exibição consistente no Pará. */
export function formatTicketDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: DISPLAY_TIMEZONE });
}
