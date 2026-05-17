import { SupportTicket } from '@/app/(dashboard)/support-tickets/types';

export function computeTicketStats(tickets: SupportTicket[]) {
  const open = tickets.filter((t) => t.status === 'OPEN').length;
  const progress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolved = tickets.filter((t) => t.status === 'RESOLVED').length;
  return { total: tickets.length, open, progress, resolved };
}
