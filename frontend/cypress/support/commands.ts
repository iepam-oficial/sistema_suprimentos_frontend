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
  const alias = `uiLogin_${role}_${Date.now()}`;

  cy.clearCookies();
  cy.window({ log: false }).then((win) => {
    ['@ti-assistant:token', '@ti-assistant:user', '@ti-assistant:refreshToken'].forEach((key) => {
      win.localStorage.removeItem(key);
    });
  });

  cy.intercept('POST', '**/api/auth/login').as(alias);
  // Visit first so Chakra controlled inputs mount before typing.
  cy.visit('/', { timeout: 120000 });
  cy.get('#email', { timeout: 30000 })
    .should('be.visible')
    .click()
    .focused()
    .type('{selectall}{backspace}', { delay: 0 })
    .type(user.email, { parseSpecialCharSequences: false, delay: 20 })
    .should('have.value', user.email);
  cy.get('#password')
    .click()
    .focused()
    .type('{selectall}{backspace}', { delay: 0 })
    .type(password, { log: false, parseSpecialCharSequences: false, delay: 20 })
    .should('have.value', password);
  cy.contains('button', 'Entrar').click();
  cy.wait(`@${alias}`, { timeout: 60000 }).then((interception) => {
    expect(interception.response, 'login response').to.exist;
    expect(interception.response!.statusCode).to.eq(200);
  });
  // Cold Next.js compile of post-login routes can exceed the default URL wait.
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
