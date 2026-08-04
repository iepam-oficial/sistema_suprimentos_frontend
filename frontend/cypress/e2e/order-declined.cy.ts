import {
  e2eLogin,
  getOrderPortalToken,
  listPurchaseOrders,
} from '../support/api';
import { getE2ePassword } from '../support/constants';
import { respondToPortalOrder } from './flows/portalOrderResponse';
import { runProcurementHappyPath } from './flows/procurementHappyPath';

describe('order declined', () => {
  it('impede recebimento quando fornecedor recusa pedido', () => {
    runProcurementHappyPath({ stopAfter: 'order-sent' }).then((result) => {
      getOrderPortalToken(result.orderId).then((portalToken) => {
        respondToPortalOrder(portalToken, false);

        cy.then(() =>
          e2eLogin('gerente@example.com', getE2ePassword()).then(({ token }) =>
            listPurchaseOrders(token),
          ),
        ).then((orders) => {
          const order = orders.items.find((item) => item.id === result.orderId);
          expect(order?.status).to.eq('DECLINED');
        });

        cy.loginAs('MANAGER');
        cy.visit('/procurement/pedidos', { timeout: 120000 });
        cy.contains('button', 'Iniciar recebimento').should('not.exist');
      });
    });
  });
});
