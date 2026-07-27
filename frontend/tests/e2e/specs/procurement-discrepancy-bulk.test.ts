import { By, until } from 'selenium-webdriver';
import type { WebDriver } from 'selenium-webdriver';
import { E2eApiClient } from '../helpers/apiClient';
import { clickByTestId, createDriver, findByTestId, quitDriver } from '../helpers/driver';
import { describeE2E } from '../helpers/describeE2E';
import {
  runGoodsReceipt,
  runProcurementHappyPath,
} from '../flows/procurementHappyPath';
import { waitForText } from '../helpers/wait';

type DiscrepancyRow = {
  id: string;
  severity?: string;
  resolved_at?: string | null;
};

describeE2E('procurement discrepancy bulk actions', () => {
  let driver: WebDriver;
  const api = new E2eApiClient();

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver(driver);
  });

  it(
    'aceita divergências elegíveis em lote na etapa Divergências',
    async () => {
      await runProcurementHappyPath(driver, api, {
        stopAfter: 'order-accepted',
        finalizeReceipt: false,
      });

      const goodsReceiptId = await runGoodsReceipt(driver, api, {
        invoiceFixture: 'nfe-divergence-alta.pdf',
        finalize: false,
        stopAtDiscrepancies: true,
      });

      await waitForText(driver, 'Alta');
      await findByTestId(driver, 'gr-discrepancy-select-all');
      await clickByTestId(driver, 'gr-discrepancy-select-all');

      const justification = await findByTestId(driver, 'gr-discrepancy-bulk-justification');
      await justification.clear();
      await justification.sendKeys('Justificativa E2E em lote');

      const acceptBtn = await findByTestId(driver, 'gr-discrepancy-bulk-accept');
      await driver.wait(until.elementIsEnabled(acceptBtn), 10000);
      await acceptBtn.click();

      await waitForText(driver, 'Confirmar aceite');
      await clickByTestId(driver, 'gr-discrepancy-bulk-confirm');

      await driver.wait(async () => {
        const resolvedBadges = await driver.findElements(
          By.xpath("//*[contains(normalize-space(.), 'Resolvida')]"),
        );
        return resolvedBadges.length > 0;
      }, 30000);

      const receipt = await api.getGoodsReceipt(goodsReceiptId);
      const discrepancies = receipt.discrepancies as DiscrepancyRow[];
      expect(discrepancies.length).toBeGreaterThan(0);

      const eligible = discrepancies.filter((d) => String(d.severity) !== 'CRITICAL');
      const critical = discrepancies.filter((d) => String(d.severity) === 'CRITICAL');

      expect(eligible.length).toBeGreaterThan(0);
      for (const d of eligible) {
        expect(d.resolved_at).toBeTruthy();
      }
      for (const d of critical) {
        expect(d.resolved_at == null || d.resolved_at === '').toBe(true);
      }
    },
    360000,
  );
});
