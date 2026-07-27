import { Builder, By, until, type WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import remote from 'selenium-webdriver/remote';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = path.join(__dirname, '..', 'artifacts');

export async function createDriver(): Promise<WebDriver> {
  const options = new chrome.Options();
  if (process.env.E2E_HEADLESS !== '0') {
    options.addArguments('--headless=new');
  }
  options.addArguments('--window-size=1440,900', '--no-sandbox', '--disable-dev-shm-usage');

  const builder = new Builder().forBrowser('chrome').setChromeOptions(options);
  const remoteUrl = process.env.SELENIUM_REMOTE_URL;
  if (remoteUrl) {
    builder.usingServer(remoteUrl);
  }
  const driver = await builder.build();
  // Permite sendKeys de caminho local no Grid remoto (upload de NF).
  if (remoteUrl) {
    driver.setFileDetector(new remote.FileDetector());
  }
  return driver;
}

export async function quitDriver(driver: WebDriver | undefined): Promise<void> {
  if (driver) {
    await driver.quit();
  }
}

export async function captureScreenshot(driver: WebDriver, name: string): Promise<void> {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  const image = await driver.takeScreenshot();
  const filePath = path.join(ARTIFACTS_DIR, `${name}-${Date.now()}.png`);
  fs.writeFileSync(filePath, image, 'base64');
}

export async function clickByText(driver: WebDriver, text: string): Promise<void> {
  const xpath = `//button[contains(normalize-space(.), '${text}')] | //a[contains(normalize-space(.), '${text}')]`;
  const el = await driver.wait(until.elementLocated(By.xpath(xpath)), 15000);
  await driver.wait(until.elementIsVisible(el), 10000);
  await el.click();
}

export async function clickByTestId(driver: WebDriver, testId: string): Promise<void> {
  const el = await driver.wait(
    until.elementLocated(By.css(`[data-testid="${testId}"]`)),
    15000,
  );
  await driver.wait(until.elementIsVisible(el), 10000);
  await el.click();
}

export async function findByTestId(driver: WebDriver, testId: string) {
  return driver.wait(until.elementLocated(By.css(`[data-testid="${testId}"]`)), 15000);
}

export async function typeInto(
  driver: WebDriver,
  locator: By,
  value: string,
  clear = true,
): Promise<void> {
  const el = await driver.wait(until.elementLocated(locator), 15000);
  await driver.wait(until.elementIsVisible(el), 10000);
  if (clear) {
    await el.clear();
  }
  await el.sendKeys(value);
}
