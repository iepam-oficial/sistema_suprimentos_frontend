import type { SupportTicketDTO } from '@ti-assistant/contracts';
import { hasAnyRole } from '@ti-assistant/contracts/dist/roles';

export type {
  TicketStatus,
  PriorityLevel,
  SupportTicketKind,
  TicketUserRefDTO,
  TicketLocationRefDTO,
  TicketSectorRefDTO,
  SupportTicketDTO,
  CreateSupportTicketInput,
  UpdateSupportTicketInput,
} from '@ti-assistant/contracts';

export type SupportTicket = SupportTicketDTO;

export const ROLES_TICKETS_VIEW = [
  'EMPLOYEE',
  'ORGANIZER',
  'SUPPORT',
  'ADMIN',
  'MANAGER',
  'TECHNICIAN',
  'COORDINATOR',
] as const;

export const ROLES_TICKETS_CREATE = [
  'EMPLOYEE',
  'ORGANIZER',
  'SUPPORT',
  'ADMIN',
  'MANAGER',
  'COORDINATOR',
] as const;

export function canViewSupportTickets(roles: readonly string[]): boolean {
  return hasAnyRole(roles, ...(ROLES_TICKETS_VIEW as readonly string[]));
}

export function canCreateSupportTicket(roles: readonly string[]): boolean {
  return hasAnyRole(roles, ...(ROLES_TICKETS_CREATE as readonly string[]));
}

const ROLES_ADMIN_SUPPORT_DESK = ['ADMIN', 'MANAGER'] as const;

export function canUseAdminSupportDesk(roles: readonly string[]): boolean {
  return hasAnyRole(roles, ...(ROLES_ADMIN_SUPPORT_DESK as readonly string[]));
}

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

export function formatTicketDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: DISPLAY_TIMEZONE });
}

export function shortTicketId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function ticketMatchesSearch(ticket: SupportTicket, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    ticket.subject,
    ticket.description,
    ticket.id,
    shortTicketId(ticket.id),
    ticket.requester?.name,
    ticket.requester?.email,
    ticket.assigned_to?.name,
    ticket.location?.name,
    ticket.sector?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}
