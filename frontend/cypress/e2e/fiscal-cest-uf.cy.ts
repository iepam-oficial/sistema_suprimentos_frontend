import { e2eReset } from '../support/api';

/**
 * E2E — importação de CEST com UF, coluna e filtro na lista /fiscal-codes.
 * Requer stack E2E (migration fiscal_cest_ufs aplicada) e E2E_SECRET.
 */
describe('fiscal-cest-uf', () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
    e2eReset().then((result) => {
      expect(result.ok, 'e2e reset').to.eq(true);
    });
    cy.loginAs('MANAGER');
  });

  it('FCU-01: snippet CEST inclui campo uf', () => {
    cy.visit('/fiscal-codes', { timeout: 120000 });
    cy.get('[data-testid="fiscal-import-cest-snippet"]', { timeout: 30000 })
      .should('be.visible')
      .and('contain.text', '"uf"');
  });

  it('FCU-01/02: importa CEST com UF, mostra coluna e filtra SP vs Nacional', () => {
    cy.intercept('GET', '**/api/fiscal-ncms?*').as('listNcms');
    cy.intercept('POST', '**/api/fiscal-ncms/import').as('importFiscal');

    cy.visit('/fiscal-codes', { timeout: 120000 });
    cy.wait('@listNcms', { timeout: 60000 });

    cy.get('[data-testid="fiscal-import-ncm-file"]').selectFile(
      'cypress/fixtures/fiscal-ncm-uf.json',
      { force: true },
    );
    cy.get('[data-testid="fiscal-import-cest-file"]').selectFile(
      'cypress/fixtures/fiscal-cest-uf.json',
      { force: true },
    );
    cy.contains('button', 'Importar tabelas').should('not.be.disabled').click();
    cy.wait('@importFiscal', { timeout: 120000 }).its('response.statusCode').should('eq', 201);
    cy.get('[data-testid="fiscal-import-success"]', { timeout: 30000 }).should('be.visible');
    cy.wait('@listNcms', { timeout: 60000 });

    cy.contains('th', 'UF').should('be.visible');
    cy.get('[data-testid="fiscal-ncm-uf-01012100"]').should('have.text', 'SP');
    cy.get('[data-testid="fiscal-ncm-uf-84713012"]').should('have.text', 'Nacional');

    cy.intercept('GET', '**/api/fiscal-ncms?*uf=SP*').as('listNcmsSp');
    cy.get('[data-testid="fiscal-uf-filter"]').select('SP');
    cy.wait('@listNcmsSp', { timeout: 60000 });
    cy.get('[data-testid="fiscal-ncm-uf-01012100"]').should('have.text', 'SP');
    cy.get('[data-testid="fiscal-ncm-uf-84713012"]').should('not.exist');

    cy.intercept('GET', '**/api/fiscal-ncms?*uf=NACIONAL*').as('listNcmsNacional');
    cy.get('[data-testid="fiscal-uf-filter"]').select('Nacional');
    cy.wait('@listNcmsNacional', { timeout: 60000 });
    cy.get('[data-testid="fiscal-ncm-uf-84713012"]').should('have.text', 'Nacional');
    cy.get('[data-testid="fiscal-ncm-uf-01012100"]').should('not.exist');

    cy.intercept('GET', '**/api/fiscal-ncms?*').as('listNcmsTodos');
    cy.get('[data-testid="fiscal-uf-filter"]').select('Todos');
    cy.wait('@listNcmsTodos', { timeout: 60000 }).then((interception) => {
      expect(interception.request.url).to.not.include('uf=');
    });
    cy.get('[data-testid="fiscal-ncm-uf-01012100"]').should('exist');
    cy.get('[data-testid="fiscal-ncm-uf-84713012"]').should('exist');
  });
});
