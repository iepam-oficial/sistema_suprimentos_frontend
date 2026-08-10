import type {
  ClassifyInvoiceLinesInput,
  ConfirmInvoiceLinesInput,
  CreateGoodsReceiptInput,
  FinalizeGoodsReceiptResultDTO,
  GoodsReceiptDTO,
  PatchGoodsReceiptInvoiceLineFiscalInput,
  ResolveDiscrepanciesBatchInput,
  ResolveDiscrepanciesBatchResult,
  ResolveDiscrepancyInput,
  SaveInventoryLinesInput,
  SavePhysicalLinesInput,
  UploadInvoiceResultDTO,
} from '@ti-assistant/contracts';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { error?: string; message?: string }).error ??
        (errData as { message?: string }).message ??
        'Erro na requisição de recebimento'
    );
  }
  return response.json();
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

function jsonHeaders(token: string): HeadersInit {
  return {
    ...authHeaders(token),
    'Content-Type': 'application/json',
  };
}

export async function createGoodsReceipt(
  token: string,
  input: CreateGoodsReceiptInput
): Promise<GoodsReceiptDTO> {
  const response = await fetch('/api/goods-receipts', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });
  return handleResponse<GoodsReceiptDTO>(response);
}

export async function fetchGoodsReceiptById(
  token: string,
  id: string,
  options?: { polling?: boolean }
): Promise<GoodsReceiptDTO> {
  const headers: HeadersInit = {
    ...authHeaders(token),
    ...(options?.polling === true ? { 'X-Polling': '1' } : {}),
  };
  const response = await fetch(`/api/goods-receipts/${encodeURIComponent(id)}`, {
    headers,
  });
  return handleResponse<GoodsReceiptDTO>(response);
}

export async function savePhysicalLines(
  token: string,
  id: string,
  input: SavePhysicalLinesInput
): Promise<GoodsReceiptDTO> {
  const response = await fetch(`/api/goods-receipts/${encodeURIComponent(id)}/physical-lines`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });
  return handleResponse<GoodsReceiptDTO>(response);
}

export async function uploadGoodsReceiptInvoice(
  token: string,
  id: string,
  file: File
): Promise<UploadInvoiceResultDTO> {
  const formData = new FormData();
  formData.append('invoice', file);

  const response = await fetch(`/api/goods-receipts/${encodeURIComponent(id)}/invoice`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });
  return handleResponse<UploadInvoiceResultDTO>(response);
}

export async function confirmGoodsReceiptInvoiceLines(
  token: string,
  id: string,
  input: ConfirmInvoiceLinesInput
): Promise<GoodsReceiptDTO> {
  const response = await fetch(
    `/api/goods-receipts/${encodeURIComponent(id)}/confirm-invoice-lines`,
    {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(input),
    }
  );
  return handleResponse<GoodsReceiptDTO>(response);
}

export async function suggestGoodsReceiptSupplyMappings(
  token: string,
  id: string
): Promise<GoodsReceiptDTO> {
  const response = await fetch(
    `/api/goods-receipts/${encodeURIComponent(id)}/suggest-supply-mappings`,
    {
      method: 'POST',
      headers: authHeaders(token),
    }
  );
  return handleResponse<GoodsReceiptDTO>(response);
}

export async function classifyInvoiceLines(
  token: string,
  id: string,
  input: ClassifyInvoiceLinesInput
): Promise<GoodsReceiptDTO> {
  const response = await fetch(
    `/api/goods-receipts/${encodeURIComponent(id)}/invoice-lines/classify`,
    {
      method: 'PUT',
      headers: jsonHeaders(token),
      body: JSON.stringify(input),
    }
  );
  return handleResponse<GoodsReceiptDTO>(response);
}

export async function patchGoodsReceiptInvoiceLineFiscal(
  token: string,
  id: string,
  input: PatchGoodsReceiptInvoiceLineFiscalInput
): Promise<GoodsReceiptDTO> {
  const response = await fetch(
    `/api/goods-receipts/${encodeURIComponent(id)}/invoice-lines/fiscal`,
    {
      method: 'PATCH',
      headers: jsonHeaders(token),
      body: JSON.stringify(input),
    }
  );
  return handleResponse<GoodsReceiptDTO>(response);
}

export async function saveInventoryLines(
  token: string,
  id: string,
  input: SaveInventoryLinesInput
): Promise<GoodsReceiptDTO> {
  const response = await fetch(`/api/goods-receipts/${encodeURIComponent(id)}/inventory-lines`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });
  return handleResponse<GoodsReceiptDTO>(response);
}

export async function runGoodsReceiptComparison(
  token: string,
  id: string
): Promise<GoodsReceiptDTO> {
  const response = await fetch(`/api/goods-receipts/${encodeURIComponent(id)}/compare`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return handleResponse<GoodsReceiptDTO>(response);
}

export async function resolveGoodsReceiptDiscrepancy(
  token: string,
  receiptId: string,
  discrepancyId: string,
  input: ResolveDiscrepancyInput
): Promise<GoodsReceiptDTO> {
  const response = await fetch(
    `/api/goods-receipts/${encodeURIComponent(receiptId)}/discrepancies/${encodeURIComponent(discrepancyId)}/resolve`,
    {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(input),
    }
  );
  return handleResponse<GoodsReceiptDTO>(response);
}

export async function resolveGoodsReceiptDiscrepanciesBatch(
  token: string,
  receiptId: string,
  input: ResolveDiscrepanciesBatchInput
): Promise<ResolveDiscrepanciesBatchResult> {
  const response = await fetch(
    `/api/goods-receipts/${encodeURIComponent(receiptId)}/discrepancies/resolve-batch`,
    {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(input),
    }
  );
  return handleResponse<ResolveDiscrepanciesBatchResult>(response);
}

export async function directorApproveGoodsReceipt(
  token: string,
  id: string
): Promise<GoodsReceiptDTO> {
  const response = await fetch(
    `/api/goods-receipts/${encodeURIComponent(id)}/director-approve`,
    {
      method: 'POST',
      headers: authHeaders(token),
    }
  );
  return handleResponse<GoodsReceiptDTO>(response);
}

export async function finalizeGoodsReceipt(
  token: string,
  id: string
): Promise<FinalizeGoodsReceiptResultDTO> {
  const response = await fetch(`/api/goods-receipts/${encodeURIComponent(id)}/finalize`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return handleResponse<FinalizeGoodsReceiptResultDTO>(response);
}

export async function reprocessGoodsReceiptInternalDelivery(
  token: string,
  id: string
): Promise<FinalizeGoodsReceiptResultDTO> {
  const response = await fetch(
    `/api/goods-receipts/${encodeURIComponent(id)}/reprocess-internal-delivery`,
    {
      method: 'POST',
      headers: authHeaders(token),
    }
  );
  return handleResponse<FinalizeGoodsReceiptResultDTO>(response);
}
