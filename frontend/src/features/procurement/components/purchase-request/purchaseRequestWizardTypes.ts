import type { CreatePurchaseRequestInput, PurchaseRequestDTO } from '@ti-assistant/contracts';

export interface PurchaseRequestItemFormRow {
  key: string;
  description: string;
  quantity: number;
  unit: string;
  supply_id?: string;
}

export interface PurchaseRequestWizardForm {
  justification: string;
  chartOfAccountId: string;
  notes: string;
  items: PurchaseRequestItemFormRow[];
}

export function createEmptyItemRow(): PurchaseRequestItemFormRow {
  return {
    key: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unit: '',
  };
}

export function createEmptyWizardForm(): PurchaseRequestWizardForm {
  return {
    justification: '',
    chartOfAccountId: '',
    notes: '',
    items: [createEmptyItemRow()],
  };
}

export function wizardFormFromDto(dto: PurchaseRequestDTO): PurchaseRequestWizardForm {
  return {
    justification: dto.justification,
    chartOfAccountId: dto.chart_of_account_id,
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
  if (!form.justification.trim() || !form.chartOfAccountId) {
    return null;
  }

  const validItems = form.items.filter((item) => item.description.trim() && item.unit.trim());
  if (validItems.length === 0) {
    return null;
  }

  return {
    justification: form.justification.trim(),
    chart_of_account_id: form.chartOfAccountId,
    notes: form.notes.trim() || undefined,
    items: validItems.map((item) => ({
      description: item.description.trim(),
      quantity: item.quantity,
      unit: item.unit.trim(),
      supply_id: item.supply_id,
    })),
  };
}
