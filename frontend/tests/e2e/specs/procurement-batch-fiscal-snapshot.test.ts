import type { WebDriver } from 'selenium-webdriver';
import { E2eApiClient } from '../helpers/apiClient';
import {
  E2E_ITEM_CFOP,
  E2E_ITEM_COMMERCIAL_UNIT,
  E2E_ITEM_CST,
  E2E_USERS,
  getBaseUrl,
  getE2ePassword,
} from '../helpers/constants';
import { createDriver, quitDriver } from '../helpers/driver';
import { describeE2E } from '../helpers/describeE2E';
import { loginAs, logout } from '../helpers/auth';
import { waitForText } from '../helpers/wait';
import { runProcurementHappyPath } from '../flows/procurementHappyPath';

describeE2E('procurement batch fiscal snapshot', () => {
  let driver: WebDriver;
  const api = new E2eApiClient();

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver(driver);
  });

  it(
    'após happy path, GET lote e detalhe UI expõem CFOP do snapshot fiscal',
    async () => {
      const result = await runProcurementHappyPath(driver, api);

      const balance = await api.getSupplyBalance(result.supplyId);
      expect(balance.balance).toBeGreaterThan(0);
      expect(balance.batches.length).toBeGreaterThan(0);

      const batchId = balance.batches[0]?.id;
      expect(batchId).toBeTruthy();

      const { token } = await api.login(E2E_USERS.MANAGER.email, getE2ePassword());
      const batch = await api.getSupplyBatch(token, batchId!);

      expect(batch.fiscal_lines?.length).toBeGreaterThan(0);
      const fiscalLine = batch.fiscal_lines!.find((line) => line.cfop === E2E_ITEM_CFOP);
      expect(fiscalLine).toBeTruthy();
      expect(fiscalLine!.cst).toBe(E2E_ITEM_CST);
      expect(fiscalLine!.commercial_unit).toBe(E2E_ITEM_COMMERCIAL_UNIT);
      expect(batch.fiscal_incomplete).toBe(false);

      await loginAs(driver, 'MANAGER');
      await driver.get(`${getBaseUrl()}/supplies/batches/${batchId}`);
      await waitForText(driver, 'Snapshot fiscal', 20000);
      await waitForText(driver, E2E_ITEM_CFOP, 10000);
      await logout(driver);
    },
    360000,
  );
});
