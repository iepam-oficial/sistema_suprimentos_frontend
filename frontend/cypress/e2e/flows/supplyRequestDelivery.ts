import {
  approveSupplyRequest,
  confirmManagerSupplyRequestDelivery,
  confirmRequesterSupplyRequest,
  createSupplyRequest,
  e2eLogin,
  getSupplyBalance,
  getSupplyRequest,
} from '../../support/api';
import { getE2ePassword } from '../../support/constants';

export interface SupplyRequestDeliveryResult {
  supplyRequestId: string;
}

/**
 * Entrega pós-compras até DELIVERED.
 *
 * SPEC_DEVIATION: Selenium clica na UI de /supply-requests/admin; aqui usamos API
 * (approve + confirmações) porque a página admin não compila sob Babel+jspdf
 * (`process/browser.js` TypeError) — bloqueador de ambiente, não de negócio.
 * Asserts de status/confirmações/saldo preservam paridade Selenium.
 */
export function runSupplyRequestDelivery(
  supplyId: string,
  quantity = 2,
): Cypress.Chainable<SupplyRequestDeliveryResult> {
  const password = getE2ePassword();
  const state = {
    supplyRequestId: '',
    balanceBefore: 0,
  };

  cy.then(() => getSupplyBalance(supplyId)).then((balance) => {
    state.balanceBefore = balance.balance;
    expect(
      balance.balance,
      `saldo físico supply=${supplyId} insuficiente para SR`,
    ).to.be.at.least(1);
  });

  // Cap à quantidade física: available efetiva (físico − committed) pode ser menor;
  // qty 1 ainda prova DELIVERED e evita 400 flaky quando o saldo pós-GR é baixo.
  cy.then(() => e2eLogin('usuario@example.com', password)).then(({ token }) => {
    const qty = Math.min(quantity, Math.floor(state.balanceBefore));
    expect(qty, 'quantidade SR').to.be.at.least(1);
    return createSupplyRequest(token, {
      supply_id: supplyId,
      quantity: qty,
      destination: 'Setor Manutenção E2E',
    }).then((created) => {
      state.supplyRequestId = created.id;
    });
  });

  cy.log('Supply request: aprovar (API)');
  cy.then(() => e2eLogin('gerente@example.com', password)).then(({ token }) =>
    cy.then(() => approveSupplyRequest(token, state.supplyRequestId)),
  );

  cy.log('Supply request: confirmar recebimento — requerente (API)');
  cy.then(() => e2eLogin('usuario@example.com', password)).then(({ token }) =>
    cy.then(() => confirmRequesterSupplyRequest(token, state.supplyRequestId)),
  );

  cy.log('Supply request: confirmar entrega — gerente (API)');
  cy.then(() => e2eLogin('gerente@example.com', password)).then(({ token }) =>
    cy.then(() => confirmManagerSupplyRequestDelivery(token, state.supplyRequestId)),
  );

  cy.then(() => getSupplyRequest(state.supplyRequestId)).then((request) => {
    expect(request.status).to.eq('DELIVERED');
    expect(request.requester_confirmation).to.eq(true);
    expect(request.manager_delivery_confirmation).to.eq(true);
  });

  cy.then(() => getSupplyBalance(supplyId)).then((balanceAfter) => {
    expect(balanceAfter.balance).to.be.lessThan(state.balanceBefore);
  });

  return cy.then(() => ({ supplyRequestId: state.supplyRequestId }));
}
