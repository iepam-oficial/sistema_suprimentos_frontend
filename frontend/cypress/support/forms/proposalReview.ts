import { getByXPath, countByXPath } from '../xpath';

const REVIEW_OK_BUTTON_XPATH =
  "//button[contains(normalize-space(.), 'Revisão OK')]";

function waitForQuoteDetailReady(): void {
  // After review-ok the page toggles full-screen Spinner via loadQuote().
  cy.contains('Convites aos fornecedores', { timeout: 180000 }).should('be.visible');
  cy.get('button').filter(':contains("Salvando")').should('have.length', 0);
  cy.get('.chakra-spinner').should('have.length', 0);
}

function clickOneReviewOk(remainingExpected: number): void {
  if (remainingExpected <= 0) {
    return;
  }

  waitForQuoteDetailReady();
  countByXPath(REVIEW_OK_BUTTON_XPATH).then((before) => {
    if (before === 0) {
      return;
    }

    cy.intercept('POST', '**/review-ok').as('reviewOk');
    cy.intercept('GET', '**/api/procurement-quotes/*').as('reloadQuote');

    getByXPath(`(${REVIEW_OK_BUTTON_XPATH})[last()]`, { timeout: 60000 }).then(($btn) => {
      $btn[0].scrollIntoView({ block: 'center', inline: 'center' });
      cy.wrap($btn).should('be.visible').and('not.be.disabled');
      cy.wrap($btn[0]).click({ force: true });
    });

    cy.wait('@reviewOk', { timeout: 120000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 201, 204]);

    // loadQuote() after success — wait for at least one quote refetch then UI.
    cy.wait('@reloadQuote', { timeout: 180000 });
    waitForQuoteDetailReady();
    countByXPath(REVIEW_OK_BUTTON_XPATH).should('be.lt', before);
    clickOneReviewOk(remainingExpected - 1);
  });
}

/**
 * Marca "Revisão OK" em todas as propostas pendentes (página de detalhe da cotação).
 */
export function markAllProposalsReviewOk(expectedCount: number): void {
  waitForQuoteDetailReady();
  getByXPath(REVIEW_OK_BUTTON_XPATH, { timeout: 120000 }).should('exist');
  clickOneReviewOk(expectedCount);
  waitForQuoteDetailReady();
  countByXPath(REVIEW_OK_BUTTON_XPATH).should('eq', 0);
}

const REQUEST_CORRECTION_BUTTON_XPATH =
  "//button[contains(normalize-space(.), 'Solicitar correção')]";
const MODAL_CONTENT_XPATH = "//section[contains(@class, 'chakra-modal__content')]";

export function requestProposalCorrection(
  message: string,
  options?: { flagFirstItem?: boolean },
): void {
  getByXPath(REQUEST_CORRECTION_BUTTON_XPATH, { timeout: 15000 })
    .should('be.visible')
    .click();

  getByXPath(`${MODAL_CONTENT_XPATH}//textarea`, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(message);

  if (options?.flagFirstItem) {
    cy.get('section.chakra-modal__content label.chakra-checkbox').then(($labels) => {
      if ($labels.length > 0) {
        cy.wrap($labels.first()).click();
      }
    });
  }

  getByXPath(`${MODAL_CONTENT_XPATH}${REQUEST_CORRECTION_BUTTON_XPATH}`, { timeout: 10000 })
    .should('be.enabled')
    .click();

  cy.get('section.chakra-modal__content', { timeout: 15000 }).should('not.exist');
}
