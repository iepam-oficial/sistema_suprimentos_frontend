import type {
  CreatePaymentMethodInput,
  PaymentMethodDTO,
  UpdatePaymentMethodInput,
} from '@ti-assistant/contracts';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { error?: string; message?: string }).error ??
        (errData as { message?: string }).message ??
        'Erro na requisição de formas de pagamento',
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

export async function listPaymentMethods(
  token: string,
  activeOnly = false,
): Promise<PaymentMethodDTO[]> {
  const query = activeOnly ? '?active=true' : '';
  const response = await fetch(`/api/procurement/payment-methods${query}`, {
    headers: authHeaders(token),
  });
  return handleResponse<PaymentMethodDTO[]>(response);
}

export async function createPaymentMethod(
  token: string,
  input: CreatePaymentMethodInput,
): Promise<PaymentMethodDTO> {
  const response = await fetch('/api/procurement/payment-methods', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });
  return handleResponse<PaymentMethodDTO>(response);
}

export async function updatePaymentMethod(
  token: string,
  id: string,
  input: UpdatePaymentMethodInput,
): Promise<PaymentMethodDTO> {
  const response = await fetch(
    `/api/procurement/payment-methods/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: jsonHeaders(token),
      body: JSON.stringify(input),
    },
  );
  return handleResponse<PaymentMethodDTO>(response);
}

export async function setPaymentMethodActive(
  token: string,
  id: string,
  active: boolean,
): Promise<PaymentMethodDTO> {
  const response = await fetch(
    `/api/procurement/payment-methods/${encodeURIComponent(id)}/active`,
    {
      method: 'PATCH',
      headers: jsonHeaders(token),
      body: JSON.stringify({ active }),
    },
  );
  return handleResponse<PaymentMethodDTO>(response);
}
