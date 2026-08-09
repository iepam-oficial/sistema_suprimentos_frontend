import {
  countChangedItems,
  type MenuBadgeSnapshotItem,
} from './menuBadgeDiff';
import { isAbsolutePendingRoute, type MenuBadgeRouteKey } from './menuBadgeRoutes';

export type ResolvePollCountInput = {
  routeKey: MenuBadgeRouteKey;
  /** List API `total` when available */
  total?: number | null;
  itemsLength: number;
  /** Diff-mode only; `null` means no baseline yet (seed → count 0) */
  baseline: MenuBadgeSnapshotItem[] | null;
  currentItems: MenuBadgeSnapshotItem[];
};

/**
 * Resolves the stored badge count after a poll/refresh.
 * Absolute routes: pending total (never seed to 0 on first poll).
 * Diff routes: changed items vs baseline; null baseline → 0.
 */
export function resolvePollCount(input: ResolvePollCountInput): number {
  if (isAbsolutePendingRoute(input.routeKey)) {
    if (typeof input.total === 'number' && Number.isFinite(input.total) && input.total >= 0) {
      return input.total;
    }
    return input.itemsLength;
  }

  if (input.baseline == null) {
    return 0;
  }

  return countChangedItems(input.baseline, input.currentItems);
}

export type DisplayCountInput = {
  raw: number;
  routeActive: boolean;
  aggregate?: boolean;
};

/** Item badge hides on active route; aggregate (group sum) keeps raw. */
export function displayCount(input: DisplayCountInput): number {
  if (input.routeActive && !input.aggregate) {
    return 0;
  }
  return input.raw;
}
