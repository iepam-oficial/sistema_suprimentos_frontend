import { e2eReset } from '../support/api';

describe('Cypress smoke', () => {
  it('resets E2E data and logs in as MANAGER via UI', () => {
    e2eReset().then((result) => {
      expect(result.ok).to.eq(true);
      expect(result.supplyId).to.be.a('string').and.not.be.empty;
    });

    cy.loginAs('MANAGER');
    cy.url().should('include', '/dashboard');
  });
});
