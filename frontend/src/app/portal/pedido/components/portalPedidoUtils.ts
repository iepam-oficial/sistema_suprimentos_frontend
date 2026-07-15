import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PurchaseOrderStatus } from '@ti-assistant/contracts';

export { formatBRL } from '@/utils/money';

export const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Aguardando resposta',
  ACCEPTED: 'Aceito',
  DECLINED: 'Recusado',
  CANCELLED: 'Cancelado',
};

export const STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'gray',
  SENT: 'yellow',
  ACCEPTED: 'green',
  DECLINED: 'red',
  CANCELLED: 'gray',
};

export function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}
