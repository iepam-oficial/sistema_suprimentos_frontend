import { e2eReset } from '../support/api';
import {
  deleteSupplierRow,
  editSupplierRow,
  fillSupplierModal,
  openNewSupplierModal,
  submitCreateSupplier,
  submitUpdateSupplier,
  uniqueCnpjDigits,
} from '../support/forms/supplierForm';

describe('Cadastro de fornecedores (settings)', () => {
  beforeEach(() => {
    e2eReset();
    cy.loginAs('MANAGER');
  });

  it('cria, edita e exclui fornecedor', () => {
    const ts = Date.now();
    const name = `Fornecedor Cadastro E2E ${ts}`;
    const editedName = `${name} Editado`;
    const cnpjDigits = uniqueCnpjDigits(ts);
    const email = `e2e-supplier-new-${ts}@test.local`;

    cy.visit('/settings/suppliers', { timeout: 120000 });
    cy.contains('Configurações de Fornecedores', { timeout: 90000 }).should('be.visible');
    cy.contains('button', 'Adicionar Fornecedor', { timeout: 60000 }).should('be.visible');

    cy.log('Criar');
    cy.intercept('POST', '**/api/suppliers').as('createSupplier');
    openNewSupplierModal();
    fillSupplierModal({
      name,
      cnpjDigits,
      email,
      phoneDigits: '11987654321',
      address: `Rua E2E ${ts}, 100`,
      contactPerson: 'Contato E2E',
    });
    submitCreateSupplier();
    cy.wait('@createSupplier', { timeout: 60000 }).its('response.statusCode').should('eq', 201);
    cy.waitForText('Fornecedor criado com sucesso', 30000);
    cy.contains('tr', name, { timeout: 30000 }).should('be.visible');
    cy.contains('tr', name).should('contain', email);

    cy.log('Editar');
    cy.intercept('PUT', '**/api/suppliers/*').as('updateSupplier');
    editSupplierRow(name);
    cy.get('.chakra-modal__content').within(() => {
      cy.get('input[placeholder="Nome da empresa"]').clear().type(editedName);
      cy.get('input[placeholder="Nome do contato"]').clear().type('Contato E2E Atualizado');
    });
    submitUpdateSupplier();
    cy.wait('@updateSupplier', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
    cy.waitForText('Fornecedor atualizado com sucesso', 30000);
    cy.contains('tr', editedName, { timeout: 30000 }).should('be.visible');
    cy.contains('tr', editedName).should('contain', 'Contato E2E Atualizado');

    cy.log('Excluir');
    cy.on('window:confirm', () => true);
    cy.intercept('DELETE', '**/api/suppliers/*').as('deleteSupplier');
    deleteSupplierRow(editedName);
    cy.wait('@deleteSupplier', { timeout: 60000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 204]);
    cy.waitForText('Fornecedor excluído com sucesso', 30000);
    cy.contains('tr', editedName).should('not.exist');
  });

  it('rejeita criação com CNPJ duplicado', () => {
    const ts = Date.now();
    const name = `Fornecedor Dup CNPJ E2E ${ts}`;

    cy.visit('/settings/suppliers', { timeout: 120000 });
    cy.contains('Configurações de Fornecedores', { timeout: 90000 }).should('be.visible');
    cy.contains('button', 'Adicionar Fornecedor', { timeout: 60000 }).should('be.visible');

    // Seeded by e2eReset: Fornecedor E2E A → 11.111.111/0001-11
    // BFF wraps backend `{ message }` as `{ error }`; UI falls back to "Erro ao salvar fornecedor".
    cy.intercept('POST', '**/api/suppliers').as('createDuplicateSupplier');
    openNewSupplierModal();
    fillSupplierModal({
      name,
      cnpjDigits: '11111111000111',
      email: `e2e-supplier-dup-${ts}@test.local`,
      phoneDigits: '11999998888',
      address: `Rua Dup ${ts}`,
      contactPerson: 'Contato Dup',
    });
    submitCreateSupplier();
    cy.wait('@createDuplicateSupplier', { timeout: 60000 })
      .its('response.statusCode')
      .should('eq', 500);
    cy.waitForText('Erro ao salvar fornecedor', 30000);
    cy.contains('tr', name).should('not.exist');
  });
});
