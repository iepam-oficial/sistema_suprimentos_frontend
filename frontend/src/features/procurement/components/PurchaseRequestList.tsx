'use client';

import { PurchaseRequestListTable } from './purchase-request/PurchaseRequestListTable';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';

interface PurchaseRequestListProps {
  items: PurchaseRequestDTO[];
  loading?: boolean;
  showCreator?: boolean;
  onCreate?: () => void;
}

/** @deprecated Use PurchaseRequestListTable directly */
export function PurchaseRequestList({
  items,
  loading = false,
  showCreator = false,
  onCreate,
}: PurchaseRequestListProps) {
  return (
    <PurchaseRequestListTable
      items={items}
      loading={loading}
      showCreator={showCreator}
      onCreate={onCreate}
    />
  );
}
