import type { WebDriver } from 'selenium-webdriver';
import { E2eApiClient } from '../helpers/apiClient';
import { createDriver, quitDriver } from '../helpers/driver';
import { describeE2E } from '../helpers/describeE2E';
import { runProcurementQuoteCorrection } from '../flows/procurementQuoteCorrection';

describeE2E('procurement quote correction', () => {
  let driver: WebDriver;
  const api = new E2eApiClient();

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('solicita correção, reenvia pelo portal e encerra com Revisão OK', async () => {
    const result = await runProcurementQuoteCorrection(driver, api);

    expect(result.quoteId).toBeTruthy();
    expect(result.correctedInviteId).toBeTruthy();
    expect(result.oldToken).toBeTruthy();
    expect(result.newToken).toBeTruthy();
    expect(result.newToken).not.toBe(result.oldToken);
  });
});
