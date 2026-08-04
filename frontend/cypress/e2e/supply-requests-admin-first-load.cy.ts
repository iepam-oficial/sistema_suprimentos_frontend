import { ensureAdminDemandSupplyItem, ADMIN_DEMAND_SUPPLY_DESTINATION } from './flows/adminDemandSupplySeed';

function clearPersistentTabIndex(): void {
  cy.window().then((win) => {
    win.localStorage.removeItem('persistentTabIndex');
  });
}

function visitAdminSupplyRequests(): void {
  clearPersistentTabIndex();
  cy.visit('/supply-requests/admin', { timeout: 120000 });
}

describe('supply-requests admin first-load', () => {
  it('IT-1: carrega lista na 1ª visita e abas não ficam em skeleton eterno', () => {
    ensureAdminDemandSupplyItem();
    cy.loginAs('MANAGER');

    cy.intercept('GET', '**/api/demand-supplies**').as('listDemandSupplies');
    visitAdminSupplyRequests();

    cy.wait('@listDemandSupplies', { timeout: 60000 })
      .its('response.statusCode')
      .should('eq', 200);

    cy.get('[data-testid="admin-tab-skeleton"]', { timeout: 10000 }).should('not.exist');
    cy.get('[data-testid="demand-supply-list"]', { timeout: 30000 })
      .should('be.visible')
      .and('contain.text', ADMIN_DEMAND_SUPPLY_DESTINATION);

    const otherTabs = [
      'admin-tab-alocacoes',
      'admin-tab-transacoes',
      'admin-tab-movimentacoes',
    ] as const;

    otherTabs.forEach((tabTestId) => {
      cy.get(`[data-testid="${tabTestId}"]`).click();
      cy.get('[data-testid="admin-tab-skeleton"]', { timeout: 15000 }).should('not.exist');
    });

    cy.get('[data-testid="admin-tab-suprimentos"]').click();
    cy.get('[data-testid="admin-tab-skeleton"]', { timeout: 15000 }).should('not.exist');
    cy.get('[data-testid="demand-supply-list"]', { timeout: 30000 }).should('be.visible');
  });

  it('IT-2: trocar de aba e voltar dispara novo GET demand-supplies', () => {
    ensureAdminDemandSupplyItem();
    cy.loginAs('MANAGER');

    cy.intercept('GET', '**/api/demand-supplies**').as('listDemandSupplies');
    visitAdminSupplyRequests();

    cy.wait('@listDemandSupplies', { timeout: 60000 })
      .its('response.statusCode')
      .should('eq', 200);

    cy.get('[data-testid="demand-supply-list"]', { timeout: 30000 }).should('be.visible');

    cy.get('[data-testid="admin-tab-alocacoes"]').click();
    cy.get('[data-testid="admin-tab-skeleton"]', { timeout: 15000 }).should('not.exist');

    cy.get('[data-testid="admin-tab-suprimentos"]').click();
    cy.wait('@listDemandSupplies', { timeout: 60000 })
      .its('response.statusCode')
      .should('eq', 200);

    cy.get('[data-testid="admin-tab-skeleton"]', { timeout: 10000 }).should('not.exist');
    cy.get('[data-testid="demand-supply-list"]', { timeout: 30000 })
      .should('be.visible')
      .and('contain.text', ADMIN_DEMAND_SUPPLY_DESTINATION);
  });

  it('IT-3: falha de demand-supplies não deixa skeleton eterno e mostra erro', () => {
    cy.loginAs('MANAGER');

    cy.intercept('GET', '**/api/demand-supplies**', {
      statusCode: 500,
      body: { error: 'E2E forced failure' },
    }).as('listDemandSuppliesFail');

    visitAdminSupplyRequests();

    cy.wait('@listDemandSuppliesFail', { timeout: 60000 });

    cy.get('[data-testid="admin-tab-skeleton"]', { timeout: 15000 }).should('not.exist');
    cy.get('[data-testid="demand-supply-empty"]', { timeout: 30000 })
      .should('be.visible')
      .and('not.contain.text', 'Nenhum pedido agrupado encontrado');
  });
});
