describe('Cypress smoke', () => {
  it('visits the login page via baseUrl', () => {
    cy.visit('/');
    cy.get('input[placeholder="Seu e-mail"]').should('be.visible');
    cy.contains('button', 'Entrar').should('be.visible');
  });
});
