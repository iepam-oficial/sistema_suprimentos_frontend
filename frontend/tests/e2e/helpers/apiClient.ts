import path from 'node:path';
import { By, type WebDriver } from 'selenium-webdriver';
import { getApiUrl, getE2eSecret } from './constants';

export interface ResetResult {
  ok: boolean;
  supplyId: string;
  supplierIds: string[];
}

export class E2eApiClient {
  constructor(
    private readonly apiUrl = getApiUrl(),
    private readonly secret = getE2eSecret(),
  ) {}

  private async request<T>(method: string, pathName: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.apiUrl}${pathName}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-E2E-Secret': this.secret,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${method} ${pathName} failed (${response.status}): ${text}`);
    }

    return response.json() as Promise<T>;
  }

  private async authRequest<T>(
    method: string,
    pathName: string,
    token: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${this.apiUrl}${pathName}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${method} ${pathName} failed (${response.status}): ${text}`);
    }

    return response.json() as Promise<T>;
  }

  async reset(): Promise<ResetResult> {
    return this.request<ResetResult>('POST', '/e2e/reset');
  }

  async login(email: string, password: string): Promise<{ token: string; user: { id: string } }> {
    const response = await fetch(`${this.apiUrl}/users/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      throw new Error(`Login failed: ${await response.text()}`);
    }
    return response.json();
  }

  async getQuotePortalTokens(quoteId: string): Promise<Record<string, string>> {
    const data = await this.request<{ byInviteId: Record<string, string> }>(
      'GET',
      `/e2e/procurement/quotes/${quoteId}/portal-tokens`,
    );
    return data.byInviteId;
  }

  async getOrderPortalToken(orderId: string): Promise<string> {
    const data = await this.request<{ token: string | null }>(
      'GET',
      `/e2e/procurement/orders/${orderId}/portal-token`,
    );
    if (!data.token) {
      throw new Error(`Portal token not found for order ${orderId}`);
    }
    return data.token;
  }

  async getPurchaseRequest(id: string) {
    return this.request<{ id: string; status: string }>(
      'GET',
      `/e2e/procurement/purchase-requests/${id}`,
    );
  }

  async getGoodsReceipt(id: string) {
    return this.request<{
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
    }>('GET', `/e2e/goods-receipts/${id}`);
  }

  async getSupplyBalance(supplyId: string) {
    return this.request<{
      balance: number;
      batches: Array<{ id: string; purchased_quantity: number; origin: string | null }>;
    }>('GET', `/e2e/supplies/${supplyId}/balance`);
  }

  async getSupplyBatch(token: string, batchId: string) {
    return this.authRequest<{
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
    }>('GET', `/supply-batches/${batchId}`, token);
  }

  async getSupplyFiscal(supplyId: string) {
    return this.request<{
      id: string;
      ncm_id: string | null;
      fiscalNcm: { code: string } | null;
    }>('GET', `/e2e/supplies/${supplyId}/fiscal`);
  }

  async getSupplyRequest(id: string) {
    return this.request<{
      id: string;
      status: string;
      requester_confirmation: boolean;
      manager_delivery_confirmation: boolean;
    }>('GET', `/e2e/supply-requests/${id}`);
  }

  async createSupplyRequest(
    token: string,
    input: {
      supply_id: string;
      quantity: number;
      destination: string;
    },
  ) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    return this.authRequest<{ id: string; status: string }>('POST', '/supply-requests', token, {
      ...input,
      delivery_deadline: deadline.toISOString(),
      notes: 'E2E supply request',
    });
  }

  async approveSupplyRequest(token: string, requestId: string) {
    return this.authRequest('PUT', `/supply-requests/${requestId}`, token, {
      status: 'APPROVED',
    });
  }

  async listPurchaseOrders(token: string) {
    return this.authRequest<{ items: { id: string; status: string; display_code: string }[] }>(
      'GET',
      '/purchase-orders?limit=20',
      token,
    );
  }

  async listPurchaseRequests(token: string, status?: string) {
    const query = status ? `?status=${status}&limit=50` : '?limit=50';
    return this.authRequest<{ items: { id: string; status: string; display_code: string }[] }>(
      'GET',
      `/purchase-requests${query}`,
      token,
    );
  }
}

export async function uploadFileToInput(
  driver: WebDriver,
  inputSelector: string,
  absolutePath: string,
): Promise<void> {
  const input = await driver.findElement(By.css(inputSelector));
  await input.sendKeys(absolutePath);
}
