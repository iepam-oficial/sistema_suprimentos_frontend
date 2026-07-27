import { By, until, type WebDriver } from 'selenium-webdriver';
import { E2E_ITEM_DESCRIPTION } from './constants';
import { clickByText } from './driver';

export async function selectChartAccount(
  driver: WebDriver,
  search: string,
  label: string,
): Promise<void> {
  const input = await driver.findElement(By.css('input[placeholder="Buscar plano de contas"]'));
  await input.clear();
  await input.sendKeys(search);
  await driver.sleep(400);
  const option = await driver.wait(
    until.elementLocated(By.xpath(`//li[contains(.,'${label}')]`)),
    10000,
  );
  await driver.executeScript(
    "arguments[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));",
    option,
  );
  await driver.sleep(200);
}

export async function fillPurchaseRequestItemsStep(
  driver: WebDriver,
  description = E2E_ITEM_DESCRIPTION,
  quantity = '10',
): Promise<void> {
  await clickByText(driver, 'Próximo');
  await driver.wait(
    until.elementLocated(By.css('input[placeholder="Descrição do item"]')),
    20000,
  );

  const descInput = await driver.findElement(By.css('input[placeholder="Descrição do item"]'));
  await descInput.clear();
  await descInput.sendKeys(description);
  await descInput.sendKeys('\t');

  const unitSelect = await driver.findElement(
    By.xpath("//th[contains(.,'Unidade')]/ancestor::table//select"),
  );
  const unitValue = await unitSelect.getAttribute('value');
  if (!unitValue) {
    try {
      await unitSelect.findElement(By.xpath(".//option[@value='un']")).click();
    } catch {
      await unitSelect.findElement(By.xpath(".//option[normalize-space(@value) != ''][1]")).click();
    }
  }

  const qtyInput = await driver.wait(
    until.elementLocated(By.xpath("//th[contains(.,'Quantidade')]/ancestor::table//input")),
    10000,
  );
  await qtyInput.clear();
  await qtyInput.sendKeys(quantity);
  await qtyInput.sendKeys('\t');
  await driver.sleep(300);
}

export async function advancePurchaseRequestToReview(driver: WebDriver): Promise<void> {
  const nextButton = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(normalize-space(.), 'Próximo')]")),
    10000,
  );
  await driver.wait(async () => nextButton.isEnabled(), 10000);
  await nextButton.click();
  await driver.wait(
    until.elementLocated(By.xpath("//button[contains(normalize-space(.), 'Submeter')]")),
    15000,
  );
}

export async function fillGoodsReceiptPhysicalLine(
  driver: WebDriver,
  description = E2E_ITEM_DESCRIPTION,
  quantity = '10',
): Promise<void> {
  await driver.wait(
    until.elementLocated(By.css('input[placeholder="Descrição do item"]')),
    20000,
  );
  const descInput = await driver.findElement(By.css('input[placeholder="Descrição do item"]'));
  await descInput.clear();
  await descInput.sendKeys(description.slice(0, Math.min(8, description.length)));
  await driver.sleep(600);

  const suggestion = await driver.wait(
    until.elementLocated(By.xpath(`//ul//li[contains(.,'${description}')]`)),
    15000,
  );
  await driver.executeScript(
    "arguments[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));",
    suggestion,
  );
  await driver.sleep(300);

  const qtyInput = await driver.wait(
    until.elementLocated(By.xpath("//th[contains(.,'Qtd recebida')]/ancestor::table//input")),
    10000,
  );
  await qtyInput.clear();
  await qtyInput.sendKeys(quantity);
}
