/** Ordem dos campos do modal de alocação (IADD-01). */
export const ALLOCATION_MODAL_FIELD_ORDER = [
  'delivery_deadline',
  'return_date',
  'destination',
  'notes',
] as const;

export type AllocationModalField = (typeof ALLOCATION_MODAL_FIELD_ORDER)[number];

export type OverdueBadgeKind = 'atrasado' | 'ja_atrasou' | null;

export function todayIsoDate(now: Date = new Date()): string {
  return now.toISOString().split('T')[0];
}

/** Default civil: hoje + N dias (IADD-02 usa 7). */
export function addDaysIsoDate(days: number, now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function defaultDeliveryDeadlineIso(now: Date = new Date()): string {
  return addDaysIsoDate(7, now);
}

export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toISOString().split('T')[0];
}

/** Prazo é obrigatório para confirmar (IADD-03). */
export function isAllocationConfirmEnabled(input: {
  deliveryDeadline: string;
  returnDate: string;
  destination: string;
}): boolean {
  return Boolean(input.deliveryDeadline && input.returnDate && input.destination);
}

/** Prazo ≥ hoje e ≤ devolução quando devolução existe (IADD-07). */
export function isDeliveryDeadlineInBounds(
  deadline: string,
  today: string,
  returnDate?: string
): boolean {
  if (!deadline) return false;
  if (deadline < today) return false;
  if (returnDate && deadline > returnDate) return false;
  return true;
}

/** Devolução não pode ser anterior ao prazo (IADD-08/09). */
export function isReturnDateAllowed(returnDate: string, deliveryDeadline: string): boolean {
  if (!returnDate || !deliveryDeadline) return true;
  return returnDate >= deliveryDeadline;
}

/** Ao mudar prazo acima da devolução, limpar devolução (edge). */
export function shouldClearReturnDateOnDeadlineChange(
  deadline: string,
  returnDate: string
): boolean {
  return Boolean(deadline && returnDate && returnDate < deadline);
}

/** Antecipar devolução abaixo do prazo → bloquear (IADD-09). */
export function shouldBlockReturnDateChange(
  returnDate: string,
  deliveryDeadline: string
): boolean {
  return Boolean(deliveryDeadline && returnDate && returnDate < deliveryDeadline);
}

export function canSubmitAllocationDates(input: {
  deliveryDeadline: string;
  returnDate: string;
  today: string;
}): boolean {
  if (!input.deliveryDeadline || !input.returnDate) return false;
  if (!isDeliveryDeadlineInBounds(input.deliveryDeadline, input.today, input.returnDate)) {
    return false;
  }
  return isReturnDateAllowed(input.returnDate, input.deliveryDeadline);
}

/** Badge UI a partir dos flags do DTO (IADD-14..16). */
export function getOverdueBadgeKind(flags: {
  is_overdue?: boolean | null;
  was_ever_overdue?: boolean | null;
}): OverdueBadgeKind {
  if (flags.is_overdue) return 'atrasado';
  if (flags.was_ever_overdue) return 'ja_atrasou';
  return null;
}

/** Filtro "atrasadas" só inclui is_overdue (IADD-17). */
export function matchesOverdueFilter(
  isOverdue: boolean | null | undefined,
  overdueFilter: boolean
): boolean {
  if (!overdueFilter) return true;
  return Boolean(isOverdue);
}

export type ExtendDeadlineValidation =
  | { ok: true }
  | {
      ok: false;
      reason: 'not_after_current' | 'before_today' | 'after_return' | 'missing';
    };

/** Bounds de prorrogação na UI (IADD-21). */
export function validateExtendDeadline(input: {
  newDeadline: string;
  currentDeadline: string;
  today: string;
  returnDate?: string;
}): ExtendDeadlineValidation {
  if (!input.newDeadline) return { ok: false, reason: 'missing' };
  if (input.newDeadline <= input.currentDeadline) {
    return { ok: false, reason: 'not_after_current' };
  }
  if (input.newDeadline < input.today) {
    return { ok: false, reason: 'before_today' };
  }
  if (input.returnDate && input.newDeadline > input.returnDate) {
    return { ok: false, reason: 'after_return' };
  }
  return { ok: true };
}

/** min do date picker de prorrogação: max(hoje, current+1). */
export function extendDeadlineMinIso(currentDeadline: string, today: string): string {
  if (!currentDeadline) return today;
  const nextDay = new Date(currentDeadline + 'T00:00:00');
  nextDay.setDate(nextDay.getDate() + 1);
  const minFromCurrent = nextDay.toISOString().split('T')[0];
  return minFromCurrent > today ? minFromCurrent : today;
}
