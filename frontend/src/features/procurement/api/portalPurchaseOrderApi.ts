import type {
  PortalPurchaseOrderContextDTO,
  RespondPurchaseOrderInput,
} from '@ti-assistant/contracts';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { error?: string; message?: string }).error ??
        (errData as { message?: string }).message ??
        'Erro na requisição'
    );
  }
  return response.json();
}

function tokenPath(token: string): string {
  return `/api/public/procurement/pedido/${encodeURIComponent(token)}`;
}

export async function fetchPortalPurchaseOrder(
  token: string
): Promise<PortalPurchaseOrderContextDTO> {
  const response = await fetch(tokenPath(token));
  return handleResponse<PortalPurchaseOrderContextDTO>(response);
}

export async function respondPortalPurchaseOrder(
  token: string,
  input: RespondPurchaseOrderInput
): Promise<PortalPurchaseOrderContextDTO> {
  const response = await fetch(tokenPath(token), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<PortalPurchaseOrderContextDTO>(response);
}
