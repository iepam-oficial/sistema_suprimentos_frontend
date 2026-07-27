import { By, until, type WebDriver } from 'selenium-webdriver';
import { E2E_ITEM_DESCRIPTION, getBaseUrl } from '../helpers/constants';
import { E2eApiClient } from '../helpers/apiClient';
import { loginAs, logout } from '../helpers/auth';
import {
  captureScreenshot,
  clickByText,
  createDriver,
  quitDriver,
} from '../helpers/driver';
import { describeE2E } from '../helpers/describeE2E';
import {
  advancePurchaseRequestToReview,
  fillPurchaseRequestItemsStep,
  selectChartAccount,
} from '../helpers/purchaseRequestForm';

describeE2E('debug approve', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('cria SC e inspeciona fila de aprovação', async () => {
    const api = new E2eApiClient();
    await api.reset();

    await loginAs(driver, 'COORDINATOR');
    await driver.get(`${getBaseUrl()}/procurement/solicitacoes/nova`);
    await driver.wait(until.elementLocated(By.css('textarea')), 30000);
    await driver.findElement(By.css('textarea')).sendKeys('SC debug approve');
    await selectChartAccount(driver, '3.1.01', 'Material de Escritório');
    await fillPurchaseRequestItemsStep(driver, E2E_ITEM_DESCRIPTION, '5');
    await advancePurchaseRequestToReview(driver);
    await clickByText(driver, 'Submeter');
    await clickByText(driver, 'Confirmar envio');
    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return /\/procurement\/solicitacoes\/[0-9a-f-]{36}$/i.test(url);
    }, 30000);
    const purchaseRequestId = (await driver.getCurrentUrl()).split('/').pop() ?? '';
    // eslint-disable-next-line no-console
    console.log('created PR', purchaseRequestId, await driver.getCurrentUrl());
    const snapshot = await api.getPurchaseRequest(purchaseRequestId);
    // eslint-disable-next-line no-console
    console.log('PR status', snapshot?.status);
    await logout(driver);

    await loginAs(driver, 'DIRECTOR');
    // eslint-disable-next-line no-console
    console.log('director url', await driver.getCurrentUrl());
    // eslint-disable-next-line no-console
    console.log(
      'director user',
      await driver.executeScript("return localStorage.getItem('@ti-assistant:user')"),
    );
    await driver.get(`${getBaseUrl()}/procurement/aprovacoes-sc`);
    await driver.sleep(5000);
    const body = await driver.findElement(By.css('body')).getText();
    // eslint-disable-next-line no-console
    console.log('approve page:\n', body.slice(0, 2000));
    const aprovar = await driver.findElements(
      By.xpath("//button[contains(normalize-space(.), 'Aprovar')]"),
    );
    const rejeitar = await driver.findElements(
      By.xpath("//button[contains(normalize-space(.), 'Rejeitar')]"),
    );
    // eslint-disable-next-line no-console
    console.log('Aprovar buttons', aprovar.length, 'Rejeitar buttons', rejeitar.length);
    await captureScreenshot(driver, 'debug-approve');
  });
});
