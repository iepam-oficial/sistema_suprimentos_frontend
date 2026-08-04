import { getGoodsReceipt, getSupplyFiscal } from '../support/api';
import { E2E_ITEM_NCM } from '../support/constants';
import { runGoodsReceipt, runProcurementHappyPath } from './flows/procurementHappyPath';

describe('procurement NCM linkage on goods receipt', () => {
  it('NCM extraído da NF aparece na classificação e preenche o suprimento', () => {
    runProcurementHappyPath({
      stopAfter: 'order-accepted',
      finalizeReceipt: false,
    }).then(({ supplyId }) => {
      // The E2E supply is created without NCM (see ensureE2eSupply), so it starts empty.
      getSupplyFiscal(supplyId).then((fiscalBefore) => {
        expect(fiscalBefore.ncm_id).to.eq(null);
      });

      runGoodsReceipt({
        invoiceFixture: 'nfe-sample.pdf',
        finalize: true,
        onClassificationReady: () => {
          // NCM extracted from the invoice (via the stub AI adapter) matches the active
          // FiscalNcm catalog entry, so it should be auto-resolved and flagged as "Vindo da NF".
          cy.waitForText('Vindo da NF');
        },
      }).then((goodsReceiptId) => {
        getGoodsReceipt(goodsReceiptId).then((receipt) => {
          expect(receipt.status).to.match(/APPROVED|FINALIZED/i);
          expect(receipt.invoiceLines.length).to.be.greaterThan(0);
          const [line] = receipt.invoiceLines;
          expect(line.ncm_from_invoice).to.eq(E2E_ITEM_NCM);
          expect(line.ncm_id).to.be.ok;
          expect(line.fiscalNcm?.code).to.eq(E2E_ITEM_NCM);
        });

        // Supply had no NCM before the receipt: the classify step must fill it from the line.
        getSupplyFiscal(supplyId).then((fiscalAfter) => {
          expect(fiscalAfter.ncm_id).to.be.ok;
          expect(fiscalAfter.fiscalNcm?.code).to.eq(E2E_ITEM_NCM);
        });
      });
    });
  });
});
