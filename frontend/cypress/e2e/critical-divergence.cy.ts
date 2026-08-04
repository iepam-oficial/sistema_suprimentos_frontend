import { getGoodsReceipt } from '../support/api';
import {
  runGoodsReceipt,
  runProcurementUntilOrderAccepted,
} from './flows/procurementHappyPath';

describe('critical divergence', () => {
  it('bloqueia finalização com divergência crítica', () => {
    runProcurementUntilOrderAccepted().then(() => {
      runGoodsReceipt({
        invoiceFixture: 'nfe-critical.pdf',
        finalize: false,
        expectCriticalBlocked: true,
      }).then((goodsReceiptId) => {
        getGoodsReceipt(goodsReceiptId).then((receipt) => {
          expect(receipt.status).to.not.match(/APPROVED/i);
          expect(
            receipt.discrepancies.some(
              (d) => String((d as { severity?: string }).severity) === 'CRITICAL',
            ),
          ).to.eq(true);
        });
      });
    });
  });
});
