import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildPurchaseRequestPayload,
  createEmptyWizardForm,
  type PurchaseRequestWizardForm,
} from '@/features/procurement/components/purchase-request/purchaseRequestWizardTypes';

const COA_SOURCE_PATTERNS = [
  /chart_of_account/i,
  /chartOfAccount/,
  /Plano de contas/i,
];

function readUiSource(relativePath: string): string {
  return readFileSync(
    join(__dirname, '../../src/features/procurement/components/purchase-request', relativePath),
    'utf8',
  );
}

describe('SC surfaces sem plano de contas (COAR-01)', () => {
  describe('AC1 — payload/validação do wizard não exige COA', () => {
    it('buildPurchaseRequestPayload omite chart_of_account_id', () => {
      const form: PurchaseRequestWizardForm = {
        ...createEmptyWizardForm(),
        justification: 'Necessidade operacional',
        items: [
          {
            key: 'item-1',
            description: 'Papel A4',
            quantity: 10,
            unit: 'UN',
          },
        ],
      };

      const payload = buildPurchaseRequestPayload(form);
      expect(payload).not.toBeNull();
      expect(payload && 'chart_of_account_id' in payload).toBe(false);
      expect(JSON.stringify(payload)).not.toMatch(/chart_of_account/i);
    });

    it('buildPurchaseRequestPayload valida só justificativa e itens (sem COA)', () => {
      expect(
        buildPurchaseRequestPayload({
          justification: '',
          notes: '',
          items: [{ key: '1', description: 'Item', quantity: 1, unit: 'UN' }],
        }),
      ).toBeNull();

      expect(
        buildPurchaseRequestPayload({
          justification: 'Ok',
          notes: '',
          items: [{ key: '1', description: '', quantity: 1, unit: '' }],
        }),
      ).toBeNull();

      const valid = buildPurchaseRequestPayload({
        justification: 'Ok',
        notes: '',
        items: [{ key: '1', description: 'Item', quantity: 1, unit: 'UN' }],
      });
      expect(valid).not.toBeNull();
      expect(valid).toEqual({
        justification: 'Ok',
        notes: undefined,
        items: [{ description: 'Item', quantity: 1, unit: 'UN', supply_id: undefined }],
      });
    });
  });

  describe('AC4 — listagem/resumo não exibem plano de contas', () => {
    it.each([
      'PurchaseRequestWizardStepGeneral.tsx',
      'PurchaseRequestListTable.tsx',
      'PurchaseRequestSummaryPanel.tsx',
    ])('%s não referencia plano de contas', (fileName) => {
      const source = readUiSource(fileName);
      for (const pattern of COA_SOURCE_PATTERNS) {
        expect(source).not.toMatch(pattern);
      }
    });
  });
});
