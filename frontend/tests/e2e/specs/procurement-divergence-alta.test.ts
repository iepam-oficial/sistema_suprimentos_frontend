import type { WebDriver } from 'selenium-webdriver';
import { E2eApiClient } from '../helpers/apiClient';
import { createDriver, quitDriver } from '../helpers/driver';
import { describeE2E } from '../helpers/describeE2E';
import { runProcurementHappyPath } from '../flows/procurementHappyPath';

describeE2E('procurement divergence alta', () => {
  let driver: WebDriver;
  const api = new E2eApiClient();

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('autoriza divergência alta e finaliza com lote', async () => {
    const result = await runProcurementHappyPath(driver, api, {
      invoiceFixture: 'nfe-divergence-alta.pdf',
    });

    const balance = await api.getSupplyBalance(result.supplyId);
    expect(balance.balance).toBeGreaterThan(0);

    const receipt = await api.getGoodsReceipt(result.goodsReceiptId);
    expect(receipt.discrepancies.length).toBeGreaterThan(0);
  });
});
