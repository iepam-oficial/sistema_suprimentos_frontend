import type { WebDriver } from 'selenium-webdriver';
import { E2eApiClient } from '../helpers/apiClient';
import { createDriver, quitDriver } from '../helpers/driver';
import { describeE2E } from '../helpers/describeE2E';
import { runGoodsReceipt, runProcurementUntilOrderAccepted } from '../flows/procurementHappyPath';

describeE2E('critical divergence', () => {
  let driver: WebDriver;
  const api = new E2eApiClient();

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('bloqueia finalização com divergência crítica', async () => {
    await runProcurementUntilOrderAccepted(driver, api);

    const goodsReceiptId = await runGoodsReceipt(driver, api, {
      invoiceFixture: 'nfe-critical.pdf',
      finalize: false,
      expectCriticalBlocked: true,
    });

    const receipt = await api.getGoodsReceipt(goodsReceiptId);
    expect(receipt.status).not.toMatch(/APPROVED/i);
    expect(receipt.discrepancies.some((d) => String((d as { severity?: string }).severity) === 'CRITICAL')).toBe(
      true,
    );
  });
});
