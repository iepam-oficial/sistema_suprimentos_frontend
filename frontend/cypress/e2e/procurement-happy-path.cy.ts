import { getGoodsReceipt, getSupplyBalance } from '../support/api';
import { runProcurementHappyPath } from './flows/procurementHappyPath';

describe('procurement happy path', () => {
  it('completa SC → estoque com saldo positivo', () => {
    runProcurementHappyPath().then((result) => {
      getSupplyBalance(result.supplyId).then((balance) => {
        expect(balance.balance).to.be.greaterThan(0);
        expect(balance.batches.length).to.be.greaterThan(0);
      });

      getGoodsReceipt(result.goodsReceiptId).then((receipt) => {
        expect(receipt.status).to.match(/APPROVED|FINALIZED/i);
      });
    });
  });
});
