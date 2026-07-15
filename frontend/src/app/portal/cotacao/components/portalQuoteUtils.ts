import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  PortalQuoteInviteContextDTO,
  QuoteInviteStatus,
  SubmitProcurementProposalItemInput,
} from '@ti-assistant/contracts';

import { sumMoney } from '@/utils/money';

export { formatBRL } from '@/utils/money';

export const STATUS_LABELS: Record<QuoteInviteStatus, string> = {
  PENDING: 'Aguardando resposta',
  ACCEPTED: 'Participação confirmada',
  DECLINED: 'Recusado',
  RESPONDED: 'Proposta enviada',
  CORRECTION_REQUESTED: 'Correção solicitada',
  EXPIRED: 'Expirado',
};

export const STATUS_COLORS: Record<QuoteInviteStatus, string> = {
  PENDING: 'yellow',
  ACCEPTED: 'blue',
  DECLINED: 'red',
  RESPONDED: 'green',
  CORRECTION_REQUESTED: 'orange',
  EXPIRED: 'gray',
};

export const WORKFLOW_STEPS = [
  { key: 'PENDING', label: 'Convite' },
  { key: 'ACCEPTED', label: 'Proposta' },
  { key: 'RESPONDED', label: 'Enviada' },
] as const;

export function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

export function buildInitialItems(
  context: PortalQuoteInviteContextDTO,
): SubmitProcurementProposalItemInput[] {
  return context.items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price: 0,
    total_price: 0,
  }));
}

export function sumProposalItemsTotal(
  items: SubmitProcurementProposalItemInput[],
): number {
  return sumMoney(items.map((item) => item.total_price));
}

export function getWorkflowStepIndex(status: QuoteInviteStatus): number {
  if (status === 'PENDING' || status === 'EXPIRED') return 0;
  if (status === 'ACCEPTED' || status === 'DECLINED' || status === 'CORRECTION_REQUESTED')
    return 1;
  return 2;
}
