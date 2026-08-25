import { e2eLogin, e2eReset } from '../support/api';
import { E2E_USERS, getApiUrl, getE2ePassword } from '../support/constants';

describe('User multi-roles', () => {
  it('ADMIN assigns multi-role; home uses highest priority; MANAGER cannot manage users', () => {
    e2eReset().then((result) => {
      expect(result.ok).to.eq(true);
    });

    const password = getE2ePassword();
    const employeeEmail = E2E_USERS.EMPLOYEE.email;

    e2eLogin(E2E_USERS.EMPLOYEE.email, password).then(({ user: employee }) => {
      const employeeId = employee.id;

      e2eLogin(E2E_USERS.ADMIN.email, password).then(({ token: adminToken }) => {
        cy.request({
          method: 'PUT',
          url: `${getApiUrl()}/users/${employeeId}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: { roles: ['EMPLOYEE', 'COORDINATOR'] },
          failOnStatusCode: true,
        }).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body.roles).to.include.members(['EMPLOYEE', 'COORDINATOR']);
        });
      });

      e2eLogin(E2E_USERS.MANAGER.email, password).then(({ token: managerToken }) => {
        cy.request({
          method: 'PUT',
          url: `${getApiUrl()}/users/${employeeId}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${managerToken}`,
          },
          body: { roles: ['EMPLOYEE', 'MANAGER'] },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(403);
        });
      });
    });

    // UI login as multi-role EMPLOYEE → home = COORDINATOR path (higher priority)
    cy.clearCookies();
    cy.window({ log: false }).then((win) => {
      ['@ti-assistant:token', '@ti-assistant:user', '@ti-assistant:refreshToken'].forEach((key) => {
        win.localStorage.removeItem(key);
      });
    });

    const alias = `uiLogin_multiRole_${Date.now()}`;
    cy.intercept('POST', '**/api/auth/login').as(alias);
    cy.visit('/', { timeout: 120000 });
    cy.get('#email', { timeout: 45000 }).should('be.visible');
    cy.get('#email', { timeout: 45000 }).should(($el) => {
      const node = $el[0] as unknown as Record<string, unknown>;
      const hydrated = Object.keys(node).some(
        (key) =>
          key.startsWith('__reactFiber') ||
          key.startsWith('__reactProps') ||
          key.startsWith('__reactInternalInstance'),
      );
      expect(hydrated, 'React hidratou o formulário de login').to.equal(true);
    });
    cy.get('#email').click().clear({ force: true });
    cy.get('#email').type(employeeEmail, { parseSpecialCharSequences: false, delay: 25 });
    cy.get('#email').should('have.value', employeeEmail);
    cy.get('#password').click().clear({ force: true });
    cy.get('#password').type(password, {
      log: false,
      parseSpecialCharSequences: false,
      delay: 25,
    });
    cy.get('#password').should('have.value', password);
    cy.contains('button', 'Entrar').click();
    cy.wait(`@${alias}`, { timeout: 60000 }).then((interception) => {
      expect(interception.response, 'login response').to.exist;
      expect(interception.response!.statusCode).to.eq(200);
    });
    cy.url({ timeout: 90000 }).should('include', '/procurement/solicitacoes');

    // MANAGER-only URL → redirect to role home (COORDINATOR)
    cy.visit('/reports', { timeout: 120000 });
    cy.url({ timeout: 90000 }).should('include', '/procurement/solicitacoes');
    cy.url().should('not.include', '/reports');
  });
});
