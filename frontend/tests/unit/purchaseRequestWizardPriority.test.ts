import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import {
  buildPurchaseRequestPayload,
  createEmptyWizardForm,
  wizardFormFromDto,
  type PurchaseRequestWizardForm,
} from '@/features/procurement/components/purchase-request/purchaseRequestWizardTypes';

function validForm(overrides: Partial<PurchaseRequestWizardForm> = {}): PurchaseRequestWizardForm {
  return {
    ...createEmptyWizardForm(),
    justification: 'Necessidade operacional',
    destination: 'Almoxarifado Central',
    delivery_deadline: '2099-12-31',
    items: [
      {
        key: 'item-1',
        description: 'Papel A4',
        quantity: 10,
        unit: 'UN',
      },
    ],
    ...overrides,
  };
}

function dtoWithPriority(priority: PurchaseRequestDTO['priority']): PurchaseRequestDTO {
  return {
    id: 'pr-1',
    code: 1,
    display_code: 'SC-0001',
    status: 'DRAFT',
    priority,
    justification: 'Compra urgente de insumos',
    notes: null,
    destination: 'Almoxarifado Central',
    delivery_deadline: '2099-12-31',
    created_by: { id: 'u1', name: 'Ana', email: 'ana@test.com', role: 'MANAGER' },
    items: [
      {
        id: 'it-1',
        description: 'Papel A4',
        quantity: 10,
        unit: 'UN',
        supply_id: null,
        inventory_id: null,
        sort_order: 0,
        abc_classification: null,
      },
    ],
    approvals: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('wizard form priority (MGRSC-04)', () => {
  it('createEmptyWizardForm defaults priority to MEDIUM', () => {
    expect(createEmptyWizardForm().priority).toBe('MEDIUM');
  });

  it('wizardFormFromDto copies dto.priority', () => {
    expect(wizardFormFromDto(dtoWithPriority('URGENT')).priority).toBe('URGENT');
    expect(wizardFormFromDto(dtoWithPriority('LOW')).priority).toBe('LOW');
  });
});

describe('buildPurchaseRequestPayload priority (MGRSC-04)', () => {
  it('omits priority by default so coordinator does not send it', () => {
    const payload = buildPurchaseRequestPayload(validForm({ priority: 'HIGH' }));
    expect(payload).not.toBeNull();
    expect(payload && 'priority' in payload).toBe(false);
  });

  it('includes form.priority when includePriority is true', () => {
    const payload = buildPurchaseRequestPayload(validForm({ priority: 'HIGH' }), {
      includePriority: true,
    });
    expect(payload).not.toBeNull();
    expect(payload?.priority).toBe('HIGH');
  });
});
