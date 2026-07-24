import { By, type WebDriver } from 'selenium-webdriver';
import { getBaseUrl } from '../helpers/constants';
import { clickByText, typeInto } from '../helpers/driver';
import { waitForText } from '../helpers/wait';

export async function respondToPortalOrder(
  driver: WebDriver,
  token: string,
  accept: boolean,
): Promise<void> {
  await driver.get(`${getBaseUrl()}/portal/pedido/${token}`);

  if (accept) {
    await clickByText(driver, 'Aceitar pedido');
    await waitForText(driver, 'Você aceitou este pedido');
    return;
  }

  await clickByText(driver, 'Recusar pedido');
  await typeInto(
    driver,
    By.css('textarea'),
    'Indisponibilidade de estoque — teste E2E',
  );
  await clickByText(driver, 'Confirmar recusa');
  await waitForText(driver, 'Você recusou este pedido');
}
