import type { CreatePurchaseRequestInput, PurchaseRequestDTO } from '@ti-assistant/contracts';
import { createClientKey } from '@/utils/clientKey';

export interface PurchaseRequestItemFormRow {
  key: string;
  description: string;
  quantity: number;
  unit: string;
  supply_id?: string;
}

export interface PurchaseRequestWizardForm {
  justification: string;
  notes: string;
  items: PurchaseRequestItemFormRow[];
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
    notes: '',
    items: [createEmptyItemRow()],
  };
}

export function wizardFormFromDto(dto: PurchaseRequestDTO): PurchaseRequestWizardForm {
  return {
    justification: dto.justification,
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

  const validItems = form.items.filter((item) => item.description.trim() && item.unit.trim());
  if (validItems.length === 0) {
    return null;
  }

  return {
    justification: form.justification.trim(),
    notes: form.notes.trim() || undefined,
    items: validItems.map((item) => ({
      description: item.description.trim(),
      quantity: item.quantity,
      unit: item.unit.trim(),
      supply_id: item.supply_id,
    })),
  };
}
