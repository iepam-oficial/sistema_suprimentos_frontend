import {
  confirmManagerSupplyRequestDelivery,
  confirmRequesterSupplyRequest,
  e2eLogin,
  getDemandSupplyDetail,
  getSupplyRequest,
  listDemandSuppliesByScOrigin,
} from '../support/api';
import { getE2ePassword } from '../support/constants';
import { runProcurementHappyPath } from './flows/procurementHappyPath';

/**
 * SCDEL-04 / SCDEL-13 — após finalize com SC completa, bridge cria DS/SR APPROVED;
 * dupla confirmação leva a DELIVERED sem passar por inbox PENDING.
 */
describe('SC post-receipt internal delivery', () => {
  it('finalize completo cria DS/SR APPROVED e dupla confirmação chega em DELIVERED', () => {
    const password = getE2ePassword();
    const state = {
      purchaseRequestId: '',
      demandSupplyId: '',
      supplyRequestId: '',
    };

    runProcurementHappyPath().then((procurement) => {
      state.purchaseRequestId = procurement.purchaseRequestId;

      cy.then(() => e2eLogin('gerente@example.com', password)).then(({ token }) =>
        listDemandSuppliesByScOrigin(token).then((list) => {
          const linked = list.items.filter(
            (item) => item.purchase_request_id === state.purchaseRequestId,
          );
          expect(linked.length, 'DS origem SC para a PR').to.be.greaterThan(0);
          expect(linked[0].aggregate_status).to.eq('APPROVED');
          state.demandSupplyId = linked[0].id;

          return getDemandSupplyDetail(token, state.demandSupplyId).then((detail) => {
            expect(detail.items.length).to.be.greaterThan(0);
            expect(detail.items.every((item) => item.status === 'APPROVED')).to.eq(true);
            state.supplyRequestId = detail.items[0].id;
          });
        }),
      );

      cy.log('Confirmação solicitante (criador da SC = user das SRs)');
      cy.then(() => e2eLogin('coordenador@example.com', password)).then(({ token }) =>
        cy.then(() => confirmRequesterSupplyRequest(token, state.supplyRequestId)),
      );

      cy.log('Confirmação gerente');
      cy.then(() => e2eLogin('gerente@example.com', password)).then(({ token }) =>
        cy.then(() => confirmManagerSupplyRequestDelivery(token, state.supplyRequestId)),
      );

      cy.then(() => getSupplyRequest(state.supplyRequestId)).then((request) => {
        expect(request.status).to.eq('DELIVERED');
        expect(request.requester_confirmation).to.eq(true);
        expect(request.manager_delivery_confirmation).to.eq(true);
      });
    });
  });

  it('finalize incompleto (sem finalizar) não materializa DS origem SC', () => {
    const password = getE2ePassword();

    runProcurementHappyPath({ stopAfter: 'order-accepted', finalizeReceipt: false }).then(
      (procurement) => {
        cy.then(() => e2eLogin('gerente@example.com', password)).then(({ token }) =>
          listDemandSuppliesByScOrigin(token).then((list) => {
            const linked = list.items.filter(
              (item) => item.purchase_request_id === procurement.purchaseRequestId,
            );
            expect(linked.length, 'sem ponte antes do finalize').to.eq(0);
          }),
        );
      },
    );
  });
});
