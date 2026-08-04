export type SupplierFormInput = {
  name: string;
  /** 14 digits — UI mask applies formatting */
  cnpjDigits: string;
  email: string;
  /** 10–11 digits — UI mask applies formatting */
  phoneDigits: string;
  address: string;
  contactPerson: string;
};

/** Builds a 14-digit CNPJ distinct from seeded E2E A/B/C (11/22/33…). */
export function uniqueCnpjDigits(seed = Date.now()): string {
  const tail = String(seed).padStart(12, '0').slice(-12);
  return `44${tail}`.slice(0, 14);
}

function supplierModal(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('.chakra-modal__content', { timeout: 15000 }).should('be.visible');
}

export function openNewSupplierModal(): void {
  cy.contains('h2, h3, .chakra-heading', 'Configurações de Fornecedores', { timeout: 30000 });
  cy.contains('button', 'Adicionar Fornecedor', { timeout: 30000 })
    .should('be.visible')
    .and('not.be.disabled')
    .click({ force: true });
  cy.contains('.chakra-modal__header', 'Novo Fornecedor', { timeout: 15000 }).should(
    'be.visible',
  );
}

export function fillSupplierModal(data: SupplierFormInput): void {
  supplierModal().within(() => {
    cy.get('input[placeholder="Nome da empresa"]').clear().type(data.name);
    cy.get('input[placeholder="00.000.000/0000-00"]')
      .clear()
      .type(data.cnpjDigits, { delay: 15 });
    cy.get('input[placeholder="email@empresa.com"]').clear().type(data.email);
    cy.get('input[placeholder="(00) 00000-0000"]')
      .clear()
      .type(data.phoneDigits, { delay: 15 });
    cy.get('input[placeholder="Endereço completo"]').clear().type(data.address);
    cy.get('input[placeholder="Nome do contato"]').clear().type(data.contactPerson);
  });
}

export function submitCreateSupplier(): void {
  supplierModal().within(() => {
    cy.contains('button[type="submit"]', 'Adicionar Fornecedor').click();
  });
}

export function submitUpdateSupplier(): void {
  supplierModal().within(() => {
    cy.contains('button[type="submit"]', 'Atualizar Fornecedor').click();
  });
}

export function editSupplierRow(name: string): void {
  cy.contains('tr', name, { timeout: 30000 })
    .should('be.visible')
    .within(() => {
      cy.get('button[aria-label="Editar fornecedor"]').click({ force: true });
    });
  cy.contains('.chakra-modal__header', 'Editar Fornecedor', { timeout: 15000 }).should(
    'be.visible',
  );
}

export function deleteSupplierRow(name: string): void {
  cy.contains('tr', name, { timeout: 30000 })
    .should('be.visible')
    .within(() => {
      cy.get('button[aria-label="Excluir fornecedor"]').click();
    });
}
