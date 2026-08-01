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

export function listPurchaseOrders(token: string) {
  return cy
    .request<{ items: { id: string; status: string; display_code: string }[] }>({
      method: 'GET',
      url: `${getApiUrl()}/purchase-orders?limit=20`,
      headers: authHeaders(token),
    })
    .then((res) => res.body);
}

export function listPurchaseRequests(token: string, status?: string) {
  const query = status ? `?status=${status}&limit=50` : '?limit=50';
  return cy
    .request<{ items: { id: string; status: string; display_code: string }[] }>({
      method: 'GET',
      url: `${getApiUrl()}/purchase-requests${query}`,
      headers: authHeaders(token),
    })
    .then((res) => res.body);
}
