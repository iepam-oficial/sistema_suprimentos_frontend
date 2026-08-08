import { e2eReset, getPurchaseRequest, getQuotePortalTokens } from '../../support/api';
import { E2E_SUPPLIER_NAMES } from '../../support/constants';
import {
  advancePurchaseRequestToReview,
  confirmPurchaseRequestSubmit,
  fillPurchaseRequestDeliveryFields,
  fillPurchaseRequestItemsStep,
} from '../../support/forms/purchaseRequestForm';
import {
  markAllProposalsReviewOk,
  requestProposalCorrection,
} from '../../support/forms/proposalReview';
import { countByXPath } from '../../support/xpath';
import {
  fillProposalForm,
  submitAllPortalProposals,
  type ProposalProfile,
} from './portalQuoteProposal';

export interface ProcurementQuoteCorrectionResult {
  purchaseRequestId: string;
  quoteId: string;
  correctedInviteId: string;
  oldToken: string;
  newToken: string;
}

/**
 * Perfil da proposta corrigida (reenvio pelo portal). O preço unitário é
 * distinto dos perfis padrão do 1º envio (25,50 / 28 / 30) para que o total
 * resultante (42,50 × 10 = R$ 425,00) seja único e possa ser assertado no
 * detalhe da cotação como prova de que a proposta corrigida ficou visível.
 */
const CORRECTED_PROFILE: ProposalProfile = {
  unitPrice: 42.5,
  delivery: 7,
  payment: 25,
  freight: 12,
  taxes: 6,
};

const CORRECTED_TOTAL_LABEL = '425,00';

const CORRECTION_MESSAGE =
  'Preço unitário acima do esperado. Por favor, revise a linha marcada e reenvie.';

function diffChangedToken(
  before: Record<string, string>,
  after: Record<string, string>,
): { inviteId: string; oldToken: string; newToken: string } {
  for (const [inviteId, newToken] of Object.entries(after)) {
    const oldToken = before[inviteId];
    if (oldToken && oldToken !== newToken) {
      return { inviteId, oldToken, newToken };
    }
  }
  throw new Error(
    'Nenhum token de convite foi rotacionado após a solicitação de correção',
  );
}

/**
 * Fluxo dedicado da feature "Revisão gerencial de proposta":
 * correção → novo token → reenvio pelo portal → Revisão OK → encerrar.
 *
 * Monta o setup mínimo (SC aprovada → cotação enviada → 3 propostas) reusando
 * helpers/flows existentes, sem depender do `runProcurementHappyPath`, que
 * avança até o encerramento e não deixa a cotação em estado revisável.
 */
export function runProcurementQuoteCorrection(): Cypress.Chainable<ProcurementQuoteCorrectionResult> {
  const result: ProcurementQuoteCorrectionResult = {
    purchaseRequestId: '',
    quoteId: '',
    correctedInviteId: '',
    oldToken: '',
    newToken: '',
  };

  e2eReset();

  cy.log('SC: criar e submeter');
  cy.loginAs('COORDINATOR');
  cy.visit('/procurement/solicitacoes/nova', { timeout: 120000 });
  cy.get('textarea', { timeout: 90000 }).first().should('be.visible');
  cy.get('textarea')
    .first()
    .type('Necessidade E2E de parafusos para correção de proposta');
  fillPurchaseRequestDeliveryFields();
  fillPurchaseRequestItemsStep();
  advancePurchaseRequestToReview();
  cy.intercept('POST', '**/api/purchase-requests/*/submit').as('submitPurchaseRequest');
  cy.clickByText('Submeter');
  confirmPurchaseRequestSubmit();
  cy.wait('@submitPurchaseRequest', { timeout: 60000 }).then((interception) => {
    expect(interception.response?.statusCode).to.eq(200);
    const req = interception as unknown as { request: { url: string } };
    const id = req.request.url.match(/purchase-requests\/([^/]+)\/submit/)?.[1] ?? '';
    expect(id, 'purchaseRequestId from submit URL').to.match(/^[0-9a-f-]{36}$/i);
    result.purchaseRequestId = id;
  });
  // Ensure backend persisted PENDING_APPROVAL before director opens the queue.
  cy.then(() => {
    const poll = (attempts: number): Cypress.Chainable =>
      getPurchaseRequest(result.purchaseRequestId).then((pr) => {
        if (pr.status === 'PENDING_APPROVAL') {
          return cy.wrap(pr);
        }
        if (attempts <= 0) {
          throw new Error(
            `SC ${result.purchaseRequestId} status=${pr.status}, expected PENDING_APPROVAL`,
          );
        }
        return cy.wait(1000).then(() => poll(attempts - 1));
      });
    return poll(30);
  });
  cy.then(() => {
    cy.visit(`/procurement/solicitacoes/${result.purchaseRequestId}`, { timeout: 120000 });
  });
  cy.url({ timeout: 60000 }).should('match', /\/procurement\/solicitacoes\/[0-9a-f-]{36}$/i);
  cy.logout();

  cy.log('SC: aprovar');
  cy.loginAs('DIRECTOR');
  cy.visit('/procurement/aprovacoes-sc', { timeout: 120000 });
  cy.contains('Aprovações de SC', { timeout: 60000 }).should('be.visible');
  cy.intercept('POST', '**/api/purchase-requests/*/approve').as('approvePurchaseRequest');
  cy.contains('button', 'Aprovar', { timeout: 90000 }).should('be.visible').click();
  cy.contains('button', 'Confirmar', { timeout: 15000 }).should('be.visible').click();
  cy.wait('@approvePurchaseRequest', { timeout: 90000 })
    .its('response.statusCode')
    .should('be.oneOf', [200, 201, 204]);
  cy.contains('Solicitação aprovada', { timeout: 30000 }).should('be.visible');
  cy.logout();

  cy.log('Cotação: criar e enviar');
  cy.loginAs('MANAGER');
  cy.then(() => {
    expect(result.purchaseRequestId, 'purchaseRequestId before quote wizard').to.match(
      /^[0-9a-f-]{36}$/i,
    );
    cy.visit(`/procurement/cotacoes?newQuote=${result.purchaseRequestId}`, {
      timeout: 180000,
    });
  });
  cy.url({ timeout: 60000 }).should('match', /newQuote=[0-9a-f-]{36}/i);
  cy.contains('Carregando solicitações e fornecedores', { timeout: 90000 }).should('not.exist');
  cy.contains(/Nova cotação|Solicitação|Fornecedores/, { timeout: 90000 }).should('be.visible');
  cy.contains('button', 'Próximo', { timeout: 90000 }).should('be.visible').and('be.enabled').click();
  E2E_SUPPLIER_NAMES.forEach((supplierName) => {
    cy.contains('label', supplierName).then(($label) => {
      const $checkbox = $label.find('input[type="checkbox"]');
      if (!$checkbox.is(':checked')) {
        cy.wrap($label).click();
      }
    });
  });
  cy.clickByText('Próximo');
  cy.intercept('POST', '**/api/procurement-quotes').as('createQuote');
  cy.intercept('POST', '**/api/procurement-quotes/*/send').as('sendQuote');
  cy.clickByText('Criar e enviar');
  cy.wait('@createQuote', { timeout: 60000 }).then((interception) => {
    expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
    const body = interception.response?.body as { id?: string };
    expect(body?.id, 'quote id from create response').to.be.a('string');
    result.quoteId = body.id!;
  });
  cy.wait('@sendQuote', { timeout: 60000 })
    .its('response.statusCode')
    .should('be.oneOf', [200, 201, 204]);
  cy.then(() => {
    cy.visit(`/procurement/cotacoes/${result.quoteId}`, { timeout: 120000 });
  });
  cy.url({ timeout: 90000 }).should('match', /\/procurement\/cotacoes\/[0-9a-f-]{36}$/i);
  cy.logout();

  cy.log('Portal: 3 propostas iniciais');
  cy.then(() => getQuotePortalTokens(result.quoteId)).then((byInviteId) => {
    const tokens = Object.values(byInviteId);
    expect(tokens.length).to.be.at.least(3);
    submitAllPortalProposals(tokens.slice(0, 3));
  });

  cy.log('Cotação: solicitar correção em 1 fornecedor');
  cy.loginAs('MANAGER');
  cy.then(() => {
    cy.visit(`/procurement/cotacoes/${result.quoteId}`, { timeout: 120000 });
  });
  cy.waitForText('Aguardando revisão', 60000);

  cy.then(() => getQuotePortalTokens(result.quoteId)).then((tokensBefore) => {
    requestProposalCorrection(CORRECTION_MESSAGE, { flagFirstItem: true });
    cy.waitForText('Correção solicitada', 30000);

    getQuotePortalTokens(result.quoteId).then((tokensAfter) => {
      const changed = diffChangedToken(tokensBefore, tokensAfter);
      result.correctedInviteId = changed.inviteId;
      result.oldToken = changed.oldToken;
      result.newToken = changed.newToken;
    });
  });
  cy.logout();

  cy.log('Portal: link antigo deve falhar após correção');
  cy.then(() => {
    cy.visit(`/portal/cotacao/${result.oldToken}`, { timeout: 120000 });
  });
  cy.waitForText('Convite inválido ou expirado', 30000);

  cy.log('Portal: reenviar proposta corrigida com novo token');
  cy.then(() => {
    cy.visit(`/portal/cotacao/${result.newToken}`, { timeout: 120000 });
  });
  cy.waitForText('Correção solicitada pelo comprador', 30000);
  fillProposalForm(CORRECTED_PROFILE);
  // Correction resubmit is PUT (initial submit is POST).
  cy.intercept('PUT', '**/proposal').as('resubmitCorrectedProposal');
  cy.clickByText('Reenviar proposta corrigida');
  cy.wait('@resubmitCorrectedProposal', { timeout: 90000 })
    .its('response.statusCode')
    .should('be.oneOf', [200, 201]);
  cy.waitForText('Proposta reenviada', 60000);

  cy.log('Cotação: proposta corrigida visível e aguardando revisão');
  cy.loginAs('MANAGER');
  cy.then(() => {
    cy.visit(`/procurement/cotacoes/${result.quoteId}`, { timeout: 120000 });
  });
  cy.waitForText(CORRECTED_TOTAL_LABEL, 60000);
  cy.waitForText('Aguardando revisão', 30000);

  cy.log('Cotação: Revisão OK em todas e encerrar');
  markAllProposalsReviewOk(3);
  cy.intercept('POST', '**/api/procurement-quotes/*/close').as('closeQuote');
  cy.clickByText('Encerrar e calcular ranking');
  cy.wait('@closeQuote', { timeout: 120000 })
    .its('response.statusCode')
    .should('be.oneOf', [200, 201]);
  cy.waitForText('Ranking de propostas', 60000);
  countByXPath(
    "//button[contains(normalize-space(.), 'Encerrar e calcular ranking')]",
  ).should('eq', 0);
  cy.logout();

  return cy.then(() => ({ ...result }));
}
