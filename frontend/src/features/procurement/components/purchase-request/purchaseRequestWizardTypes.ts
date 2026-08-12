import type { CreatePurchaseRequestInput, PurchaseRequestDTO } from '@ti-assistant/contracts';
import { createClientKey } from '@/utils/clientKey';
import { todayLocalIsoDate } from '@/utils/civilDate';

export { todayLocalIsoDate } from '@/utils/civilDate';

export interface PurchaseRequestItemFormRow {
  key: string;
  description: string;
  quantity: number;
  unit: string;
  supply_id?: string;
}

export interface PurchaseRequestWizardForm {
  justification: string;
  destination: string;
  delivery_deadline: string;
  notes: string;
  items: PurchaseRequestItemFormRow[];
}

export function isDeliveryDeadlineOnOrAfterToday(
  deadline: string,
  now: Date = new Date(),
): boolean {
  const value = deadline.trim();
  if (!value) return false;
  return value >= todayLocalIsoDate(now);
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return value.slice(0, 10);
}

export function createEmptyItemRow(): PurchaseRequestItemFormRow {
  return {
    key: createClientKey(),
    description: '',
    quantity: 1,
    unit: '',
  };
}

export function createEmptyWizardForm(): PurchaseRequestWizardForm {
  return {
    justification: '',
    destination: '',
    delivery_deadline: '',
    notes: '',
    items: [createEmptyItemRow()],
  };
}

export function wizardFormFromDto(dto: PurchaseRequestDTO): PurchaseRequestWizardForm {
  return {
    justification: dto.justification,
    destination: dto.destination ?? '',
    delivery_deadline: toDateInputValue(dto.delivery_deadline),
    notes: dto.notes ?? '',
    items: dto.items.length
      ? dto.items.map((item) => ({
          key: item.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit ?? '',
          supply_id: item.supply_id ?? undefined,
        }))
      : [createEmptyItemRow()],
  };
}

export function buildPurchaseRequestPayload(
  form: PurchaseRequestWizardForm,
): CreatePurchaseRequestInput | null {
  if (!form.justification.trim()) {
    return null;
  }

  const destination = form.destination.trim();
  const deliveryDeadline = form.delivery_deadline.trim();
  if (!destination || !deliveryDeadline) {
    return null;
  }

  const validItems = form.items.filter((item) => item.description.trim() && item.unit.trim());
  if (validItems.length === 0) {
    return null;
  }

  return {
    justification: form.justification.trim(),
    destination,
    delivery_deadline: deliveryDeadline,
    notes: form.notes.trim() || undefined,
    items: validItems.map((item) => ({
      description: item.description.trim(),
      quantity: item.quantity,
      unit: item.unit.trim(),
      supply_id: item.supply_id,
    })),
  };
}
