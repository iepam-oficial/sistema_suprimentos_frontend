/**
 * E2E — relatórios detalhados (abas, column picker, regressão stock/exec).
 * Viewport default do cypress.config: 1440×900 (≥ lg).
 */
describe('reports-detail', () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
    cy.loginAs('MANAGER');
  });

  it('RD-1: supply-requests — tabs + column picker + expand soft', () => {
    cy.intercept('GET', '**/api/reports/**').as('getReport');
    cy.visit('/reports?report=supply-requests', { timeout: 120000 });
    cy.wait('@getReport', { timeout: 60000 });

    cy.get('[data-testid="reports-select"]').should('have.value', 'supply-requests');
    cy.get('[data-testid="reports-column-picker"]').should('be.visible');

    cy.get('[data-testid="reports-tab-resumo"]').should('be.visible');
    cy.get('[data-testid="reports-tab-todas"]').should('be.visible');
    cy.get('[data-testid="reports-tab-pending"]').should('be.visible');

    cy.get('body').then(($body) => {
      const pendingTab = $body.find('[data-testid="reports-tab-pending"]');
      if (pendingTab.length > 0) {
        cy.wrap(pendingTab.first()).click({ force: true });
      }
    });

    cy.get('body').then(($body) => {
      const expand = $body.find('[data-testid="reports-row-expand-0"]');
      if (expand.length > 0) {
        cy.wrap(expand.first()).click({ force: true });
      }
    });
  });

  it('RD-2: consumption-by-sector — TabbedViewer smoke', () => {
    cy.intercept('GET', '**/api/reports/**').as('getReport');
    cy.visit('/reports?report=consumption-by-sector', { timeout: 120000 });
    cy.wait('@getReport', { timeout: 60000 });

    cy.get('[data-testid="reports-select"]').should(
      'have.value',
      'consumption-by-sector'
    );
    cy.get('[data-testid="reports-tab-resumo"]').should('be.visible');
    cy.get('[data-testid="reports-tab-todas"]').should('be.visible');

    cy.get('body').then(($body) => {
      const hasKpis = $body.find('[data-testid="reports-kpis"]').length > 0;
      const hasTable = $body.find('[data-testid="reports-table"]').length > 0;
      expect(hasKpis || hasTable, 'reports-kpis or reports-table').to.eq(true);
    });
  });

  it('RD-3: supplies-stock — regressão soft sem Período no drawer', () => {
    cy.intercept('GET', '**/api/reports/**').as('getReport');
    cy.visit('/reports?report=supplies-stock', { timeout: 120000 });
    cy.wait('@getReport', { timeout: 60000 });

    cy.get('[data-testid="reports-select"]').should('have.value', 'supplies-stock');
    cy.get('[data-testid="reports-filter-button"]').click();
    cy.get('[data-testid="reports-filter-drawer"]').should('be.visible');
    cy.get('[data-testid="reports-filter-drawer"]').contains('Período').should('not.exist');
  });

  it('RD-4: executive-summary — tabs + tabela detalhe opcional', () => {
    cy.intercept('GET', '**/api/reports/**').as('getReport');
    cy.visit('/reports?report=executive-summary', { timeout: 120000 });
    cy.wait('@getReport', { timeout: 60000 });

    cy.get('[data-testid="reports-exec-tabs"]').should('be.visible');

    cy.get('body').then(($body) => {
      const detailTable = $body.find('[data-testid="reports-table"]');
      if (detailTable.length > 0) {
        cy.wrap(detailTable.first()).should('be.visible');
      }
    });
  });
});
