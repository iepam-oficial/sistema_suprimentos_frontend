import { getApiUrl, getE2eSecret } from './constants';

export interface ResetResult {
  ok: boolean;
  supplyId: string;
  supplierIds: string[];
}

function e2eHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-E2E-Secret': getE2eSecret(),
  };
}

function authHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export function e2eReset(): Cypress.Chainable<ResetResult> {
  return cy
    .request<ResetResult>({
      method: 'POST',
      url: `${getApiUrl()}/e2e/reset`,
      headers: e2eHeaders(),
      failOnStatusCode: true,
    })
    .then((res) => res.body);
}

export function e2eLogin(
  email: string,
  password: string,
): Cypress.Chainable<{ token: string; user: { id: string } }> {
  return cy
    .request<{ token: string; user: { id: string } }>({
      method: 'POST',
      url: `${getApiUrl()}/users/sessions`,
      headers: { 'Content-Type': 'application/json' },
      body: { email, password },
      failOnStatusCode: true,
    })
    .then((res) => res.body);
}

export function getQuotePortalTokens(
  quoteId: string,
): Cypress.Chainable<Record<string, string>> {
  return cy
    .request<{ byInviteId: Record<string, string> }>({
      method: 'GET',
      url: `${getApiUrl()}/e2e/procurement/quotes/${quoteId}/portal-tokens`,
      headers: e2eHeaders(),
    })
    .then((res) => res.body.byInviteId);
}

export function getOrderPortalToken(orderId: string): Cypress.Chainable<string> {
  return cy
    .request<{ token: string | null }>({
      method: 'GET',
      url: `${getApiUrl()}/e2e/procurement/orders/${orderId}/portal-token`,
      headers: e2eHeaders(),
    })
    .then((res) => {
      if (!res.body.token) {
        throw new Error(`Portal token not found for order ${orderId}`);
      }
      return res.body.token;
    });
}

export function getPurchaseRequest(id: string) {
  return cy
    .request<{ id: string; status: string }>({
      method: 'GET',
      url: `${getApiUrl()}/e2e/procurement/purchase-requests/${id}`,
      headers: e2eHeaders(),
    })
    .then((res) => res.body);
}

export function getGoodsReceipt(id: string) {
  return cy
    .request<{
      id: string;
      status: string;
      discrepancies: unknown[];
      invoiceLines: Array<{
        id: string;
        description: string;
        ncm_from_invoice: string | null;
        ncm_id: string | null;
        fiscalNcm: { code: string } | null;
      }>;
    }>({
      method: 'GET',
      url: `${getApiUrl()}/e2e/goods-receipts/${id}`,
      headers: e2eHeaders(),
    })
    .then((res) => res.body);
}

export function getSupplyBalance(supplyId: string) {
  return cy
    .request<{
      balance: number;
      batches: Array<{ id: string; purchased_quantity: number; origin: string | null }>;
    }>({
      method: 'GET',
      url: `${getApiUrl()}/e2e/supplies/${supplyId}/balance`,
      headers: e2eHeaders(),
    })
    .then((res) => res.body);
}

export function getSupplyBatch(token: string, batchId: string) {
  return cy
    .request<{
      id: string;
      origin?: string | null;
      fiscal_incomplete?: boolean;
      fiscal_lines?: Array<{
        id?: string;
        description: string;
        cfop: string | null;
        cst: string | null;
        commercial_unit: string | null;
      }>;
    }>({
      method: 'GET',
      url: `${getApiUrl()}/supply-batches/${batchId}`,
      headers: authHeaders(token),
    })
    .then((res) => res.body);
}

export function getSupplyFiscal(supplyId: string) {
  return cy
    .request<{
      id: string;
      ncm_id: string | null;
      fiscalNcm: { code: string } | null;
    }>({
      method: 'GET',
      url: `${getApiUrl()}/e2e/supplies/${supplyId}/fiscal`,
      headers: e2eHeaders(),
    })
    .then((res) => res.body);
}

export function getSupplyRequest(id: string) {
  return cy
    .request<{
      id: string;
      status: string;
      requester_confirmation: boolean;
      manager_delivery_confirmation: boolean;
    }>({
      method: 'GET',
      url: `${getApiUrl()}/e2e/supply-requests/${id}`,
      headers: e2eHeaders(),
    })
    .then((res) => res.body);
}

export function createSupplyRequest(
  token: string,
  input: {
    supply_id: string;
    quantity: number;
    destination: string;
  },
) {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);
  return cy
    .request<{ id: string; status: string }>({
      method: 'POST',
      url: `${getApiUrl()}/supply-requests`,
      headers: authHeaders(token),
      body: {
        ...input,
        delivery_deadline: deadline.toISOString(),
        notes: 'E2E supply request',
      },
    })
    .then((res) => res.body);
}

export function approveSupplyRequest(token: string, requestId: string) {
  return cy
    .request({
      method: 'PUT',
      url: `${getApiUrl()}/supply-requests/${requestId}`,
      headers: authHeaders(token),
      body: { status: 'APPROVED' },
    })
    .then((res) => res.body);
}

export function confirmRequesterSupplyRequest(token: string, requestId: string) {
  return cy
    .request({
      method: 'PATCH',
      url: `${getApiUrl()}/supply-requests/${requestId}/requester-confirmation`,
      headers: authHeaders(token),
      body: { confirmation: true },
    })
    .then((res) => res.body);
}

export function confirmManagerSupplyRequestDelivery(token: string, requestId: string) {
  return cy
    .request({
      method: 'PATCH',
      url: `${getApiUrl()}/supply-requests/${requestId}/manager-delivery-confirmation`,
      headers: authHeaders(token),
      body: { confirmation: true },
    })
    .then((res) => res.body);
}

export function listPurchaseOrders(token: string) {
  return cy
    .request<{ items: { id: string; status: string; display_code: string }[] }>({
      method: 'GET',
      url: `${getApiUrl()}/purchase-orders?limit=20`,
      headers: authHeaders(token),
    })
    .then((res) => res.body);
}

export function listPurchaseRequests(
  token: string,
  filters?: { status?: string; created_from?: string; created_to?: string; limit?: number },
) {
  const params = new URLSearchParams();
  params.set('limit', String(filters?.limit ?? 50));
  if (filters?.status) params.set('status', filters.status);
  if (filters?.created_from) params.set('created_from', filters.created_from);
  if (filters?.created_to) params.set('created_to', filters.created_to);
  return cy
    .request<{
      items: Array<{
        id: string;
        status: string;
        display_code: string;
        created_at: string;
      }>;
      total: number;
    }>({
      method: 'GET',
      url: `${getApiUrl()}/purchase-requests?${params.toString()}`,
      headers: authHeaders(token),
    })
    .then((res) => res.body);
}

export function createSupplyBatch(
  token: string,
  input: {
    supply_id: string;
    supplier_id: string;
    purchased_quantity: number;
    unit_price: number;
    purchased_at: string;
    expires_at?: string | null;
    notes?: string;
  },
) {
  return cy
    .request<{
      id: string;
      purchased_at: string;
      expires_at?: string | null;
      created_at?: string;
    }>({
      method: 'POST',
      url: `${getApiUrl()}/supply-batches`,
      headers: authHeaders(token),
      body: input,
    })
    .then((res) => {
      expect(res.status).to.eq(201);
      return res.body;
    });
}

export function listSupplyBatches(token: string) {
  return cy
    .request<
      Array<{
        id: string;
        purchased_at: string;
        expires_at?: string | null;
        supply?: { name?: string };
      }>
    >({
      method: 'GET',
      url: `${getApiUrl()}/supply-batches`,
      headers: authHeaders(token),
    })
    .then((res) => res.body);
}

export function listInventoryAllocations(token: string) {
  return cy
    .request<
      Array<{
        id: string;
        created_at?: string;
        status: string;
        destination: string;
      }>
    >({
      method: 'GET',
      url: `${getApiUrl()}/inventory-allocations`,
      headers: authHeaders(token),
    })
    .then((res) => res.body);
}

export function e2eSeedStandbyInventory(serial_number?: string) {
  return cy
    .request<{ id: string; serial_number: string; status: string }>({
      method: 'POST',
      url: `${getApiUrl()}/e2e/inventory/seed`,
      headers: e2eHeaders(),
      body: serial_number ? { serial_number } : {},
    })
    .then((res) => {
      expect(res.status).to.eq(201);
      return res.body;
    });
}

export function createInventoryItem(
  token: string,
  input: {
    name: string;
    serial_number: string;
    location_id: string;
    category_id: string;
    subcategory_id: string;
  },
) {
  return cy
    .request<{ id: string }>({
      method: 'POST',
      url: `${getApiUrl()}/inventory`,
      headers: authHeaders(token),
      body: {
        item: input.name,
        name: input.name,
        model: 'E2E-MODEL',
        serial_number: input.serial_number,
        finality: 'Teste E2E civil-date',
        acquisition_price: 100,
        acquisition_date: new Date().toISOString(),
        location_id: input.location_id,
        category_id: input.category_id,
        subcategory_id: input.subcategory_id,
        status: 'STANDBY',
        description: 'E2E civil-date inventory',
      },
      failOnStatusCode: false,
    })
    .then((res) => {
      if (res.status >= 400) {
        throw new Error(`create inventory failed ${res.status}: ${JSON.stringify(res.body)}`);
      }
      // Inventory.service may return { status: 400, message } without throwing.
      const body = res.body as { id?: string; status?: number; message?: string };
      if (!body.id || body.id === 'undefined' || body.status === 400) {
        throw new Error(`create inventory rejected: ${JSON.stringify(res.body)}`);
      }
      return { id: String(body.id) };
    });
}

export function createInventoryAllocation(
  token: string,
  input: {
    inventory_id: string;
    destination: string;
    return_date: string;
    delivery_deadline: string;
    notes?: string;
  },
) {
  return cy
    .request<{
      id: string;
      created_at: string;
      status: string;
    }>({
      method: 'POST',
      url: `${getApiUrl()}/inventory-allocations`,
      headers: authHeaders(token),
      body: input,
      failOnStatusCode: false,
    })
    .then((res) => {
      if (res.status >= 400) {
        throw new Error(`create allocation failed ${res.status}: ${JSON.stringify(res.body)}`);
      }
      return res.body;
    });
}

export function createPurchaseRequest(
  token: string,
  input: {
    justification: string;
    destination: string;
    delivery_deadline: string;
    items: Array<{ description: string; quantity: number; unit: string }>;
  },
) {
  return cy
    .request<{ id: string; created_at: string; display_code?: string }>({
      method: 'POST',
      url: `${getApiUrl()}/purchase-requests`,
      headers: authHeaders(token),
      body: {
        ...input,
        priority: 'NORMAL',
        notes: 'E2E civil-date SC',
      },
      failOnStatusCode: false,
    })
    .then((res) => {
      if (res.status >= 400) {
        throw new Error(`create SC failed ${res.status}: ${JSON.stringify(res.body)}`);
      }
      return res.body;
    });
}

export function createServiceOrder(
  token: string,
  input: {
    entry_date: string;
    serial_number: string;
    problem_reported?: string;
  },
) {
  return cy
    .request<{ id: string; entry_date: string }>({
      method: 'POST',
      url: `${getApiUrl()}/service-orders`,
      headers: authHeaders(token),
      body: {
        client_name: 'Cliente E2E Civil',
        equipment_description: 'Equipamento E2E',
        model: 'MOD-E2E',
        serial_number: input.serial_number,
        problem_reported: input.problem_reported ?? 'Problema E2E civil-date',
        entry_date: input.entry_date,
        service_type: 'Manutenção',
        notes: 'E2E civil-date OS',
        total_price: 0,
      },
      failOnStatusCode: false,
    })
    .then((res) => {
      if (res.status >= 400) {
        throw new Error(`create OS failed ${res.status}: ${JSON.stringify(res.body)}`);
      }
      return res.body;
    });
}

export function listDemandSuppliesByScOrigin(token: string) {
  return cy
    .request<{
      items: Array<{
        id: string;
        purchase_request_id?: string | null;
        aggregate_status: string;
        destination: string;
      }>;
      total: number;
    }>({
      method: 'GET',
      url: `${getApiUrl()}/demand-supplies?origin=sc&limit=50`,
      headers: authHeaders(token),
    })
    .then((res) => res.body);
}

export function getDemandSupplyDetail(token: string, id: string) {
  return cy
    .request<{
      id: string;
      purchase_request_id?: string | null;
      aggregate_status: string;
      items: Array<{
        id: string;
        status: string;
        supply_id?: string | null;
        requester_confirmation?: boolean;
        manager_delivery_confirmation?: boolean;
      }>;
    }>({
      method: 'GET',
      url: `${getApiUrl()}/demand-supplies/${id}`,
      headers: authHeaders(token),
    })
    .then((res) => res.body);
}
