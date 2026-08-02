import { getGoodsReceipt } from '../support/api';
import {
  runGoodsReceipt,
  runProcurementHappyPath,
} from './flows/procurementHappyPath';

describe('procurement inline supply registration', () => {
  it('cadastra suprimento na classificação e finaliza recebimento', () => {
    runProcurementHappyPath({
      stopAfter: 'order-accepted',
      finalizeReceipt: false,
    }).then(() => {
      runGoodsReceipt({
        invoiceFixture: 'nfe-sample.pdf',
        finalize: true,
        inlineCreateSupply: true,
      }).then((goodsReceiptId) => {
        getGoodsReceipt(goodsReceiptId).then((receipt) => {
          expect(receipt.status).to.match(/APPROVED|FINALIZED/i);
        });
      });
    });
  });
});
