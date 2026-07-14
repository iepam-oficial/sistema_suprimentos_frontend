import type {
  DeclineQuoteInviteInput,
  PortalQuoteInviteContextDTO,
  PortalQuotePdfSuggestionsDTO,
  ProcurementQuoteProposalDTO,
  SubmitProcurementProposalInput,
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
  return `/api/public/procurement/cotacao/${encodeURIComponent(token)}`;
}

export async function fetchPortalQuoteInvite(
  token: string
): Promise<PortalQuoteInviteContextDTO> {
  const response = await fetch(tokenPath(token));
  return handleResponse<PortalQuoteInviteContextDTO>(response);
}

export async function acceptPortalQuoteInvite(
  token: string
): Promise<PortalQuoteInviteContextDTO> {
  const response = await fetch(`${tokenPath(token)}/accept`, { method: 'POST' });
  return handleResponse<PortalQuoteInviteContextDTO>(response);
}

export async function declinePortalQuoteInvite(
  token: string,
  input?: DeclineQuoteInviteInput
): Promise<PortalQuoteInviteContextDTO> {
  const response = await fetch(`${tokenPath(token)}/decline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input ?? {}),
  });
  return handleResponse<PortalQuoteInviteContextDTO>(response);
}

export async function submitPortalQuoteProposal(
  token: string,
  input: SubmitProcurementProposalInput,
  file?: File,
): Promise<ProcurementQuoteProposalDTO> {
  if (file) {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(input));
    formData.append('file', file);

    const response = await fetch(`${tokenPath(token)}/proposal`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<ProcurementQuoteProposalDTO>(response);
  }

  const response = await fetch(`${tokenPath(token)}/proposal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<ProcurementQuoteProposalDTO>(response);
}

export async function revisePortalQuoteProposal(
  token: string,
  input: SubmitProcurementProposalInput,
  file?: File,
): Promise<ProcurementQuoteProposalDTO> {
  if (file) {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(input));
    formData.append('file', file);

    const response = await fetch(`${tokenPath(token)}/proposal`, {
      method: 'PUT',
      body: formData,
    });
    return handleResponse<ProcurementQuoteProposalDTO>(response);
  }

  const response = await fetch(`${tokenPath(token)}/proposal`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<ProcurementQuoteProposalDTO>(response);
}

export async function extractPortalQuotePdf(
  token: string,
  file: File
): Promise<PortalQuotePdfSuggestionsDTO> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${tokenPath(token)}/extract-pdf`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<PortalQuotePdfSuggestionsDTO>(response);
}
