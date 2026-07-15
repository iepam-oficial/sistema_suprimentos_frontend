import { By, until, type WebDriver } from 'selenium-webdriver';
import { E2E_ITEM_DESCRIPTION, getBaseUrl } from '../helpers/constants';
import { E2eApiClient } from '../helpers/apiClient';
import { loginAs, logout } from '../helpers/auth';
import { clickByText, createDriver, findByTestId, quitDriver } from '../helpers/driver';
import { describeE2E } from '../helpers/describeE2E';
import { fillPurchaseRequestItemsStep, advancePurchaseRequestToReview, selectChartAccount } from '../helpers/purchaseRequestForm';
import { step } from '../helpers/step';
import { waitForText, waitForUrlContains } from '../helpers/wait';

describeE2E('SC rejected', () => {
  let driver: WebDriver;
  const api = new E2eApiClient();

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('bloqueia cotação após rejeição da SC', async () => {
    await api.reset();
    let purchaseRequestId = '';

    await step('SC: criar e submeter', async () => {
      await loginAs(driver, 'COORDINATOR');
      await driver.get(`${getBaseUrl()}/procurement/solicitacoes/nova`);
      await driver.wait(until.elementLocated(By.css('textarea')), 30000);
      await driver.findElement(By.css('textarea')).sendKeys('SC E2E para rejeição');
      await selectChartAccount(driver, '3.1.01', 'Material de Escritório');
      await fillPurchaseRequestItemsStep(driver, E2E_ITEM_DESCRIPTION, '5');
      await advancePurchaseRequestToReview(driver);
      await clickByText(driver, 'Submeter');
      await clickByText(driver, 'Confirmar envio');
      await waitForUrlContains(driver, '/procurement/solicitacoes/');
      await driver.wait(async () => {
        const url = await driver.getCurrentUrl();
        return /\/procurement\/solicitacoes\/[0-9a-f-]{36}$/i.test(url);
      }, 20000);
      purchaseRequestId = (await driver.getCurrentUrl()).split('/').pop() ?? '';
      await driver.wait(async () => {
        const snapshot = await api.getPurchaseRequest(purchaseRequestId);
        return snapshot?.status === 'PENDING_APPROVAL';
      }, 20000);
      await logout(driver);
    });

    await step('SC: rejeitar', async () => {
      await loginAs(driver, 'DIRECTOR');
      await driver.get(`${getBaseUrl()}/procurement/aprovacoes-sc`);
      await driver.wait(
        until.elementLocated(By.xpath("//button[contains(normalize-space(.), 'Rejeitar')]")),
        45000,
      );
      await clickByText(driver, 'Rejeitar');
      await driver.findElement(By.css('textarea')).sendKeys('Rejeição E2E — orçamento insuficiente');
      await clickByText(driver, 'Confirmar');
      await waitForText(driver, 'Rejeitada');
      await logout(driver);
    });

    const pr = await api.getPurchaseRequest(purchaseRequestId);
    expect(pr.status).toBe('REJECTED');

    await step('Fila: cotação indisponível', async () => {
      await loginAs(driver, 'MANAGER');
      await driver.get(`${getBaseUrl()}/procurement/fila-compras/${purchaseRequestId}`);
      await driver.sleep(1500);
      const url = await driver.getCurrentUrl();
      expect(url).not.toContain(`/fila-compras/${purchaseRequestId}`);
      const dispararButtons = await driver.findElements(By.xpath("//button[contains(.,'Disparar cotação')]"));
      expect(dispararButtons.length).toBe(0);
      await logout(driver);
    });
  });
});
