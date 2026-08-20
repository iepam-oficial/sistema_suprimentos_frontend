import { e2eLogin, getSupplyBalance, getSupplyBatch } from '../support/api';
import {
  E2E_ITEM_CFOP,
  E2E_ITEM_COMMERCIAL_UNIT,
  E2E_ITEM_CST,
  E2E_USERS,
  getE2ePassword,
} from '../support/constants';
import { runProcurementHappyPath } from './flows/procurementHappyPath';

describe('procurement batch fiscal snapshot', () => {
  it('após happy path, GET lote e detalhe UI expõem CFOP do snapshot fiscal', () => {
    runProcurementHappyPath().then((result) => {
      getSupplyBalance(result.supplyId).then((balance) => {
        expect(balance.balance).to.be.greaterThan(0);
        expect(balance.batches.length).to.be.greaterThan(0);

        const batchId = balance.batches[0]?.id;
        expect(batchId).to.be.ok;

        e2eLogin(E2E_USERS.MANAGER.email, getE2ePassword()).then(({ token }) => {
          getSupplyBatch(token, batchId!).then((batch) => {
            expect(batch.fiscal_lines?.length).to.be.greaterThan(0);
            const fiscalLine = batch.fiscal_lines!.find((line) => line.cfop === E2E_ITEM_CFOP);
            expect(fiscalLine).to.exist;
            expect(fiscalLine!.cst).to.eq(E2E_ITEM_CST);
            expect(fiscalLine!.commercial_unit).to.eq(E2E_ITEM_COMMERCIAL_UNIT);
            expect(batch.fiscal_incomplete).to.eq(false);
          });
        });

        cy.loginAs('MANAGER');
        cy.visit(`/supplies/batches/${batchId}`, { timeout: 120000 });
        cy.waitForText('Snapshot fiscal', 20000);
        cy.waitForText(E2E_ITEM_CFOP, 10000);
        cy.logout();
      });
    });
  });
});
