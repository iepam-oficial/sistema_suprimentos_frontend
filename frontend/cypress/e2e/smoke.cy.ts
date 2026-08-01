import { e2eReset } from '../support/api';

describe('Cypress smoke', () => {
  it('resets E2E data via cy.request and visits the login page', () => {
    e2eReset().then((result) => {
      expect(result.ok).to.eq(true);
      expect(result.supplyId).to.be.a('string').and.not.be.empty;
    });

    cy.visit('/');
    cy.get('input[placeholder="Seu e-mail"]').should('be.visible');
    cy.contains('button', 'Entrar').should('be.visible');
  });
});
