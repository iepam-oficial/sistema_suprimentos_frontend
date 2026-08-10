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
 * REQ-E2E-003 — SC → estoque → SupplyRequest DELIVERED.
 *
 * Com destino obrigatório na SC (SCDEL-01), o finalize materializa DS/SR APPROVED
 * (ponte interna) e compromete o saldo efetivo; a entrega ao solicitante é a
 * dupla confirmação dessa SR — não um novo pedido de catálogo.
 */
describe('procurement to delivery', () => {
  it('completa compras até entrega DELIVERED ao solicitante', () => {
    const password = getE2ePassword();
    const state = {
      purchaseRequestId: '',
      supplyRequestId: '',
    };

    runProcurementHappyPath().then((procurement) => {
      state.purchaseRequestId = procurement.purchaseRequestId;

      cy.then(() => e2eLogin('gerente@example.com', password)).then(({ token }) =>
        listDemandSuppliesByScOrigin(token).then((list) => {
          const linked = list.items.filter(
            (item) => item.purchase_request_id === state.purchaseRequestId,
          );
          expect(linked.length, 'DS origem SC após finalize').to.be.greaterThan(0);
          expect(linked[0].aggregate_status).to.eq('APPROVED');
          return getDemandSupplyDetail(token, linked[0].id).then((detail) => {
            expect(detail.items.length).to.be.greaterThan(0);
            state.supplyRequestId = detail.items[0].id;
          });
        }),
      );

      cy.log('Confirmação solicitante (criador da SC)');
      cy.then(() => e2eLogin('coordenador@example.com', password)).then(({ token }) =>
        cy.then(() => confirmRequesterSupplyRequest(token, state.supplyRequestId)),
      );

      cy.log('Confirmação gerente');
      cy.then(() => e2eLogin('gerente@example.com', password)).then(({ token }) =>
        cy.then(() => confirmManagerSupplyRequestDelivery(token, state.supplyRequestId)),
      );

      cy.then(() => getSupplyRequest(state.supplyRequestId)).then((request) => {
        expect(request.status).to.eq('DELIVERED');
      });
    });
  });
});
