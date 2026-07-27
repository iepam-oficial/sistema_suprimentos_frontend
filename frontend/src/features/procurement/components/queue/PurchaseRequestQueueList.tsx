'use client';

import { PurchaseRequestListTable } from '../purchase-request/PurchaseRequestListTable';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';

interface PurchaseRequestQueueListProps {
  items: PurchaseRequestDTO[];
  loading?: boolean;
  error?: string | null;
}

export function PurchaseRequestQueueList({
  items,
  loading = false,
  error = null,
}: PurchaseRequestQueueListProps) {
  return (
    <PurchaseRequestListTable
      items={items}
      loading={loading}
      error={error}
      emptyMessage="Nenhuma solicitação aguardando cotação."
      showCreator
      getDetailHref={(id) => `/procurement/fila-compras/${id}`}
    />
  );
}
