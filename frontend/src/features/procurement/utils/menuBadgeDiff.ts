export type MenuBadgeSnapshotItem = {
  id: string;
  fingerprint: string;
};

/**
 * Counts items that are new (id not in baseline) or altered (fingerprint changed).
 * Removals do not increment the count.
 */
export function countChangedItems(
  baseline: MenuBadgeSnapshotItem[],
  current: MenuBadgeSnapshotItem[],
): number {
  const baselineById = new Map(baseline.map((item) => [item.id, item.fingerprint]));
  let count = 0;

  for (const item of current) {
    const previous = baselineById.get(item.id);
    if (previous === undefined || previous !== item.fingerprint) {
      count += 1;
    }
  }

  return count;
}

export function fingerprintPurchaseRequest(item: {
  id: string;
  status: string;
  updated_at: string;
  priority?: string;
}): MenuBadgeSnapshotItem {
  const priority = item.priority ?? '';
  return {
    id: item.id,
    fingerprint: `${item.status}|${item.updated_at}|${priority}`,
  };
}

export function fingerprintQuote(item: {
  id: string;
  status: string;
  updated_at: string;
}): MenuBadgeSnapshotItem {
  return {
    id: item.id,
    fingerprint: `${item.status}|${item.updated_at}`,
  };
}

export function fingerprintPurchaseOrder(item: {
  id: string;
  status: string;
  created_at?: string;
  sent_at?: string | null;
  responded_at?: string | null;
  updated_at?: string;
}): MenuBadgeSnapshotItem {
  const stamp =
    item.updated_at ??
    item.responded_at ??
    item.sent_at ??
    item.created_at ??
    '';
  return {
    id: item.id,
    fingerprint: `${item.status}|${stamp}`,
  };
}
