/**
 * E2E — smoke de relatórios de estoque (sem período; filtros de categoria / colunas).
 * Viewport default do cypress.config: 1440×900 (≥ lg).
 */
describe('reports-stock', () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
    cy.loginAs('MANAGER');
  });

  it('RS-1: supplies-stock — sem Período; tem categoria e column picker', () => {
    cy.intercept('GET', '**/api/reports/**').as('getReport');
    cy.visit('/reports?report=supplies-stock', { timeout: 120000 });
    cy.wait('@getReport', { timeout: 60000 });

    cy.get('[data-testid="reports-select"]').should('have.value', 'supplies-stock');
    cy.get('[data-testid="reports-column-picker"]').should('be.visible');
    cy.get('[data-testid="reports-export"]').should('be.visible');
    cy.get('[data-testid="reports-export-excel"]').should('be.visible');
    cy.contains('Exportar CSV').should('not.exist');

    cy.get('[data-testid="reports-filter-button"]').click();
    cy.get('[data-testid="reports-filter-drawer"]').should('be.visible');
    cy.get('[data-testid="reports-filter-drawer"]').contains('Período').should('not.exist');
    cy.get('[data-testid="reports-filter-category"]').should('be.visible');
  });

  it('RS-2: supplies-stock — expand da primeira linha (soft, se existir)', () => {
    cy.intercept('GET', '**/api/reports/**').as('getReport');
    cy.visit('/reports?report=supplies-stock', { timeout: 120000 });
    cy.wait('@getReport', { timeout: 60000 });

    cy.get('[data-testid="reports-table"]', { timeout: 30000 }).should('be.visible');
    cy.get('body').then(($body) => {
      const expand = $body.find('[data-testid="reports-row-expand-0"]');
      if (expand.length > 0) {
        cy.wrap(expand.first()).click({ force: true });
      }
    });
  });

  it('RS-3: inventory-overview — tabela visível; sem Período no drawer', () => {
    cy.intercept('GET', '**/api/reports/**').as('getReport');
    cy.visit('/reports?report=inventory-overview', { timeout: 120000 });
    cy.wait('@getReport', { timeout: 60000 });

    cy.get('[data-testid="reports-select"]').should('have.value', 'inventory-overview');
    cy.get('[data-testid="reports-table"]', { timeout: 30000 }).should('be.visible');

    cy.get('[data-testid="reports-filter-button"]').click();
    cy.get('[data-testid="reports-filter-drawer"]').should('be.visible');
    cy.get('[data-testid="reports-filter-drawer"]').contains('Período').should('not.exist');
  });
});
