import type { WebDriver } from 'selenium-webdriver';
import { E2eApiClient } from '../helpers/apiClient';
import { createDriver, quitDriver } from '../helpers/driver';
import { describeE2E } from '../helpers/describeE2E';
import { runProcurementHappyPath } from '../flows/procurementHappyPath';
import { runSupplyRequestDelivery } from '../flows/supplyRequestDelivery';

describeE2E('procurement to delivery', () => {
  let driver: WebDriver;
  const api = new E2eApiClient();

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('completa compras até entrega DELIVERED ao solicitante', async () => {
    const procurement = await runProcurementHappyPath(driver, api);
    const delivery = await runSupplyRequestDelivery(driver, api, procurement.supplyId, 2);

    const request = await api.getSupplyRequest(delivery.supplyRequestId);
    expect(request.status).toBe('DELIVERED');
  });
});
