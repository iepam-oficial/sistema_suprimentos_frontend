import { getGoodsReceipt, getSupplyBalance } from '../support/api';
import { runProcurementHappyPath } from './flows/procurementHappyPath';

describe('procurement divergence alta', () => {
  it('autoriza divergência alta e finaliza com lote', () => {
    runProcurementHappyPath({
      invoiceFixture: 'nfe-divergence-alta.pdf',
    }).then((result) => {
      getSupplyBalance(result.supplyId).then((balance) => {
        expect(balance.balance).to.be.greaterThan(0);
      });

      getGoodsReceipt(result.goodsReceiptId).then((receipt) => {
        expect(receipt.discrepancies.length).to.be.greaterThan(0);
      });
    });
  });
});
