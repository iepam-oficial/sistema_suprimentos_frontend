import { e2eReset, getPurchaseRequest } from '../support/api';
import { E2E_ITEM_DESCRIPTION } from '../support/constants';
import {
  advancePurchaseRequestToReview,
  confirmPurchaseRequestSubmit,
  fillPurchaseRequestDeliveryFields,
  fillPurchaseRequestItemsStep,
  stubPurchaseRequestLocales,
} from '../support/forms/purchaseRequestForm';

describe('SC rejected', () => {
  it('bloqueia cotação após rejeição da SC', () => {
    const state = { purchaseRequestId: '' };

    e2eReset();

    cy.log('SC: criar e submeter');
    cy.loginAs('COORDINATOR');
    stubPurchaseRequestLocales();
    cy.visit('/procurement/solicitacoes/nova', { timeout: 120000 });
    cy.contains('Nova solicitação de compra', { timeout: 90000 }).should('be.visible');
    cy.get('textarea', { timeout: 90000 }).first().should('be.visible');
    cy.get('textarea').first().type('SC E2E para rejeição');
    fillPurchaseRequestDeliveryFields();
    fillPurchaseRequestItemsStep(E2E_ITEM_DESCRIPTION, '5');
    advancePurchaseRequestToReview();
    cy.intercept('POST', '**/api/purchase-requests/*/submit').as('submitPurchaseRequest');
    cy.clickByText('Submeter');
    confirmPurchaseRequestSubmit();
    cy.wait('@submitPurchaseRequest', { timeout: 60000 })
      .its('response.statusCode')
      .should('eq', 200);
    cy.get('@submitPurchaseRequest').then((interception) => {
      const req = interception as unknown as { request: { url: string } };
      const id = req.request.url.match(/purchase-requests\/([^/]+)\/submit/)?.[1] ?? '';
      expect(id).to.match(/^[0-9a-f-]{36}$/i);
      state.purchaseRequestId = id;
    });
    cy.then(() => {
      const poll = (attempts: number): Cypress.Chainable =>
        getPurchaseRequest(state.purchaseRequestId).then((pr) => {
          if (pr.status === 'PENDING_APPROVAL') {
            return cy.wrap(pr);
          }
          if (attempts <= 0) {
            throw new Error(
              `SC ${state.purchaseRequestId} status=${pr.status}, expected PENDING_APPROVAL`,
            );
          }
          return cy.wait(1000).then(() => poll(attempts - 1));
        });
      return poll(30);
    });
    cy.logout();

    cy.log('SC: rejeitar');
    cy.loginAs('DIRECTOR');
    cy.visit('/procurement/aprovacoes-sc', { timeout: 120000 });
    cy.contains('Aprovações de SC', { timeout: 60000 }).should('be.visible');
    cy.intercept('POST', '**/api/purchase-requests/*/reject').as('rejectPurchaseRequest');
    cy.contains('button', 'Rejeitar', { timeout: 90000 }).should('be.visible').click();
    cy.get('textarea', { timeout: 15000 }).first().should('be.visible').clear().type(
      'Rejeição E2E — orçamento insuficiente',
    );
    cy.contains('button', 'Confirmar', { timeout: 15000 }).should('be.visible').click();
    cy.wait('@rejectPurchaseRequest', { timeout: 90000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 201, 204]);
    // Toast title is "Solicitação rejeitada" (lowercase "rejeitada").
    cy.waitForText('Solicitação rejeitada', 30000);
    cy.logout();

    cy.then(() => getPurchaseRequest(state.purchaseRequestId)).then((pr) => {
      expect(pr.status).to.eq('REJECTED');
    });

    cy.log('Fila: cotação indisponível');
    cy.loginAs('MANAGER');
    cy.then(() => {
      cy.visit(`/procurement/fila-compras/${state.purchaseRequestId}`, { timeout: 120000 });
    });
    cy.wait(1500);
    cy.url().should('not.include', `/fila-compras/${state.purchaseRequestId}`);
    cy.contains('button', 'Disparar cotação').should('not.exist');
    cy.logout();
  });
});
