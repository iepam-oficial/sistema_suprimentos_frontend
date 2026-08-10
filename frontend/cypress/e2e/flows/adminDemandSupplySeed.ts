import {
  e2eLogin,
  getDemandSupplyDetail,
  listDemandSuppliesByScOrigin,
} from '../../support/api';
import { getE2ePassword } from '../../support/constants';
import {
  runProcurementHappyPath,
  type ProcurementHappyPathResult,
} from './procurementHappyPath';

export const ADMIN_DEMAND_SUPPLY_DESTINATION = 'Setor Manutenção E2E';

export interface AdminDemandSupplySeedResult {
  supplyId: string;
  supplyRequestId: string;
  destination: string;
}

/**
 * Garante ≥1 DemandSupply listável na admin.
 *
 * Com destino obrigatório na SC, o finalize materializa DS/SR (ponte) e
 * compromete o saldo — não dá para criar outro `POST /supply-requests`.
 * Reutilizamos o item origem SC do happy path.
 */
export function ensureAdminDemandSupplyItem(): Cypress.Chainable<AdminDemandSupplySeedResult> {
  const password = getE2ePassword();
  const state: AdminDemandSupplySeedResult = {
    supplyId: '',
    supplyRequestId: '',
    destination: ADMIN_DEMAND_SUPPLY_DESTINATION,
  };

  return runProcurementHappyPath().then((procurement: ProcurementHappyPathResult) => {
    state.supplyId = procurement.supplyId;

    return e2eLogin('gerente@example.com', password).then(({ token }) =>
      listDemandSuppliesByScOrigin(token).then((list) => {
        const linked = list.items.filter(
          (item) => item.purchase_request_id === procurement.purchaseRequestId,
        );
        expect(linked.length, 'DS origem SC após happy path').to.be.greaterThan(0);
        expect(linked[0].destination).to.eq(ADMIN_DEMAND_SUPPLY_DESTINATION);

        return getDemandSupplyDetail(token, linked[0].id).then((detail) => {
          expect(detail.items.length, 'SR na DS origem SC').to.be.greaterThan(0);
          state.supplyRequestId = detail.items[0].id;
          return state;
        });
      }),
    );
  });
}
