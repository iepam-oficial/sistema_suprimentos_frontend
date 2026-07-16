import { By, type WebDriver, type WebElement } from 'selenium-webdriver';
import { getBaseUrl } from '../helpers/constants';
import { clickByText, typeInto } from '../helpers/driver';
import { waitForText } from '../helpers/wait';

export interface ProposalProfile {
  unitPrice: number;
  delivery: number;
  /** Used as boleto grace days when withBoleto is true */
  payment: number;
  freight: number;
  taxes: number;
  /** When true, select Boleto a prazo and fill grace/installments */
  withBoleto?: boolean;
  installments?: number;
}

export const DEFAULT_PROPOSAL_PROFILES: ProposalProfile[] = [
  { unitPrice: 25.5, delivery: 5, payment: 30, freight: 10, taxes: 5, withBoleto: true, installments: 1 },
  { unitPrice: 28, delivery: 10, payment: 20, freight: 15, taxes: 8, withBoleto: false },
  { unitPrice: 30, delivery: 15, payment: 15, freight: 20, taxes: 10, withBoleto: true, installments: 3 },
];

async function fillNumberByLabel(driver: WebDriver, label: string, value: number): Promise<void> {
  const input = await driver.findElement(
    By.xpath(`//label[contains(.,'${label}')]/following::input[1]`),
  );
  await input.clear();
  await input.sendKeys(String(value));
}

async function fillCurrencyInput(driver: WebDriver, input: WebElement, value: number): Promise<void> {
  const formatted = value.toFixed(2).replace('.', ',');
  await input.clear();
  await input.sendKeys(formatted);
  await input.sendKeys('\t');
}

async function selectPaymentMethod(driver: WebDriver, label: string): Promise<void> {
  const checkbox = await driver.findElement(
    By.xpath(`//label[contains(.,'${label}')]/preceding::input[@type='checkbox'][1] | //label[contains(.,'${label}')]//input[@type='checkbox']`),
  );
  const checked = await checkbox.isSelected();
  if (!checked) {
    await checkbox.click();
  }
}

export async function fillProposalForm(
  driver: WebDriver,
  profile: ProposalProfile,
): Promise<void> {
  await clickByText(driver, 'Minha proposta');
  await waitForText(driver, 'Dados da proposta');

  await fillNumberByLabel(driver, 'Entrega (dias)', profile.delivery);

  if (profile.withBoleto) {
    await selectPaymentMethod(driver, 'Boleto a prazo');
    await fillNumberByLabel(driver, 'Carência', profile.payment);
    await fillNumberByLabel(driver, 'Nº de parcelas', profile.installments ?? 1);
  } else {
    await selectPaymentMethod(driver, 'PIX');
  }

  const freightInput = await driver.findElement(
    By.xpath("//label[contains(.,'Frete')]/following::input[1]"),
  );
  await fillCurrencyInput(driver, freightInput, profile.freight);

  const taxesInput = await driver.findElement(
    By.xpath("//label[contains(.,'Impostos')]/following::input[1]"),
  );
  await fillCurrencyInput(driver, taxesInput, profile.taxes);

  const unitPriceInputs = await driver.findElements(
    By.xpath("//th[contains(.,'Preço unit')]/ancestor::table//tbody//input"),
  );
  if (unitPriceInputs.length > 0) {
    await fillCurrencyInput(driver, unitPriceInputs[0], profile.unitPrice);
  }
}

export async function submitPortalProposal(
  driver: WebDriver,
  token: string,
  profileIndex: number,
  profiles: ProposalProfile[] = DEFAULT_PROPOSAL_PROFILES,
): Promise<void> {
  const profile = profiles[profileIndex] ?? profiles[0];
  await driver.get(`${getBaseUrl()}/portal/cotacao/${token}`);
  await clickByText(driver, 'Aceitar convite');
  await waitForText(driver, 'Dados da proposta');
  await fillProposalForm(driver, profile);
  await clickByText(driver, 'Enviar proposta');
  await waitForText(driver, 'Proposta enviada');
}

export async function submitAllPortalProposals(
  driver: WebDriver,
  tokens: string[],
  profiles: ProposalProfile[] = DEFAULT_PROPOSAL_PROFILES,
): Promise<void> {
  for (let i = 0; i < tokens.length; i += 1) {
    await submitPortalProposal(driver, tokens[i], i, profiles);
  }
}
