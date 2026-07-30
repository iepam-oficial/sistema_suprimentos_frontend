import type { WebDriver } from 'selenium-webdriver';
import { E2eApiClient } from '../helpers/apiClient';
import { createDriver, quitDriver } from '../helpers/driver';
import { describeE2E } from '../helpers/describeE2E';
import { E2E_ITEM_NCM } from '../helpers/constants';
import { waitForText } from '../helpers/wait';
import { runGoodsReceipt, runProcurementHappyPath } from '../flows/procurementHappyPath';

describeE2E('procurement NCM linkage on goods receipt', () => {
  let driver: WebDriver;
  const api = new E2eApiClient();

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver(driver);
  });

  it(
    'NCM extraído da NF aparece na classificação e preenche o suprimento',
    async () => {
      const { supplyId } = await runProcurementHappyPath(driver, api, {
        stopAfter: 'order-accepted',
        finalizeReceipt: false,
      });

      // The E2E supply is created without NCM (see ensureE2eSupply), so it starts empty.
      const fiscalBefore = await api.getSupplyFiscal(supplyId);
      expect(fiscalBefore.ncm_id).toBeNull();

      const goodsReceiptId = await runGoodsReceipt(driver, api, {
        invoiceFixture: 'nfe-sample.pdf',
        finalize: true,
        onClassificationReady: async (currentDriver) => {
          // NCM extracted from the invoice (via the stub AI adapter) matches the active
          // FiscalNcm catalog entry, so it should be auto-resolved and flagged as "Vindo da NF".
          await waitForText(currentDriver, 'Vindo da NF');
        },
      });

      const receipt = await api.getGoodsReceipt(goodsReceiptId);
      expect(receipt.status).toMatch(/APPROVED|FINALIZED/i);
      expect(receipt.invoiceLines.length).toBeGreaterThan(0);
      const [line] = receipt.invoiceLines;
      expect(line.ncm_from_invoice).toBe(E2E_ITEM_NCM);
      expect(line.ncm_id).toBeTruthy();
      expect(line.fiscalNcm?.code).toBe(E2E_ITEM_NCM);

      // Supply had no NCM before the receipt: the classify step must fill it from the line.
      const fiscalAfter = await api.getSupplyFiscal(supplyId);
      expect(fiscalAfter.ncm_id).toBeTruthy();
      expect(fiscalAfter.fiscalNcm?.code).toBe(E2E_ITEM_NCM);
    },
    360000,
  );
});
