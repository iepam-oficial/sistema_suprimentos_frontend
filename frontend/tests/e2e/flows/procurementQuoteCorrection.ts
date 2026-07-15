import { By, until, type WebDriver } from 'selenium-webdriver';
import { E2E_SUPPLIER_NAMES, getBaseUrl } from '../helpers/constants';
import { E2eApiClient } from '../helpers/apiClient';
import { loginAs, logout } from '../helpers/auth';
import { clickByText } from '../helpers/driver';
import {
  markAllProposalsReviewOk,
  requestProposalCorrection,
} from '../helpers/proposalReview';
import {
  advancePurchaseRequestToReview,
  fillPurchaseRequestItemsStep,
  selectChartAccount,
} from '../helpers/purchaseRequestForm';
import { step } from '../helpers/step';
import { waitForText, waitForUrlContains } from '../helpers/wait';
import { fillProposalForm, submitAllPortalProposals, type ProposalProfile } from './portalQuoteProposal';

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
 * os helpers/flows existentes, sem depender do `runProcurementHappyPath`, que
 * avança até o encerramento e não deixa a cotação em estado revisável.
 */
export async function runProcurementQuoteCorrection(
  driver: WebDriver,
  api: E2eApiClient,
): Promise<ProcurementQuoteCorrectionResult> {
  await api.reset();

  let purchaseRequestId = '';
  let quoteId = '';

  await step('SC: criar e submeter', async () => {
    await loginAs(driver, 'COORDINATOR');
    await driver.get(`${getBaseUrl()}/procurement/solicitacoes/nova`);
    await driver.wait(until.elementLocated(By.css('textarea')), 30000);
    await driver
      .findElement(By.css('textarea'))
      .sendKeys('Necessidade E2E de parafusos para correção de proposta');
    await selectChartAccount(driver, '3.1.01', 'Material de Escritório');
    await fillPurchaseRequestItemsStep(driver);
    await advancePurchaseRequestToReview(driver);
    await clickByText(driver, 'Submeter');
    await clickByText(driver, 'Confirmar envio');
    await waitForUrlContains(driver, '/procurement/solicitacoes/');
    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return /\/procurement\/solicitacoes\/[0-9a-f-]{36}$/i.test(url);
    }, 20000);
    purchaseRequestId = (await driver.getCurrentUrl()).split('/').pop() ?? '';
    await logout(driver);
  });

  await step('SC: aprovar', async () => {
    await loginAs(driver, 'DIRECTOR');
    await driver.get(`${getBaseUrl()}/procurement/aprovacoes-sc`);
    await clickByText(driver, 'Aprovar');
    await clickByText(driver, 'Confirmar');
    await waitForText(driver, 'Aprovada');
    await logout(driver);
  });

  await step('Cotação: criar e enviar', async () => {
    await loginAs(driver, 'MANAGER');
    await driver.get(`${getBaseUrl()}/procurement/fila-compras/${purchaseRequestId}`);
    await clickByText(driver, 'Disparar cotação');
    await waitForUrlContains(driver, 'newQuote=');
    await clickByText(driver, 'Próximo');
    for (const supplierName of E2E_SUPPLIER_NAMES) {
      const checkbox = await driver.findElement(
        By.xpath(`//label[contains(.,'${supplierName}')]//input[@type='checkbox']`),
      );
      if (!(await checkbox.isSelected())) {
        await checkbox.click();
      }
    }
    await clickByText(driver, 'Próximo');
    await clickByText(driver, 'Criar e enviar');
    await waitForUrlContains(driver, '/procurement/cotacoes/');
    quoteId = (await driver.getCurrentUrl()).split('/').pop()?.split('?')[0] ?? '';
    await logout(driver);
  });

  await step('Portal: 3 propostas iniciais', async () => {
    const tokens = Object.values(await api.getQuotePortalTokens(quoteId));
    expect(tokens.length).toBeGreaterThanOrEqual(3);
    await submitAllPortalProposals(driver, tokens.slice(0, 3));
  });

  let correctedInviteId = '';
  let oldToken = '';
  let newToken = '';

  await step('Cotação: solicitar correção em 1 fornecedor', async () => {
    await loginAs(driver, 'MANAGER');
    await driver.get(`${getBaseUrl()}/procurement/cotacoes/${quoteId}`);
    await waitForText(driver, 'Aguardando revisão');

    const tokensBefore = await api.getQuotePortalTokens(quoteId);

    await requestProposalCorrection(driver, CORRECTION_MESSAGE, { flagFirstItem: true });
    await waitForText(driver, 'Correção solicitada');

    const tokensAfter = await api.getQuotePortalTokens(quoteId);
    const changed = diffChangedToken(tokensBefore, tokensAfter);
    correctedInviteId = changed.inviteId;
    oldToken = changed.oldToken;
    newToken = changed.newToken;

    await logout(driver);
  });

  await step('Portal: link antigo deve falhar após correção', async () => {
    await driver.get(`${getBaseUrl()}/portal/cotacao/${oldToken}`);
    await waitForText(driver, 'Convite inválido ou expirado');
  });

  await step('Portal: reenviar proposta corrigida com novo token', async () => {
    await driver.get(`${getBaseUrl()}/portal/cotacao/${newToken}`);
    await waitForText(driver, 'Correção solicitada pelo comprador');
    await fillProposalForm(driver, CORRECTED_PROFILE);
    await clickByText(driver, 'Reenviar proposta corrigida');
    await waitForText(driver, 'Proposta reenviada');
  });

  await step('Cotação: proposta corrigida visível e aguardando revisão', async () => {
    await loginAs(driver, 'MANAGER');
    await driver.get(`${getBaseUrl()}/procurement/cotacoes/${quoteId}`);
    await waitForText(driver, CORRECTED_TOTAL_LABEL);
    await waitForText(driver, 'Aguardando revisão');
  });

  await step('Cotação: Revisão OK em todas e encerrar', async () => {
    await markAllProposalsReviewOk(driver, 3);
    await clickByText(driver, 'Encerrar e calcular ranking');
    await waitForText(driver, 'Ranking de propostas');
    await driver.wait(
      async () =>
        (
          await driver.findElements(
            By.xpath("//button[contains(normalize-space(.), 'Encerrar e calcular ranking')]"),
          )
        ).length === 0,
      20000,
    );
    await logout(driver);
  });

  return { purchaseRequestId, quoteId, correctedInviteId, oldToken, newToken };
}
