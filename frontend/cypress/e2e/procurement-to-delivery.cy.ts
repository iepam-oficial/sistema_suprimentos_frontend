import { getSupplyRequest } from '../support/api';
import { runProcurementHappyPath } from './flows/procurementHappyPath';
import { runSupplyRequestDelivery } from './flows/supplyRequestDelivery';

describe('procurement to delivery', () => {
  it('completa compras até entrega DELIVERED ao solicitante', () => {
    runProcurementHappyPath().then((procurement) => {
      runSupplyRequestDelivery(procurement.supplyId, 2).then((delivery) => {
        getSupplyRequest(delivery.supplyRequestId).then((request) => {
          expect(request.status).to.eq('DELIVERED');
        });
      });
    });
  });
});
