import { E2E_USERS, getE2ePassword, type E2eRole } from './constants';

const POST_LOGIN_PATH: Record<E2eRole, string> = {
  COORDINATOR: '/procurement/solicitacoes',
  DIRECTOR: '/dashboard/financeiro',
  MANAGER: '/dashboard',
  EMPLOYEE: '/supply-requests',
};

Cypress.Commands.add('loginAs', (role: E2eRole) => {
  const user = E2E_USERS[role];
  const password = getE2ePassword();

  cy.intercept('POST', '**/api/auth/login').as('uiLogin');
  cy.visit('/');
  cy.get('input[placeholder="Seu e-mail"]').clear().type(user.email);
  cy.get('input[placeholder="Sua senha"]').clear().type(password, { log: false });
  cy.contains('button', 'Entrar').click();
  cy.wait('@uiLogin').its('response.statusCode').should('eq', 200);
  // Cold Next.js compile of /dashboard can exceed the default 20s URL wait.
  cy.url({ timeout: 90000 }).should('include', POST_LOGIN_PATH[role]);
});

Cypress.Commands.add('logout', () => {
  cy.clearCookies();
  cy.window().then((win) => {
    ['@ti-assistant:token', '@ti-assistant:user', '@ti-assistant:refreshToken'].forEach((key) => {
      win.localStorage.removeItem(key);
    });
  });
});

Cypress.Commands.add('clickByText', (text: string) => {
  cy.contains('button, a', text, { timeout: 15000 }).should('be.visible').click();
});

Cypress.Commands.add('clickByTestId', (testId: string) => {
  cy.get(`[data-testid="${testId}"]`, { timeout: 15000 }).should('be.visible').click();
});

Cypress.Commands.add('findByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`, { timeout: 15000 });
});

Cypress.Commands.add('waitForUrlContains', (fragment: string, timeoutMs = 20000) => {
  cy.url({ timeout: timeoutMs }).should('include', fragment);
});

Cypress.Commands.add('waitForText', (text: string, timeoutMs = 20000) => {
  cy.contains(text, { timeout: timeoutMs }).should('be.visible');
});
