import { type WebDriver } from 'selenium-webdriver';
import { getBaseUrl, getE2ePassword } from '../helpers/constants';
import { E2eApiClient } from '../helpers/apiClient';
import { loginAs, logout } from '../helpers/auth';
import { clickByText, clickByTestId } from '../helpers/driver';
import { step } from '../helpers/step';
import { waitForText } from '../helpers/wait';

export interface SupplyRequestDeliveryResult {
  supplyRequestId: string;
}

export async function runSupplyRequestDelivery(
  driver: WebDriver,
  api: E2eApiClient,
  supplyId: string,
  quantity = 2,
): Promise<SupplyRequestDeliveryResult> {
  const password = getE2ePassword();
  const balanceBefore = await api.getSupplyBalance(supplyId);

  const { token: employeeToken } = await api.login('usuario@example.com', password);
  const created = await api.createSupplyRequest(employeeToken, {
    supply_id: supplyId,
    quantity,
    destination: 'Setor Manutenção E2E',
  });

  await step('Supply request: aprovar', async () => {
    await loginAs(driver, 'MANAGER');
    await driver.get(`${getBaseUrl()}/supply-requests/admin`);
    await clickByText(driver, 'Suprimentos');
    await clickByText(driver, 'Aprovar');
    await waitForText(driver, 'Sucesso');
    await logout(driver);
  });

  await step('Supply request: confirmar recebimento (requerente)', async () => {
    await loginAs(driver, 'EMPLOYEE');
    await driver.get(`${getBaseUrl()}/supply-requests`);
    await clickByText(driver, 'Minhas Requisições');
    await clickByTestId(driver, 'sr-requester-confirm');
    await waitForText(driver, 'Sucesso');
    await logout(driver);
  });

  await step('Supply request: confirmar entrega (gerente)', async () => {
    await loginAs(driver, 'MANAGER');
    await driver.get(`${getBaseUrl()}/supply-requests/admin`);
    await clickByText(driver, 'Suprimentos');
    await clickByTestId(driver, 'sr-manager-confirm');
    await waitForText(driver, 'Sucesso');
    await logout(driver);
  });

  const request = await api.getSupplyRequest(created.id);
  expect(request.status).toBe('DELIVERED');
  expect(request.requester_confirmation).toBe(true);
  expect(request.manager_delivery_confirmation).toBe(true);

  const balanceAfter = await api.getSupplyBalance(supplyId);
  expect(balanceAfter.balance).toBeLessThan(balanceBefore.balance);

  return { supplyRequestId: created.id };
}
