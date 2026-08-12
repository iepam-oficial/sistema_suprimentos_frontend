import {
  createInventoryAllocation,
  createPurchaseRequest,
  createServiceOrder,
  createSupplyBatch,
  e2eLogin,
  e2eReset,
  e2eSeedStandbyInventory,
  listInventoryAllocations,
  listPurchaseRequests,
  listSupplyBatches,
} from '../support/api';
import {
  civilDateKeyFromIso,
  formatCivilDateBRFromKey,
  parseCivilDateOnlyToIso,
  todayLocalIsoDate,
} from '../support/civilDate';
import { getE2ePassword } from '../support/constants';

describe('civil-date timezone fixes', () => {
  const password = getE2ePassword();
  const today = todayLocalIsoDate();
  const todayBr = formatCivilDateBRFromKey(today);
  const purchasedAtIso = parseCivilDateOnlyToIso(today);
  const expiryKey = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return todayLocalIsoDate(d);
  })();
  const expiresAtIso = parseCivilDateOnlyToIso(expiryKey);

  beforeEach(() => {
    e2eReset().then((result) => {
      expect(result.ok, 'e2e reset').to.eq(true);
      expect(result.supplyId).to.be.a('string').and.not.be.empty;
      expect(result.supplierIds?.length ?? 0).to.be.greaterThan(0);
      cy.wrap(result).as('seed');
    });
  });

  it('DATE-02: lote com purchased_at civil SP não sofre off-by-one na API nem na lista', function () {
    cy.get<Awaited<ReturnType<typeof e2eReset>>>('@seed').then((seed) => {
      e2eLogin('gerente@example.com', password).then(({ token }) => {
        createSupplyBatch(token, {
          supply_id: seed.supplyId,
          supplier_id: seed.supplierIds[0],
          purchased_quantity: 3,
          unit_price: 12.5,
          purchased_at: purchasedAtIso,
          expires_at: expiresAtIso,
          notes: 'E2E civil-date batch',
        }).then((batch) => {
          expect(civilDateKeyFromIso(batch.purchased_at)).to.eq(today);
          expect(civilDateKeyFromIso(String(batch.expires_at))).to.eq(expiryKey);

          listSupplyBatches(token).then((batches) => {
            const found = batches.find((b) => b.id === batch.id);
            expect(found, 'lote na listagem API').to.exist;
            expect(civilDateKeyFromIso(found!.purchased_at)).to.eq(today);
          });

          cy.loginAs('MANAGER');
          cy.visit('/supplies', { timeout: 120000 });
          cy.contains('button, [role="tab"]', 'Lotes', { timeout: 30000 }).click();
          cy.contains('td, span, p', todayBr, { timeout: 30000 }).should('be.visible');
        });
      });
    });
  });

  it('DATE-03: filtro SC created_to=hoje inclui SC criada hoje', function () {
    const deadline = parseCivilDateOnlyToIso(
      todayLocalIsoDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    );

    e2eLogin('coordenador@example.com', password).then(({ token }) => {
      createPurchaseRequest(token, {
        justification: 'E2E civil-date filtro created_to',
        destination: 'Almoxarifado E2E',
        delivery_deadline: deadline,
        items: [{ description: 'Item civil-date', quantity: 1, unit: 'UN' }],
      }).then((created) => {
        expect(civilDateKeyFromIso(created.created_at)).to.eq(today);

        listPurchaseRequests(token, { created_from: today, created_to: today }).then((list) => {
          const match = list.items.find((item) => item.id === created.id);
          expect(match, 'SC no filtro inclusivo do dia civil').to.exist;
        });
      });
    });
  });

  it('DATE-01: alocação expõe created_at ISO e UI não mostra Não definida', function () {
    const returnDate = parseCivilDateOnlyToIso(
      todayLocalIsoDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
    );
    const deliveryDeadline = parseCivilDateOnlyToIso(
      todayLocalIsoDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
    );

    e2eSeedStandbyInventory().then((item) => {
      e2eLogin('gerente@example.com', password).then(({ token }) => {
        createInventoryAllocation(token, {
          inventory_id: item.id,
          destination: 'Setor E2E Civil',
          return_date: returnDate,
          delivery_deadline: deliveryDeadline,
          notes: 'E2E civil-date allocation',
        }).then((allocation) => {
          expect(allocation.created_at, 'created_at obrigatório').to.be.a('string').and.not.be
            .empty;
          expect(allocation.created_at).to.match(/^\d{4}-\d{2}-\d{2}T/);
          expect(civilDateKeyFromIso(allocation.created_at)).to.eq(today);

          listInventoryAllocations(token).then((rows) => {
            const found = rows.find((row) => row.id === allocation.id);
            expect(found?.created_at, 'lista API com created_at').to.be.a('string').and.not.be
              .empty;
          });

          cy.loginAs('MANAGER');
          cy.visit('/supply-requests/admin', { timeout: 120000 });
          cy.get('[data-testid="admin-tab-alocacoes"]', { timeout: 30000 }).click();
          cy.contains('Não definida').should('not.exist');
          cy.contains(todayBr, { timeout: 30000 }).should('be.visible');
        });
      });
    });
  });

  it('DATE-04: OS entry_date civil SP bate com o dia escolhido', function () {
    const serial = `OS-CD-${Date.now()}`;
    e2eSeedStandbyInventory(serial).then((item) => {
      e2eLogin('gerente@example.com', password).then(({ token }) => {
        createServiceOrder(token, {
          entry_date: purchasedAtIso,
          serial_number: item.serial_number,
        }).then((order) => {
          expect(civilDateKeyFromIso(order.entry_date)).to.eq(today);

          cy.loginAs('MANAGER');
          cy.visit('/orders', { timeout: 120000 });
          cy.contains(todayBr, { timeout: 30000 }).should('be.visible');
        });
      });
    });
  });
});
