import {
  createSupplyRequest,
  e2eLogin,
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
 * Garante saldo (happy path de compras) + ≥1 DemandSupply listável na admin.
 * `runProcurementHappyPath` já chama `e2eReset`.
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

    return e2eLogin('usuario@example.com', password).then(({ token }) =>
      createSupplyRequest(token, {
        supply_id: procurement.supplyId,
        quantity: 1,
        destination: ADMIN_DEMAND_SUPPLY_DESTINATION,
      }).then((created) => {
        state.supplyRequestId = created.id;
        return state;
      }),
    );
  });
}
