import type {
  DeliveryReportPayloadDTO,
  DemandSupplyApprovalAction,
  DemandSupplyApprovalDTO,
  DemandSupplyDetailDTO,
  DemandSupplySummaryDTO,
  SupplyRequestDTO,
} from '@ti-assistant/contracts';

export interface DemandSupplyListFilters {
  user_id?: string;
  sector_id?: string;
  location_id?: string;
  locale_id?: string;
  search?: string;
  delivery_deadline_from?: string;
  delivery_deadline_to?: string;
  page?: number;
  limit?: number;
}

export interface DemandSupplyListResult {
  items: DemandSupplySummaryDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface SubmitApprovalResult {
  approval: DemandSupplyApprovalDTO;
  updated_items: SupplyRequestDTO[];
  failed_items: { supply_request_id: string; error: string }[];
}

export interface ConfirmApprovalBatchResult {
  updated_items: SupplyRequestDTO[];
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { error?: string; message?: string }).error ??
        (errData as { message?: string }).message ??
        'Erro na requisição de pedidos agrupados'
    );
  }
  return response.json();
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

function buildListQuery(filters: DemandSupplyListFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.user_id) params.set('user_id', filters.user_id);
  if (filters.sector_id) params.set('sector_id', filters.sector_id);
  if (filters.location_id) params.set('location_id', filters.location_id);
  if (filters.locale_id) params.set('locale_id', filters.locale_id);
  if (filters.search) params.set('search', filters.search);
  if (filters.delivery_deadline_from) {
    params.set('delivery_deadline_from', filters.delivery_deadline_from);
  }
  if (filters.delivery_deadline_to) {
    params.set('delivery_deadline_to', filters.delivery_deadline_to);
  }
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchDemandSupplies(
  token: string,
  filters: DemandSupplyListFilters = {}
): Promise<DemandSupplyListResult> {
  const response = await fetch(`/api/demand-supplies${buildListQuery(filters)}`, {
    headers: authHeaders(token),
  });
  return handleResponse<DemandSupplyListResult>(response);
}

export async function fetchDemandSupplyDetail(
  token: string,
  id: string
): Promise<DemandSupplyDetailDTO> {
  const response = await fetch(`/api/demand-supplies/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
  });
  return handleResponse<DemandSupplyDetailDTO>(response);
}

export async function submitApproval(
  token: string,
  demandSupplyId: string,
  action: DemandSupplyApprovalAction,
  supplyRequestIds: string[]
): Promise<SubmitApprovalResult> {
  const response = await fetch(
    `/api/demand-supplies/${encodeURIComponent(demandSupplyId)}/approvals`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        supply_request_ids: supplyRequestIds,
      }),
    }
  );
  return handleResponse<SubmitApprovalResult>(response);
}

export async function fetchDeliveryReportPayload(
  token: string,
  approvalId: string
): Promise<DeliveryReportPayloadDTO> {
  const response = await fetch(
    `/api/demand-supplies/approvals/${encodeURIComponent(approvalId)}/report`,
    { headers: authHeaders(token) }
  );
  return handleResponse<DeliveryReportPayloadDTO>(response);
}

export async function confirmApprovalBatchRequester(
  token: string,
  approvalId: string,
  confirmation: boolean
): Promise<ConfirmApprovalBatchResult> {
  const response = await fetch(
    `/api/demand-supplies/approvals/${encodeURIComponent(approvalId)}/requester-confirmation`,
    {
      method: 'PATCH',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmation }),
    }
  );
  return handleResponse<ConfirmApprovalBatchResult>(response);
}

export async function confirmApprovalBatchManager(
  token: string,
  approvalId: string,
  confirmation: boolean
): Promise<ConfirmApprovalBatchResult> {
  const response = await fetch(
    `/api/demand-supplies/approvals/${encodeURIComponent(approvalId)}/manager-delivery-confirmation`,
    {
      method: 'PATCH',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmation }),
    }
  );
  return handleResponse<ConfirmApprovalBatchResult>(response);
}

export async function fetchPendingConfirmations(
  token: string
): Promise<DemandSupplyApprovalDTO[]> {
  const response = await fetch('/api/demand-supplies/my/pending-confirmations', {
    headers: authHeaders(token),
  });
  return handleResponse<DemandSupplyApprovalDTO[]>(response);
}
