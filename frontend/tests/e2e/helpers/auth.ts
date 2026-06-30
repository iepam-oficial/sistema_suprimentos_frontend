import { By, type WebDriver } from 'selenium-webdriver';
import path from 'node:path';
import { E2E_USERS, getBaseUrl, getE2ePassword, type E2eRole } from './constants';
import { typeInto } from './driver';
import { waitForUrlContains } from './wait';

const POST_LOGIN_PATH: Record<E2eRole, string> = {
  COORDINATOR: '/procurement/solicitacoes',
  DIRECTOR: '/procurement/aprovacoes-sc',
  MANAGER: '/dashboard',
  EMPLOYEE: '/supply-requests',
};

export async function loginAs(driver: WebDriver, role: E2eRole): Promise<void> {
  const user = E2E_USERS[role];
  const password = getE2ePassword();

  await driver.get(getBaseUrl());
  await typeInto(driver, By.css('input[placeholder="Seu e-mail"]'), user.email);
  await typeInto(driver, By.css('input[placeholder="Sua senha"]'), password);
  await driver.findElement(By.xpath("//button[contains(.,'Entrar')]")).click();
  await waitForUrlContains(driver, POST_LOGIN_PATH[role]);
}

export async function logout(driver: WebDriver): Promise<void> {
  await driver.manage().deleteAllCookies();
  await driver.executeScript(
    "['@ti-assistant:token','@ti-assistant:user','@ti-assistant:refreshToken'].forEach((k) => localStorage.removeItem(k));",
  );
}

export function fixturePath(fileName: string): string {
  return path.resolve(__dirname, '..', '..', 'fixtures', fileName);
}
