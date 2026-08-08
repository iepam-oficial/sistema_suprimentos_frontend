import { E2E_ITEM_DESCRIPTION } from '../constants';
import { getByXPath } from '../xpath';

export function selectChartAccount(search: string, label: string): void {
  cy.get('input[placeholder="Buscar plano de contas"]').clear().type(search);
  cy.wait(400);
  cy.contains('li', label, { timeout: 10000 }).trigger('mousedown');
  cy.wait(200);
}

/** SCDEL-01 — destino + prazo no passo Dados gerais (obrigatórios no create/submit). */
export function fillPurchaseRequestDeliveryFields(
  destination = 'Setor Manutenção E2E',
  deadlineDaysFromToday = 14,
): void {
  // Civil date in local TZ — avoid UTC off-by-one from toISOString().
  const deadline = new Date();
  deadline.setHours(12, 0, 0, 0);
  deadline.setDate(deadline.getDate() + deadlineDaysFromToday);
  const yyyy = deadline.getFullYear();
  const mm = String(deadline.getMonth() + 1).padStart(2, '0');
  const dd = String(deadline.getDate()).padStart(2, '0');
  const yyyyMmDd = `${yyyy}-${mm}-${dd}`;

  cy.contains('label', 'Destino da entrega', { timeout: 15000 })
    .parent()
    .find('input:not([type="date"])')
    .clear()
    .type(destination)
    .should('have.value', destination);

  // Chrome date inputs are flaky with .type(); set value + React onChange events.
  cy.contains('label', 'Prazo de entrega', { timeout: 15000 })
    .parent()
    .find('input[type="date"]')
    .then(($input) => {
      const el = $input[0] as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )?.set;
      setter?.call(el, yyyyMmDd);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    })
    .should('have.value', yyyyMmDd);
}

/** Confirma o modal de submit da SC (Chakra portal — force click). */
export function confirmPurchaseRequestSubmit(): void {
  cy.get('[role="dialog"]', { timeout: 15000 }).should('be.visible');
  cy.contains('[role="dialog"] button', 'Confirmar envio', { timeout: 15000 })
    .should('be.visible')
    .should('not.be.disabled')
    .click({ force: true });
}

export function fillPurchaseRequestItemsStep(
  description = E2E_ITEM_DESCRIPTION,
  quantity = '10',
): void {
  cy.clickByText('Próximo');
  cy.get('input[placeholder="Descrição do item"]', { timeout: 20000 })
    .clear()
    .type(description);
  cy.wait(600);
  // Prefer catalog selection when the seeded supply appears; otherwise keep free text.
  cy.get('body').then(($body) => {
    const hasSuggestion = $body.find(`ul li:contains("${description}")`).length > 0;
    if (hasSuggestion) {
      cy.contains('ul li', description, { timeout: 15000 }).trigger('mousedown');
    } else {
      cy.get('input[placeholder="Descrição do item"]').blur();
    }
  });

  // Chakra NumberInput coerces empty → 1 (`value || 1`), so clear/backspace then
  // type("10") appends onto "1" → 110. Replace selection in one shot instead.
  cy.get('table tbody tr')
    .first()
    .find('td')
    .eq(1)
    .find('input')
    .click({ force: true })
    .type(`{selectall}${quantity}`, { force: true })
    .blur();
  cy.get('table tbody tr')
    .first()
    .find('td')
    .eq(1)
    .find('input')
    .should('have.value', quantity);
  cy.wait(200);

  cy.get('table tbody tr')
    .first()
    .find('td')
    .eq(2)
    .find('select')
    .then(($select) => {
      const value = $select.val();
      if (!value) {
        const $un = $select.find('option[value="un"]');
        if ($un.length) {
          cy.wrap($select).select('un', { force: true });
        } else {
          const first = $select
            .find('option')
            .filter((_, el) => Boolean((el as HTMLOptionElement).value.trim()))
            .first()
            .val() as string;
          if (first) {
            cy.wrap($select).select(first, { force: true });
          }
        }
      }
    });

  cy.wait(300);
}

export function advancePurchaseRequestToReview(): void {
  getByXPath("//button[contains(normalize-space(.), 'Próximo')]", { timeout: 10000 })
    .should('be.enabled')
    .click();
  getByXPath("//button[contains(normalize-space(.), 'Submeter')]", { timeout: 15000 }).should(
    'be.visible',
  );
}

export function fillGoodsReceiptPhysicalLine(
  description = E2E_ITEM_DESCRIPTION,
  quantity = '10',
): void {
  cy.contains('Registre os itens recebidos fisicamente', { timeout: 60000 }).should('be.visible');
  cy.intercept('GET', '**/api/procurement/catalog-search**').as('catalogSearchPhysical');
  cy.get('input[placeholder="Descrição do item"]', { timeout: 60000 })
    .should('be.visible')
    .clear()
    .type(description.slice(0, Math.min(8, description.length)));
  cy.wait('@catalogSearchPhysical', { timeout: 60000 })
    .its('response.statusCode')
    .should('eq', 200);
  cy.contains('ul li', description, { timeout: 30000 }).should('be.visible').trigger('mousedown');
  cy.wait(300);
  cy.get('table tbody tr')
    .first()
    .find('td')
    .eq(1)
    .find('input')
    .click({ force: true })
    .type(`{selectall}${quantity}`, { force: true })
    .blur();
  cy.get('table tbody tr')
    .first()
    .find('td')
    .eq(1)
    .find('input')
    .should('have.value', quantity);
}

export function fixturePath(fileName: string): string {
  return `tests/fixtures/${fileName}`;
}
