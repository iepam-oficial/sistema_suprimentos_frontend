import { By, until, type WebDriver } from 'selenium-webdriver';
import {
  E2E_ITEM_DESCRIPTION,
  E2E_SUPPLIER_NAMES,
  getBaseUrl,
  getE2ePassword,
} from '../helpers/constants';
import { E2eApiClient } from '../helpers/apiClient';
import { loginAs, logout, fixturePath } from '../helpers/auth';
import { clickByText, findByTestId, clickByTestId } from '../helpers/driver';
import { markAllProposalsReviewOk } from '../helpers/proposalReview';
import { fillGoodsReceiptPhysicalLine, fillPurchaseRequestItemsStep, advancePurchaseRequestToReview, selectChartAccount } from '../helpers/purchaseRequestForm';
import { step } from '../helpers/step';
import { waitForText, waitForUrlContains } from '../helpers/wait';
import { respondToPortalOrder } from './portalOrderResponse';
import { submitAllPortalProposals } from './portalQuoteProposal';

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

export async function runProcurementUntilOrderAccepted(
  driver: WebDriver,
  api: E2eApiClient,
): Promise<ProcurementHappyPathResult> {
  return runProcurementHappyPath(driver, api, {
    stopAfter: 'order-accepted',
    finalizeReceipt: false,
  });
}

async function selectFirstOptionByLabel(driver: WebDriver, label: string): Promise<void> {
  const select = await driver.wait(
    until.elementLocated(
      By.xpath(`//*[@role='dialog']//label[contains(.,'${label}')]/following::select[1]`),
    ),
    15000,
  );
  await driver.wait(async () => {
    const options = await select.findElements(
      By.xpath(".//option[normalize-space(@value)!='']"),
    );
    return options.length > 0;
  }, 15000);
  await select.findElement(By.xpath(".//option[normalize-space(@value)!=''][1]")).click();
}

async function fillInlineSupplyCreate(driver: WebDriver): Promise<string> {
  await clickByText(driver, 'Novo suprimento');
  await waitForText(driver, 'Novo Suprimento');

  const nameInput = await driver.wait(
    until.elementLocated(
      By.xpath("//*[@role='dialog']//label[contains(.,'Nome')]/following::input[1]"),
    ),
    15000,
  );
  const prefilledName = (await nameInput.getAttribute('value'))?.trim() ?? '';
  expect(prefilledName.length).toBeGreaterThan(0);

  const uniqueName = `Suprimento Inline E2E ${Date.now()}`;
  await nameInput.clear();
  await nameInput.sendKeys(uniqueName);

  const descriptionInput = await driver.findElement(
    By.xpath("//*[@role='dialog']//label[contains(.,'Descrição')]/following::input[1]"),
  );
  await descriptionInput.clear();
  await descriptionInput.sendKeys(uniqueName);

  const minQtyInput = await driver.findElement(
    By.xpath(
      "//*[@role='dialog']//label[contains(.,'Quantidade Mínima')]/following::input[1]",
    ),
  );
  const minQty = (await minQtyInput.getAttribute('value'))?.trim() ?? '';
  if (!minQty || minQty === '0') {
    await minQtyInput.clear();
    await minQtyInput.sendKeys('1');
  }

  await selectFirstOptionByLabel(driver, 'Unidade de Medida');
  await selectFirstOptionByLabel(driver, 'Categoria');
  await selectFirstOptionByLabel(driver, 'Plano de Conta');
  await selectFirstOptionByLabel(driver, 'NCM');

  const createBtn = await driver.wait(
    until.elementLocated(
      By.xpath("//*[@role='dialog']//button[@type='submit' and contains(.,'Criar')]"),
    ),
    10000,
  );
  await createBtn.click();

  await driver.wait(async () => {
    const similar = await driver.findElements(
      By.xpath("//*[contains(.,'Suprimentos semelhantes encontrados')]"),
    );
    if (similar.length > 0) {
      await clickByText(driver, 'Continuar cadastro');
      return false;
    }
    const openModals = await driver.findElements(
      By.xpath("//*[@role='dialog']//header[contains(.,'Novo Suprimento')]"),
    );
    return openModals.length === 0;
  }, 30000);

  await waitForText(driver, uniqueName, 15000);
  return uniqueName;
}

export async function runGoodsReceipt(
  driver: WebDriver,
  api: E2eApiClient,
  options: {
    invoiceFixture: string;
    finalize?: boolean;
    directorApprove?: boolean;
    expectCriticalBlocked?: boolean;
    /** When true, creates a new supply via "Novo suprimento" during classification. */
    inlineCreateSupply?: boolean;
  },
): Promise<string> {
  let goodsReceiptId = '';

  await step('Recebimento: conferir e finalizar', async () => {
    await loginAs(driver, 'MANAGER');
    await driver.get(`${getBaseUrl()}/procurement/pedidos`);
    await clickByText(driver, 'Iniciar recebimento');
    await waitForUrlContains(driver, '/procurement/recebimentos/');
    goodsReceiptId = (await driver.getCurrentUrl()).split('/').pop() ?? '';

    await fillGoodsReceiptPhysicalLine(driver);
    await clickByText(driver, 'Salvar e continuar');

    const fileInput = await findByTestId(driver, 'gr-invoice-upload');
    await fileInput.sendKeys(fixturePath(options.invoiceFixture));
    await clickByText(driver, 'Enviar e continuar');
    await waitForText(driver, 'Revise as linhas');
    await clickByText(driver, 'Confirmar linhas');

    await waitForText(driver, 'Classificação');
    const supplyCheckbox = await driver.findElement(
      By.xpath("//th[contains(.,'Suprimento')]/following::input[@type='checkbox'][1]"),
    );
    if (!(await supplyCheckbox.isSelected())) {
      await supplyCheckbox.click();
    }

    if (options.inlineCreateSupply) {
      await fillInlineSupplyCreate(driver);
    }

    await clickByText(driver, 'Salvar classificação e comparar');

    await clickByText(driver, 'Divergências');

    if (options.expectCriticalBlocked) {
      await waitForText(driver, 'Crítica');
      const finalizeBtn = await findByTestId(driver, 'gr-finalize');
      expect(await finalizeBtn.isEnabled()).toBe(false);
      await logout(driver);
      return;
    }

    if (options.directorApprove) {
      await waitForText(driver, 'Alta');
      await logout(driver);
      await loginAs(driver, 'DIRECTOR');
      await driver.get(`${getBaseUrl()}/procurement/recebimentos/${goodsReceiptId}`);
      await clickByText(driver, 'Divergências');
      await clickByText(driver, 'Aprovar como diretor');
      await driver.sleep(2000);
      await logout(driver);
      await loginAs(driver, 'MANAGER');
      await driver.get(`${getBaseUrl()}/procurement/recebimentos/${goodsReceiptId}`);
    }

    if (options.finalize !== false) {
      await driver.wait(
        until.elementLocated(
          By.xpath("//button[contains(.,'Finalizar') and not(contains(.,'recebimento'))]"),
        ),
        20000,
      );
      await clickByText(driver, 'Finalizar');
      await clickByTestId(driver, 'gr-finalize');
      await waitForText(driver, 'Finalizado');
    }

    await logout(driver);
  });

  return goodsReceiptId;
}

export async function runProcurementHappyPath(
  driver: WebDriver,
  api: E2eApiClient,
  options?: ProcurementHappyPathOptions,
): Promise<ProcurementHappyPathResult> {
  const invoiceFixture = options?.invoiceFixture ?? 'nfe-sample.pdf';
  const stopAfter = options?.stopAfter ?? 'complete';
  const portalOrderAccept = options?.portalOrderAccept ?? true;
  const finalizeReceipt = options?.finalizeReceipt ?? stopAfter === 'complete';

  const reset = await api.reset();
  const supplyId = reset.supplyId;

  let purchaseRequestId = '';
  let quoteId = '';
  let orderId = '';
  let goodsReceiptId = '';

  await step('SC: criar e submeter', async () => {
    await loginAs(driver, 'COORDINATOR');
    await driver.get(`${getBaseUrl()}/procurement/solicitacoes/nova`);
    await driver.wait(until.elementLocated(By.css('textarea')), 30000);
    await driver.findElement(By.css('textarea')).sendKeys('Necessidade E2E de parafusos para manutenção');
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
    await waitForText(driver, 'Solicitação aprovada');
    await logout(driver);
  });

  await step('Cotação: criar e enviar', async () => {
    await loginAs(driver, 'MANAGER');
    await driver.get(`${getBaseUrl()}/procurement/fila-compras/${purchaseRequestId}`);
    await clickByText(driver, 'Disparar cotação');
    await waitForUrlContains(driver, 'newQuote=', 40000);
    await clickByText(driver, 'Próximo');
    for (const supplierName of E2E_SUPPLIER_NAMES) {
      const label = await driver.findElement(
        By.xpath(`//label[contains(.,'${supplierName}')]`),
      );
      const checkbox = await label.findElement(By.css('input[type="checkbox"]'));
      if (!(await checkbox.isSelected())) {
        await label.click();
      }
    }
    await clickByText(driver, 'Próximo');
    await clickByText(driver, 'Criar e enviar');
    await waitForUrlContains(driver, '/procurement/cotacoes/', 40000);
    quoteId = (await driver.getCurrentUrl()).split('/').pop()?.split('?')[0] ?? '';
    await logout(driver);
  });

  await step('Portal: 3 propostas', async () => {
    const tokens = Object.values(await api.getQuotePortalTokens(quoteId));
    expect(tokens.length).toBeGreaterThanOrEqual(3);
    await submitAllPortalProposals(driver, tokens.slice(0, 3));
  });

  await step('Cotação: revisar propostas, encerrar e aprovar', async () => {
    await loginAs(driver, 'MANAGER');
    await driver.get(`${getBaseUrl()}/procurement/cotacoes/${quoteId}`);
    await markAllProposalsReviewOk(driver, 3);
    await driver.navigate().refresh();
    await driver.wait(
      until.elementLocated(
        By.xpath("//button[contains(normalize-space(.), 'Encerrar e calcular ranking')]"),
      ),
      20000,
    );
    await clickByText(driver, 'Encerrar e calcular ranking');
    await waitForText(driver, 'Cotação encerrada');
    await logout(driver);

    await loginAs(driver, 'DIRECTOR');
    await driver.get(`${getBaseUrl()}/procurement/cotacoes/${quoteId}`);
    const rankingRow = await driver.wait(
      until.elementLocated(
        By.xpath(
          "//th[contains(.,'Pos.')]/ancestor::table//tr[contains(.,'Fornecedor E2E A')]",
        ),
      ),
      20000,
    );
    await rankingRow.click();
    await clickByText(driver, 'Aprovar cotação');
    await waitForText(driver, 'Vencedor');
    await logout(driver);
  });

  await step('Pedido: gerar e enviar', async () => {
    await loginAs(driver, 'MANAGER');
    await driver.get(`${getBaseUrl()}/procurement/pedidos`);
    await clickByText(driver, 'Gerar pedido');
    await waitForText(driver, 'Gerar pedido de compra');

    const quoteSelect = await driver.wait(
      until.elementLocated(
        By.xpath("//*[@role='dialog']//label[contains(.,'Cotação aprovada')]/following::select[1]"),
      ),
      20000,
    );
    await driver.wait(async () => {
      const opts = await quoteSelect.findElements(
        By.xpath(".//option[normalize-space(@value)!='']"),
      );
      return opts.length > 0;
    }, 20000);
    await quoteSelect.findElement(By.xpath(".//option[normalize-space(@value)!=''][1]")).click();

    const paymentSelect = await driver.wait(
      until.elementLocated(
        By.xpath(
          "//*[@role='dialog']//label[contains(.,'Forma de pagamento')]/following::select[1]",
        ),
      ),
      20000,
    );
    await driver.wait(async () => {
      const opts = await paymentSelect.findElements(
        By.xpath(".//option[normalize-space(@value)!='']"),
      );
      return opts.length > 0;
    }, 20000);
    await paymentSelect.findElement(By.xpath(".//option[normalize-space(@value)!=''][1]")).click();

    const confirmBtn = await driver.wait(
      until.elementLocated(
        By.xpath("//*[@role='dialog']//button[contains(.,'Gerar pedido')]"),
      ),
      10000,
    );
    await driver.wait(until.elementIsEnabled(confirmBtn), 10000);
    await confirmBtn.click();

    await waitForText(driver, 'Rascunho');
    await clickByText(driver, 'Enviar');
    await waitForText(driver, 'Pedido enviado');

    const { token } = await api.login('gerente@example.com', getE2ePassword());
    const orders = await api.listPurchaseOrders(token);
    orderId =
      orders.items.find((item) => item.status === 'SENT')?.id ?? '';
    if (!orderId) {
      throw new Error('Pedido SENT não encontrado após envio');
    }
    await logout(driver);
  });

  if (stopAfter === 'order-sent') {
    return { purchaseRequestId, quoteId, orderId, goodsReceiptId, supplyId };
  }

  await step('Portal: responder pedido', async () => {
    const portalToken = await api.getOrderPortalToken(orderId);
    await respondToPortalOrder(driver, portalToken, portalOrderAccept);
  });

  if (stopAfter === 'order-accepted' || !finalizeReceipt) {
    return { purchaseRequestId, quoteId, orderId, goodsReceiptId, supplyId };
  }

  const needsDirectorApproval = invoiceFixture.includes('divergence-alta');
  goodsReceiptId = await runGoodsReceipt(driver, api, {
    invoiceFixture,
    finalize: true,
    directorApprove: needsDirectorApproval,
  });

  const balance = await api.getSupplyBalance(supplyId);
  expect(balance.balance).toBeGreaterThan(0);

  return {
    purchaseRequestId,
    quoteId,
    orderId,
    goodsReceiptId,
    supplyId,
  };
}
