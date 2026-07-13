export type EligiblePurchaseRequestRef = {
  id: string;
};

export type ResolveInitialPurchaseRequestResult = {
  id: string | undefined;
  invalid: boolean;
};

/**
 * Decides whether a deep-link / preselected SC id is eligible for a new quote.
 * Eligible list must already be filtered (e.g. awaiting_quote).
 */
export function resolveInitialPurchaseRequestId(
  requestedId: string | undefined,
  eligibleItems: EligiblePurchaseRequestRef[],
): ResolveInitialPurchaseRequestResult {
  if (!requestedId) {
    return { id: undefined, invalid: false };
  }

  const found = eligibleItems.some((item) => item.id === requestedId);
  if (found) {
    return { id: requestedId, invalid: false };
  }

  return { id: undefined, invalid: true };
}
