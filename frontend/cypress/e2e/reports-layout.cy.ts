/**
 * E2E — layout desktop de /reports (RPT-LAY-01…05)
 * Viewport default do cypress.config: 1440×900 (≥ lg).
 */
describe('reports-layout desktop', () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
    cy.loginAs('MANAGER');
  });

  it('RL-1: toolbar sem chrome antigo; carrega conteúdo', () => {
    cy.intercept('GET', '**/api/reports/**').as('getReport');
    cy.visit('/reports', { timeout: 120000 });

    cy.get('[data-testid="reports-toolbar"]', { timeout: 60000 }).should('be.visible');
    cy.get('[data-testid="reports-sidebar"]').should('not.exist');
    cy.get('[data-testid="reports-page-heading"]').should('not.exist');
    cy.contains('Dados em tempo real').should('not.exist');
    cy.contains('Painel de dados').should('not.exist');

    cy.wait('@getReport', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
    cy.get('[data-testid="reports-content"]', { timeout: 30000 }).should('be.visible');
    cy.get('[data-testid="reports-exec-tabs"]').should('be.visible');
    cy.get('[data-testid="reports-active-title"]').should('contain.text', 'Resumo executivo');
  });

  it('RL-2: drawer de filtros + badge + limpar', () => {
    cy.intercept('GET', '**/api/reports/**').as('getReport');
    cy.visit('/reports', { timeout: 120000 });
    cy.wait('@getReport', { timeout: 60000 });

    cy.get('[data-testid="reports-filter-badge"]').should('not.exist');
    cy.get('[data-testid="reports-filter-button"]').click();
    cy.get('[data-testid="reports-filter-drawer"]').should('be.visible');

    cy.get('[data-testid="reports-filter-drawer"]')
      .contains('label', 'Período')
      .parent()
      .find('select')
      .select('90');

    // Fecha o drawer (Escape) e espera o reload com período ≠ default
    cy.get('body').type('{esc}');
    cy.wait('@getReport', { timeout: 60000 });
    cy.get('[data-testid="reports-filter-badge"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid="reports-filter-button"]').click();
    cy.get('[data-testid="reports-filter-drawer"]').should('be.visible');
    cy.get('[data-testid="reports-filter-clear"]').click();
    cy.wait('@getReport', { timeout: 60000 });
    cy.get('[data-testid="reports-filter-badge"]').should('not.exist');
  });

  it('RL-3: select troca slug; relatório simples mostra kpis/chart/table', () => {
    cy.intercept('GET', '**/api/reports/**').as('getReport');
    cy.visit('/reports', { timeout: 120000 });
    cy.wait('@getReport', { timeout: 60000 });

    cy.get('[data-testid="reports-select"]').select('supplies-stock');
    cy.wait('@getReport', { timeout: 60000 });
    cy.url().should('include', 'report=supplies-stock');
    cy.get('[data-testid="reports-active-title"]').should('contain.text', 'Estoque');
    cy.get('[data-testid="reports-export"]').should('be.visible');
    cy.get('[data-testid="reports-kpis"]', { timeout: 30000 }).should('be.visible');
    cy.get('[data-testid="reports-chart"]').should('be.visible');
    cy.get('[data-testid="reports-table"]').should('be.visible');
  });

  it('RL-4: abas do resumo executivo', () => {
    cy.intercept('GET', '**/api/reports/**').as('getReport');
    cy.visit('/reports?report=executive-summary', { timeout: 120000 });
    cy.wait('@getReport', { timeout: 60000 });

    cy.get('[data-testid="reports-exec-tab-operacoes"]').should(
      'have.attr',
      'aria-selected',
      'true'
    );

    cy.get('[data-testid="reports-exec-tab-consumo"]').click();
    cy.get('[data-testid="reports-exec-tab-consumo"]').should(
      'have.attr',
      'aria-selected',
      'true'
    );
    cy.get('#consumption-trends').should('exist');

    cy.get('[data-testid="reports-exec-tab-alertas"]').click();
    cy.get('[data-testid="reports-exec-tab-alertas"]').should(
      'have.attr',
      'aria-selected',
      'true'
    );

    cy.get('[data-testid="reports-exec-tab-operacoes"]').click();
    cy.get('[data-testid="reports-exec-tab-operacoes"]').should(
      'have.attr',
      'aria-selected',
      'true'
    );
  });

  it('RL-5: hash #consumption-trends abre aba Consumo', () => {
    cy.intercept('GET', '**/api/reports/**').as('getReport');
    cy.visit('/reports?report=executive-summary#consumption-trends', {
      timeout: 120000,
    });
    cy.wait('@getReport', { timeout: 60000 });

    cy.get('[data-testid="reports-exec-tab-consumo"]', { timeout: 30000 }).should(
      'have.attr',
      'aria-selected',
      'true'
    );
  });

  it('RL-6: deep link report + timeRange (non-stock)', () => {
    cy.intercept('GET', '**/api/reports/**').as('getReport');
    cy.visit('/reports?report=alerts-by-level&timeRange=90', { timeout: 120000 });
    cy.wait('@getReport', { timeout: 60000 });

    cy.url().should('include', 'report=alerts-by-level');
    cy.url().should('include', 'timeRange=90');
    cy.get('[data-testid="reports-select"]').should('have.value', 'alerts-by-level');
    cy.get('[data-testid="reports-filter-badge"]').should('be.visible');
    cy.get('[data-testid="reports-kpis"]').should('be.visible');
  });
});

