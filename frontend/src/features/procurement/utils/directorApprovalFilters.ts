import type { PurchaseRequestDTO } from '@ti-assistant/contracts';

export function getPurchaseRequestCreatorId(item: PurchaseRequestDTO): string | undefined {
  const createdBy = item.created_by;
  if (createdBy && typeof createdBy === 'object' && 'id' in createdBy) {
    return createdBy.id;
  }
  return undefined;
}

/** Removes DRAFT purchase requests created by another user from director listings. */
export function filterDirectorVisiblePurchaseRequests(
  items: PurchaseRequestDTO[],
  currentUserId: string,
): PurchaseRequestDTO[] {
  return items.filter((item) => {
    if (item.status !== 'DRAFT') {
      return true;
    }

    const creatorId = getPurchaseRequestCreatorId(item);
    return creatorId === currentUserId;
  });
}
