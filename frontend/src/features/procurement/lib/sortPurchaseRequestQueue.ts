import type { PurchaseRequestDTO, PurchaseRequestPriority } from '@ti-assistant/contracts';

const PRIORITY_ORDER: Record<PurchaseRequestPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function hasClassAItem(request: PurchaseRequestDTO): boolean {
  return request.items.some((item) => item.abc_classification === 'A');
}

/** Sort purchase-request queue: priority DESC → Class A tie-break → created_at ASC. */
export function sortPurchaseRequestQueue(items: PurchaseRequestDTO[]): PurchaseRequestDTO[] {
  return [...items].sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    const classADiff = Number(hasClassAItem(b)) - Number(hasClassAItem(a));
    if (classADiff !== 0) return classADiff;

    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}
