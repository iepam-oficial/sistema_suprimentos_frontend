import { getByXPath } from '../../support/xpath';

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
  {
    unitPrice: 25.5,
    delivery: 5,
    payment: 30,
    freight: 10,
    taxes: 5,
    withBoleto: true,
    installments: 1,
  },
  { unitPrice: 28, delivery: 10, payment: 20, freight: 15, taxes: 8, withBoleto: false },
  {
    unitPrice: 30,
    delivery: 15,
    payment: 15,
    freight: 20,
    taxes: 10,
    withBoleto: true,
    installments: 3,
  },
];

function fillNumberByLabel(label: string, value: number): void {
  getByXPath(`//label[contains(.,'${label}')]/following::input[1]`)
    .clear()
    .type(String(value));
}

function fillCurrencyByLabel(label: string, value: number): void {
  const formatted = value.toFixed(2).replace('.', ',');
  getByXPath(`//label[contains(.,'${label}')]/following::input[1]`)
    .clear()
    .type(formatted)
    .blur();
}

function selectPaymentMethod(label: string): void {
  cy.contains('label', label).then(($label) => {
    const $checkbox = $label.find('input[type="checkbox"]');
    if (!$checkbox.is(':checked')) {
      cy.wrap($label).click();
    }
  });
}

export function fillProposalForm(profile: ProposalProfile): void {
  cy.clickByText('Minha proposta');
  cy.waitForText('Dados da proposta');

  fillNumberByLabel('Entrega (dias)', profile.delivery);

  if (profile.withBoleto) {
    selectPaymentMethod('Boleto a prazo');
    fillNumberByLabel('Carência', profile.payment);
    fillNumberByLabel('Nº de parcelas', profile.installments ?? 1);
  } else {
    selectPaymentMethod('PIX');
  }

  fillCurrencyByLabel('Frete', profile.freight);
  fillCurrencyByLabel('Impostos', profile.taxes);

  // Column order: Descrição | Qtd | Preço unit. | Total — avoid first tbody input (description).
  cy.contains('th', 'Preço unit')
    .parents('table')
    .find('tbody tr')
    .first()
    .find('td')
    .eq(2)
    .find('input')
    .clear()
    .type(profile.unitPrice.toFixed(2).replace('.', ','))
    .blur();
}

export function submitPortalProposal(
  token: string,
  profileIndex: number,
  profiles: ProposalProfile[] = DEFAULT_PROPOSAL_PROFILES,
): void {
  const profile = profiles[profileIndex] ?? profiles[0];
  cy.visit(`/portal/cotacao/${token}`, { timeout: 120000 });
  cy.clickByText('Aceitar convite');
  cy.waitForText('Dados da proposta');
  fillProposalForm(profile);
  cy.intercept('POST', '**/proposal').as('submitProposal');
  cy.clickByText('Enviar proposta');
  cy.wait('@submitProposal', { timeout: 90000 })
    .its('response.statusCode')
    .should('be.oneOf', [200, 201]);
  cy.waitForText('Proposta enviada', 60000);
}

export function submitAllPortalProposals(
  tokens: string[],
  profiles: ProposalProfile[] = DEFAULT_PROPOSAL_PROFILES,
): void {
  tokens.forEach((token, i) => {
    submitPortalProposal(token, i, profiles);
  });
}
