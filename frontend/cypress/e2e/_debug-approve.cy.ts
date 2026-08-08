import { e2eReset, getPurchaseRequest } from '../support/api';
import { E2E_ITEM_DESCRIPTION } from '../support/constants';
import {
  advancePurchaseRequestToReview,
  fillPurchaseRequestDeliveryFields,
  fillPurchaseRequestItemsStep,
} from '../support/forms/purchaseRequestForm';

describe('debug approve', () => {
  it('cria SC e inspeciona fila de aprovação', () => {
    const state = { purchaseRequestId: '' };

    e2eReset();

    cy.loginAs('COORDINATOR');
    cy.visit('/procurement/solicitacoes/nova', { timeout: 120000 });
    cy.get('textarea', { timeout: 90000 }).first().should('be.visible');
    cy.get('textarea').first().type('SC debug approve');
    fillPurchaseRequestDeliveryFields();
    fillPurchaseRequestItemsStep(E2E_ITEM_DESCRIPTION, '5');
    advancePurchaseRequestToReview();
    cy.intercept('POST', '**/api/purchase-requests/*/submit').as('submitPurchaseRequest');
    cy.clickByText('Submeter');
    cy.clickByText('Confirmar envio');
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
      cy.visit(`/procurement/solicitacoes/${state.purchaseRequestId}`, { timeout: 120000 });
    });
    cy.url({ timeout: 60000 }).should('match', /\/procurement\/solicitacoes\/[0-9a-f-]{36}$/i);
    cy.then(() => getPurchaseRequest(state.purchaseRequestId)).then((snapshot) => {
      cy.log(`PR status ${snapshot?.status}`);
    });
    cy.logout();

    cy.loginAs('DIRECTOR');
    cy.visit('/procurement/aprovacoes-sc', { timeout: 120000 });
    cy.contains('Aprovações de SC', { timeout: 60000 }).should('be.visible');
    cy.wait(5000);
    cy.get('body').invoke('text').then((body) => {
      cy.log(`approve page:\n${body.slice(0, 2000)}`);
    });
    cy.get('body').then(($body) => {
      const aprovar = $body.find("button").filter((_, el) =>
        Boolean(el.textContent?.includes('Aprovar')),
      ).length;
      const rejeitar = $body.find("button").filter((_, el) =>
        Boolean(el.textContent?.includes('Rejeitar')),
      ).length;
      cy.log(`Aprovar buttons ${aprovar} Rejeitar buttons ${rejeitar}`);
      expect(aprovar + rejeitar, 'fila de aprovação deve listar ações').to.be.greaterThan(0);
    });
    cy.screenshot('debug-approve');
  });
});
