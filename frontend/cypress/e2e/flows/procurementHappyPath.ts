import {
  e2eLogin,
  e2eReset,
  getOrderPortalToken,
  getPurchaseRequest,
  getQuotePortalTokens,
  getSupplyBalance,
  listPurchaseOrders,
} from '../../support/api';
import { E2E_ITEM_DESCRIPTION, E2E_SUPPLIER_NAMES, getE2ePassword } from '../../support/constants';
import {
  advancePurchaseRequestToReview,
  fillGoodsReceiptPhysicalLine,
  fillPurchaseRequestItemsStep,
  fixturePath,
  selectChartAccount,
} from '../../support/forms/purchaseRequestForm';
import { markAllProposalsReviewOk } from '../../support/forms/proposalReview';
import { getByXPath } from '../../support/xpath';
import { respondToPortalOrder } from './portalOrderResponse';
import { submitAllPortalProposals } from './portalQuoteProposal';

/** Marca a 1ª linha como Suprimento e garante vínculo no catálogo (save habilitado). */
function classifyFirstInvoiceLineAsSupply(): void {
  // Stepper tab "Classificação" is always in DOM — wait for step body instead.
  cy.contains('Classifique cada linha da NF', { timeout: 90000 }).should('be.visible');

  // Sugestões IA (fuzzy stub) pré-preenchem supply_id; destino continua UNCLASSIFIED até o check.
  cy.contains('button', 'Buscar sugestões IA de suprimento', { timeout: 20000 })
    .should('be.enabled')
    .click();
  cy.contains('Sugestões de suprimento atualizadas', { timeout: 60000 }).should('exist');

  // Chakra Checkbox: prefer .check() over click so controlled onChange fires.
  cy.contains('th', 'Suprimento')
    .closest('table')
    .find('tbody tr')
    .first()
    .find('input[type="checkbox"]')
    .eq(0)
    .check({ force: true });

  // Fallback: se a sugestão não vinculou, seleciona o suprimento seed do e2eReset.
  cy.get('body').then(($body) => {
    if ($body.text().includes('Vincule um suprimento')) {
      cy.intercept('GET', '**/api/procurement/catalog-search**').as('catalogSearchClassify');
      cy.get('input[placeholder="Buscar suprimento no catálogo"]')
        .clear()
        .type(E2E_ITEM_DESCRIPTION.slice(0, Math.min(8, E2E_ITEM_DESCRIPTION.length)));
      cy.wait('@catalogSearchClassify', { timeout: 60000 })
        .its('response.statusCode')
        .should('eq', 200);
      cy.contains('ul li', E2E_ITEM_DESCRIPTION, { timeout: 30000 })
        .should('be.visible')
        .trigger('mousedown');
    }
  });

  cy.contains('button', 'Salvar classificação e comparar', { timeout: 30000 }).should(
    'be.enabled',
  );
}

export interface ProcurementHappyPathResult {
  purchaseRequestId: string;
  quoteId: string;
  orderId: string;
  goodsReceiptId: string;
  supplyId: string;
}

export type ProcurementStopAfter = 'order-sent' | 'order-accepted' | 'complete';

export interface ProcurementHappyPathOptions {
  invoiceFixture?: string;
  stopAfter?: ProcurementStopAfter;
  portalOrderAccept?: boolean;
  finalizeReceipt?: boolean;
}

function selectFirstOptionByLabel(label: string): void {
  getByXPath(
    `//*[@role='dialog']//label[contains(.,'${label}')]/following::select[1]`,
    { timeout: 15000 },
  ).then(($select) => {
    cy.wrap($select)
      .find('option')
      .not('[value=""]')
      .should('have.length.at.least', 1)
      .first()
      .then(($opt) => {
        cy.wrap($select).select($opt.val() as string, { force: true });
      });
  });
}

function fillInlineSupplyCreate(): Cypress.Chainable<string> {
  const uniqueName = `Suprimento Inline E2E ${Date.now()}`;

  cy.clickByText('Novo suprimento');
  cy.waitForText('Novo Suprimento');

  getByXPath("//*[@role='dialog']//label[contains(.,'Nome')]/following::input[1]", {
    timeout: 15000,
  }).then(($input) => {
    expect(($input.val() as string)?.trim().length).to.be.greaterThan(0);
    cy.wrap($input).clear().type(uniqueName);
  });

  getByXPath("//*[@role='dialog']//label[contains(.,'Descrição')]/following::input[1]")
    .clear()
    .type(uniqueName);

  getByXPath(
    "//*[@role='dialog']//label[contains(.,'Quantidade Mínima')]/following::input[1]",
  ).then(($input) => {
    const minQty = String($input.val() ?? '').trim();
    if (!minQty || minQty === '0') {
      cy.wrap($input).clear().type('1');
    }
  });

  selectFirstOptionByLabel('Unidade de Medida');
  selectFirstOptionByLabel('Categoria');
  selectFirstOptionByLabel('Plano de Conta');
  // SupplyModal has no NCM field (NCM is set on the classification line after link).

  cy.intercept('POST', '**/api/supplies').as('createInlineSupply');
  getByXPath("//*[@role='dialog']//button[@type='submit' and contains(.,'Criar')]", {
    timeout: 10000,
  }).click();

  // Similar-supplies alert may appear in front of the create modal.
  cy.get('body', { timeout: 15000 }).then(($body) => {
    if ($body.text().includes('Suprimentos semelhantes encontrados')) {
      cy.clickByText('Continuar cadastro');
    }
  });

  cy.wait('@createInlineSupply', { timeout: 90000 })
    .its('response.statusCode')
    .should('be.oneOf', [200, 201]);

  cy.contains('[role="dialog"] header', 'Novo Suprimento', { timeout: 30000 }).should(
    'not.exist',
  );
  // Name lives in an input value — cy.contains(text) will not match.
  cy.get('[aria-label="Suprimento vinculado"]', { timeout: 30000 }).should('exist');
  cy.get('input[placeholder="Buscar suprimento no catálogo"]', { timeout: 15000 }).should(
    'have.value',
    uniqueName,
  );
  cy.contains('button', 'Novo suprimento').should('not.exist');

  return cy.wrap(uniqueName);
}

export function runGoodsReceipt(options: {
  invoiceFixture: string;
  finalize?: boolean;
  directorApprove?: boolean;
  expectCriticalBlocked?: boolean;
  inlineCreateSupply?: boolean;
  stopAtDiscrepancies?: boolean;
  onClassificationReady?: () => void;
}): Cypress.Chainable<string> {
  const state = { goodsReceiptId: '' };

  cy.log('Recebimento: conferir e finalizar');
  cy.loginAs('MANAGER');
  cy.visit('/procurement/pedidos', { timeout: 120000 });
  cy.intercept('POST', '**/api/goods-receipts').as('createGoodsReceipt');
  cy.contains('button', 'Iniciar recebimento', { timeout: 60000 }).should('be.visible').click();
  cy.wait('@createGoodsReceipt', { timeout: 90000 }).then((interception) => {
    expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
    const body = interception.response?.body as { id?: string };
    expect(body?.id, 'goodsReceiptId from create').to.be.a('string');
    state.goodsReceiptId = body.id!;
    cy.visit(`/procurement/recebimentos/${state.goodsReceiptId}`, { timeout: 180000 });
  });
  cy.contains('Recebimento de mercadorias', { timeout: 60000 }).should('be.visible');
  cy.contains('Registre os itens recebidos fisicamente', { timeout: 90000 }).should('be.visible');

  fillGoodsReceiptPhysicalLine();
  cy.intercept('PUT', '**/api/goods-receipts/*/physical-lines').as('savePhysicalLines');
  cy.clickByText('Salvar e continuar');
  cy.wait('@savePhysicalLines', { timeout: 90000 })
    .its('response.statusCode')
    .should('be.oneOf', [200, 201]);
  cy.contains('Envie a nota fiscal', { timeout: 60000 }).should('be.visible');
  // Chakra may not forward data-testid reliably; fall back to file input under the label.
  cy.get('body').then(($body) => {
    const byTestId = $body.find('[data-testid="gr-invoice-upload"]');
    const $input = byTestId.length
      ? byTestId
      : $body.find('input[type="file"][accept*="pdf"]');
    expect($input.length, 'invoice file input').to.be.greaterThan(0);
    cy.wrap($input.first()).selectFile(fixturePath(options.invoiceFixture), { force: true });
  });
  cy.clickByText('Enviar e continuar');
  cy.waitForText('Revise as linhas', 90000);
  cy.intercept('POST', '**/api/goods-receipts/*/confirm-invoice-lines').as('confirmInvoiceLines');
  cy.clickByText('Confirmar linhas');
  cy.wait('@confirmInvoiceLines', { timeout: 90000 })
    .its('response.statusCode')
    .should('be.oneOf', [200, 201]);

  if (options.inlineCreateSupply) {
    // Do NOT waitForText('Classificação') — the stepper tab label matches early.
    cy.contains('Classifique cada linha da NF', { timeout: 90000 }).should('be.visible');
    // Chakra Checkbox: click visible label (hidden input .check/.click often skip React onChange).
    cy.contains('th', 'Suprimento')
      .closest('table')
      .find('tbody tr')
      .first()
      .as('classRow');
    cy.get('@classRow').find('label.chakra-checkbox').eq(0).should('be.visible').click();
    cy.get('@classRow').find('input[type="checkbox"]').eq(0).should('be.checked');
    cy.contains('Vincule um suprimento do catálogo', { timeout: 15000 }).should('be.visible');
    cy.contains('button', 'Novo suprimento', { timeout: 20000 }).should('be.visible');
    fillInlineSupplyCreate();
  } else {
    classifyFirstInvoiceLineAsSupply();
  }

  if (options.onClassificationReady) {
    options.onClassificationReady();
  }

  cy.contains('button', 'Salvar classificação e comparar').should('be.enabled').click();
  cy.clickByText('Divergências');

  if (options.stopAtDiscrepancies) {
    cy.waitForText('selecionadas');
    return cy.then(() => state.goodsReceiptId);
  }

  if (options.expectCriticalBlocked) {
    cy.waitForText('Crítica');
    // gr-finalize lives on the Finalizar step (not Divergências).
    getByXPath("//button[contains(.,'Finalizar') and not(contains(.,'recebimento'))]", {
      timeout: 20000,
    })
      .should('be.visible')
      .click();
    cy.findByTestId('gr-finalize', { timeout: 30000 }).should('be.disabled');
    cy.logout();
    return cy.then(() => state.goodsReceiptId);
  }

  if (options.directorApprove) {
    cy.waitForText('Alta');
    cy.logout();
    cy.loginAs('DIRECTOR');
    cy.then(() => {
      cy.visit(`/procurement/recebimentos/${state.goodsReceiptId}`);
    });
    cy.clickByText('Divergências');
    cy.clickByText('Aprovar como diretor');
    cy.wait(2000);
    cy.logout();
    cy.loginAs('MANAGER');
    cy.then(() => {
      cy.visit(`/procurement/recebimentos/${state.goodsReceiptId}`);
    });
  }

  if (options.finalize !== false) {
    // Step tab "Finalizar" — not the CTA "Finalizar recebimento" (gr-finalize).
    getByXPath("//button[contains(.,'Finalizar') and not(contains(.,'recebimento'))]", {
      timeout: 20000,
    })
      .should('be.visible')
      .click();
    cy.findByTestId('gr-finalize', { timeout: 60000 }).should('be.enabled').click();
    cy.waitForText('Finalizado', 90000);
  }

  cy.logout();
  return cy.then(() => state.goodsReceiptId);
}

export function runProcurementUntilOrderAccepted(): Cypress.Chainable<ProcurementHappyPathResult> {
  return runProcurementHappyPath({
    stopAfter: 'order-accepted',
    finalizeReceipt: false,
  });
}

export function runProcurementHappyPath(
  options?: ProcurementHappyPathOptions,
): Cypress.Chainable<ProcurementHappyPathResult> {
  const invoiceFixture = options?.invoiceFixture ?? 'nfe-sample.pdf';
  const stopAfter = options?.stopAfter ?? 'complete';
  const portalOrderAccept = options?.portalOrderAccept ?? true;
  const finalizeReceipt = options?.finalizeReceipt ?? stopAfter === 'complete';

  const result: ProcurementHappyPathResult = {
    purchaseRequestId: '',
    quoteId: '',
    orderId: '',
    goodsReceiptId: '',
    supplyId: '',
  };

  e2eReset().then((reset) => {
    result.supplyId = reset.supplyId;
  });

  cy.log('SC: criar e submeter');
  cy.loginAs('COORDINATOR');
  cy.visit('/procurement/solicitacoes/nova', { timeout: 120000 });
  cy.contains('Nova solicitação de compra', { timeout: 90000 }).should('be.visible');
  cy.get('textarea', { timeout: 90000 }).first().should('be.visible');
  cy.get('textarea').first().type('Necessidade E2E de parafusos para manutenção');
  selectChartAccount('3.1.01', 'Material de Escritório');
  fillPurchaseRequestItemsStep();
  advancePurchaseRequestToReview();
  cy.intercept('POST', '**/api/purchase-requests/*/submit').as('submitPurchaseRequest');
  cy.clickByText('Submeter');
  cy.clickByText('Confirmar envio');
  cy.wait('@submitPurchaseRequest', { timeout: 60000 })
    .its('response.statusCode')
    .should('eq', 200);
  cy.get('@submitPurchaseRequest').then((interception) => {
    const req = interception as unknown as { request: { url: string } };
    const id = req.request.url.match(/purchase-requests\/([^/]+)\/submit/)?.[1] ?? '';
    expect(id, 'purchaseRequestId from submit URL').to.match(
      /^[0-9a-f-]{36}$/i,
    );
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
          throw new Error(`SC ${result.purchaseRequestId} status=${pr.status}, expected PENDING_APPROVAL`);
        }
        return cy.wait(1000).then(() => poll(attempts - 1));
      });
    return poll(30);
  });
  // visit must be inside cy.then — template strings are evaluated at enqueue time
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
  // Direct wizard URL (same as "Disparar cotação") — avoids soft-nav flakes from fila-compras.
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

  cy.log('Portal: 3 propostas');
  cy.then(() => getQuotePortalTokens(result.quoteId)).then((byInviteId) => {
    const tokens = Object.values(byInviteId);
    expect(tokens.length).to.be.at.least(3);
    submitAllPortalProposals(tokens.slice(0, 3));
  });

  cy.log('Cotação: revisar propostas, encerrar e aprovar');
  cy.loginAs('MANAGER');
  cy.then(() => {
    cy.visit(`/procurement/cotacoes/${result.quoteId}`, { timeout: 120000 });
  });
  cy.contains('Convites aos fornecedores', { timeout: 90000 }).should('be.visible');
  markAllProposalsReviewOk(3);
  cy.reload();
  getByXPath("//button[contains(normalize-space(.), 'Encerrar e calcular ranking')]", {
    timeout: 20000,
  }).should('exist');
  cy.intercept('POST', '**/api/procurement-quotes/*/close').as('closeQuote');
  cy.clickByText('Encerrar e calcular ranking');
  cy.wait('@closeQuote', { timeout: 120000 })
    .its('response.statusCode')
    .should('be.oneOf', [200, 201]);
  cy.waitForText('Cotação encerrada', 60000);
  cy.logout();

  cy.loginAs('DIRECTOR');
  cy.then(() => {
    cy.visit(`/procurement/cotacoes/${result.quoteId}`);
  });
  getByXPath(
    "//th[contains(.,'Pos.')]/ancestor::table//tr[contains(.,'Fornecedor E2E A')]",
    { timeout: 60000 },
  ).click();
  cy.intercept('POST', '**/api/procurement-quotes/*/approve').as('approveQuote');
  cy.clickByText('Aprovar cotação');
  cy.wait('@approveQuote', { timeout: 90000 })
    .its('response.statusCode')
    .should('be.oneOf', [200, 201, 204]);
  cy.waitForText('Vencedor', 60000);
  cy.logout();

  cy.log('Pedido: gerar e enviar');
  cy.loginAs('MANAGER');
  cy.visit('/procurement/pedidos');
  cy.clickByText('Gerar pedido');
  cy.waitForText('Gerar pedido de compra');

  cy.intercept('GET', '**/api/procurement-quotes/*').as('loadQuoteForOrder');
  getByXPath(
    "//*[@role='dialog']//label[contains(.,'Cotação aprovada')]/following::select[1]",
    { timeout: 20000 },
  ).then(($select) => {
    cy.wrap($select)
      .find('option')
      .not('[value=""]')
      .should('have.length.at.least', 1)
      .first()
      .then(($opt) => {
        cy.wrap($select).select($opt.val() as string, { force: true });
      });
  });
  // Modal refetches quote detail and may reset payment — wait before selecting.
  cy.wait('@loadQuoteForOrder', { timeout: 90000 });

  getByXPath(
    "//*[@role='dialog']//label[contains(.,'Forma de pagamento')]/following::select[1]",
    { timeout: 20000 },
  ).then(($select) => {
    cy.wrap($select)
      .find('option')
      .not('[value=""]')
      .should('have.length.at.least', 1)
      .first()
      .then(($opt) => {
        cy.wrap($select).select($opt.val() as string, { force: true });
      });
  });

  cy.intercept('POST', '**/api/purchase-orders').as('createPurchaseOrder');
  getByXPath("//*[@role='dialog']//button[contains(.,'Gerar pedido')]", { timeout: 30000 })
    .should('be.enabled')
    .click();
  cy.wait('@createPurchaseOrder', { timeout: 90000 }).then((interception) => {
    expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
    const body = interception.response?.body as { id?: string };
    if (body?.id) {
      result.orderId = body.id;
    }
  });
  // Do not waitForText('Rascunho') — the status filter <option> matches too early.
  cy.intercept('POST', '**/api/purchase-orders/*/send').as('sendPurchaseOrder');
  cy.contains('table button', 'Enviar', { timeout: 60000 }).should('be.visible').click();
  cy.wait('@sendPurchaseOrder', { timeout: 90000 })
    .its('response.statusCode')
    .should('be.oneOf', [200, 201, 204]);
  cy.waitForText('Pedido enviado', 60000);

  cy.then(() => {
    if (result.orderId) {
      return;
    }
    return e2eLogin('gerente@example.com', getE2ePassword())
      .then(({ token }) => listPurchaseOrders(token))
      .then((orders) => {
        result.orderId = orders.items.find((item) => item.status === 'SENT')?.id ?? '';
        expect(result.orderId, 'Pedido SENT não encontrado após envio').to.not.equal('');
      });
  });
  cy.logout();

  if (stopAfter === 'order-sent') {
    return cy.then(() => ({ ...result }));
  }

  cy.log('Portal: responder pedido');
  cy.then(() => getOrderPortalToken(result.orderId)).then((portalToken) => {
    respondToPortalOrder(portalToken, portalOrderAccept);
  });

  if (stopAfter === 'order-accepted' || !finalizeReceipt) {
    return cy.then(() => ({ ...result }));
  }

  const needsDirectorApproval = invoiceFixture.includes('divergence-alta');
  runGoodsReceipt({
    invoiceFixture,
    finalize: true,
    directorApprove: needsDirectorApproval,
  }).then((goodsReceiptId) => {
    result.goodsReceiptId = goodsReceiptId;
  });

  cy.then(() => getSupplyBalance(result.supplyId)).then((balance) => {
    expect(balance.balance).to.be.greaterThan(0);
  });

  return cy.then(() => ({ ...result }));
}
