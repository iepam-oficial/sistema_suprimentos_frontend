import { By, type WebDriver } from 'selenium-webdriver';
import { getBaseUrl, getE2ePassword } from '../helpers/constants';
import { E2eApiClient } from '../helpers/apiClient';
import { loginAs } from '../helpers/auth';
import { createDriver, quitDriver } from '../helpers/driver';
import { describeE2E } from '../helpers/describeE2E';
import { runProcurementHappyPath } from '../flows/procurementHappyPath';
import { respondToPortalOrder } from '../flows/portalOrderResponse';

describeE2E('order declined', () => {
  let driver: WebDriver;
  const api = new E2eApiClient();

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await quitDriver(driver);
  });

  it('impede recebimento quando fornecedor recusa pedido', async () => {
    const result = await runProcurementHappyPath(driver, api, { stopAfter: 'order-sent' });

    const portalToken = await api.getOrderPortalToken(result.orderId);
    await respondToPortalOrder(driver, portalToken, false);

    const { token } = await api.login('gerente@example.com', process.env.DEV_SEED_PASSWORD ?? 'e2e-dev-password-min12');
    const orders = await api.listPurchaseOrders(token);
    const order = orders.items.find((item) => item.id === result.orderId);
    expect(order?.status).toBe('DECLINED');

    await loginAs(driver, 'MANAGER');
    await driver.get(`${getBaseUrl()}/procurement/pedidos`);
    const receiptButtons = await driver.findElements(
      By.xpath("//button[contains(.,'Iniciar recebimento')]"),
    );
    expect(receiptButtons.length).toBe(0);
  });
});
