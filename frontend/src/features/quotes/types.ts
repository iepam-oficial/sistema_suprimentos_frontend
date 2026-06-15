import type { QuoteStatus } from '@ti-assistant/contracts';

export type {
  CreateQuoteInput,
  CreateQuoteItemInput,
  QuoteDTO,
  QuoteItemDTO,
  QuoteStatus,
  SmartQuoteDTO,
  SmartQuoteItemDTO,
  UpdateQuoteInput,
  UpdateQuoteItemInput,
} from '@ti-assistant/contracts';

export type Quote = import('@ti-assistant/contracts').QuoteDTO;
export type SmartQuote = import('@ti-assistant/contracts').SmartQuoteDTO;

export function quoteStatusLabel(status: QuoteStatus | string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendente',
    APPROVED: 'Aprovada',
    REJECTED: 'Rejeitada',
    CANCELLED: 'Cancelada',
  };
  return labels[status] ?? status;
}

export function quoteStatusColor(status: QuoteStatus | string): string {
  const colors: Record<string, string> = {
    PENDING: 'yellow',
    APPROVED: 'green',
    REJECTED: 'red',
    CANCELLED: 'gray',
  };
  return colors[status] ?? 'gray';
}

export function getSupplierName(quote: { supplier?: { name?: string }; supplier_id?: string }): string {
  return quote.supplier?.name ?? quote.supplier_id ?? '—';
}
