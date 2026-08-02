import { getGoodsReceipt } from '../support/api';
import { runGoodsReceipt, runProcurementHappyPath } from './flows/procurementHappyPath';

type DiscrepancyRow = {
  id: string;
  severity?: string;
  resolved_at?: string | null;
};

describe('procurement discrepancy bulk actions', () => {
  it('aceita divergências elegíveis em lote na etapa Divergências', () => {
    runProcurementHappyPath({
      stopAfter: 'order-accepted',
      finalizeReceipt: false,
    }).then(() => {
      runGoodsReceipt({
        invoiceFixture: 'nfe-divergence-alta.pdf',
        finalize: false,
        stopAtDiscrepancies: true,
      }).then((goodsReceiptId) => {
        cy.waitForText('Alta');
        cy.findByTestId('gr-discrepancy-select-all');
        cy.clickByTestId('gr-discrepancy-select-all');

        cy.findByTestId('gr-discrepancy-bulk-justification')
          .clear()
          .type('Justificativa E2E em lote');

        cy.findByTestId('gr-discrepancy-bulk-accept').should('be.enabled').click();

        cy.waitForText('Confirmar aceite');
        cy.clickByTestId('gr-discrepancy-bulk-confirm');

        cy.contains('Resolvida', { timeout: 30000 }).should('exist');

        getGoodsReceipt(goodsReceiptId).then((receipt) => {
          const discrepancies = receipt.discrepancies as DiscrepancyRow[];
          expect(discrepancies.length).to.be.greaterThan(0);

          const eligible = discrepancies.filter((d) => String(d.severity) !== 'CRITICAL');
          const critical = discrepancies.filter((d) => String(d.severity) === 'CRITICAL');

          expect(eligible.length).to.be.greaterThan(0);
          for (const d of eligible) {
            expect(d.resolved_at).to.be.ok;
          }
          for (const d of critical) {
            expect(d.resolved_at == null || d.resolved_at === '').to.eq(true);
          }
        });
      });
    });
  });
});
