import { until, type WebDriver } from 'selenium-webdriver';

export async function waitForUrlContains(
  driver: WebDriver,
  fragment: string,
  timeoutMs = 20000,
): Promise<void> {
  await driver.wait(async () => {
    const current = await driver.getCurrentUrl();
    return current.includes(fragment);
  }, timeoutMs);
}

export async function waitForText(
  driver: WebDriver,
  text: string,
  timeoutMs = 20000,
): Promise<void> {
  await driver.wait(async () => {
    const body = await driver.getPageSource();
    return body.includes(text);
  }, timeoutMs);
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
