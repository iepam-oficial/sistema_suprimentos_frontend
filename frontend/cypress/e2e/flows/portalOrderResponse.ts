export function respondToPortalOrder(token: string, accept: boolean): void {
  cy.visit(`/portal/pedido/${token}`, { timeout: 120000 });

  if (accept) {
    cy.clickByText('Aceitar pedido');
    cy.waitForText('Você aceitou este pedido');
    return;
  }

  cy.clickByText('Recusar pedido');
  cy.get('textarea').clear().type('Indisponibilidade de estoque — teste E2E');
  cy.clickByText('Confirmar recusa');
  cy.waitForText('Você recusou este pedido');
}
