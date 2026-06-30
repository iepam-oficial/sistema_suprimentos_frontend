import { By, type WebDriver, type WebElement } from 'selenium-webdriver';
import { getBaseUrl } from '../helpers/constants';
import { clickByText, typeInto } from '../helpers/driver';
import { waitForText } from '../helpers/wait';

export interface ProposalProfile {
  unitPrice: number;
  delivery: number;
  payment: number;
  freight: number;
  taxes: number;
}

export const DEFAULT_PROPOSAL_PROFILES: ProposalProfile[] = [
  { unitPrice: 25.5, delivery: 5, payment: 30, freight: 10, taxes: 5 },
  { unitPrice: 28, delivery: 10, payment: 20, freight: 15, taxes: 8 },
  { unitPrice: 30, delivery: 15, payment: 15, freight: 20, taxes: 10 },
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

export async function fillProposalForm(
  driver: WebDriver,
  profile: ProposalProfile,
): Promise<void> {
  await clickByText(driver, 'Minha proposta');
  await waitForText(driver, 'Dados da proposta');

  await fillNumberByLabel(driver, 'Entrega (dias)', profile.delivery);
  await fillNumberByLabel(driver, 'Pagamento (dias)', profile.payment);

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
