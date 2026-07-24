import type { WebDriver } from 'selenium-webdriver';
import { E2eApiClient } from '../helpers/apiClient';
import { createDriver, quitDriver } from '../helpers/driver';
import { describeE2E } from '../helpers/describeE2E';
import { runGoodsReceipt, runProcurementHappyPath } from '../flows/procurementHappyPath';

describeE2E('procurement inline supply registration', () => {
  let driver: WebDriver;
  const api = new E2eApiClient();

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver(driver);
  });

  it(
    'cadastra suprimento na classificação e finaliza recebimento',
    async () => {
      await runProcurementHappyPath(driver, api, {
        stopAfter: 'order-accepted',
        finalizeReceipt: false,
      });

      const goodsReceiptId = await runGoodsReceipt(driver, api, {
        invoiceFixture: 'nfe-sample.pdf',
        finalize: true,
        inlineCreateSupply: true,
      });

      const receipt = await api.getGoodsReceipt(goodsReceiptId);
      expect(receipt.status).toMatch(/APPROVED|FINALIZED/i);
    },
    360000,
  );
});
